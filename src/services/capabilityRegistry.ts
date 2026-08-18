import type { UniversalCapabilityDescriptor } from './universalCapabilityProtocol.js';

export interface CapabilityActionMetadata {
  label?: string;
  description?: string;
  risk?: UniversalCapabilityDescriptor['risk'];
  confirmationRequired?: boolean;
  permissions?: string[];
  activationState?: UniversalCapabilityDescriptor['activationState'];
}

export interface CapabilityRegistration {
  descriptor: UniversalCapabilityDescriptor;
  namespace?: string;
  version?: string;
  aliases?: string[];
  requiresCapabilities?: string[];
  providesCapabilities?: string[];
  source?: string;
  actionMetadata?: Record<string, CapabilityActionMetadata>;
}

export interface CapabilityComposition {
  requested: string[];
  ordered: CapabilityRegistration[];
  unresolved: string[];
  cycle?: string[];
}

const registry = new Map<string, CapabilityRegistration>();
const aliasIndex = new Map<string, string>();

function normalizeName(value: string): string {
  return String(value || '').trim().toLowerCase();
}

function normalizeActionMetadata(metadata: Record<string, CapabilityActionMetadata> | undefined): Record<string, CapabilityActionMetadata> {
  return Object.fromEntries(Object.entries(metadata || {}).map(([action, value]) => [
    String(action || '').trim().toLowerCase(), {
      ...(value || {}),
      permissions: [...new Set((value?.permissions || []).map(String).filter(Boolean))],
    },
  ]).filter(([action]) => Boolean(action)));
}

function cloneRegistration(registration: CapabilityRegistration): CapabilityRegistration {
  return {
    ...registration,
    descriptor: { ...registration.descriptor, actions: [...registration.descriptor.actions], owner: [...registration.descriptor.owner], permissions: [...registration.descriptor.permissions] },
    aliases: [...(registration.aliases || [])],
    requiresCapabilities: [...(registration.requiresCapabilities || [])],
    providesCapabilities: [...(registration.providesCapabilities || [])],
    actionMetadata: Object.fromEntries(Object.entries(registration.actionMetadata || {}).map(([action, metadata]) => [action, { ...metadata, permissions: [...(metadata.permissions || [])] }])),
  };
}

export function registerCapability(registration: CapabilityRegistration): CapabilityRegistration {
  const name = normalizeName(registration.descriptor.capability);
  if (!name) throw new Error('Capability registration requires a non-empty capability name.');
  if (!registration.descriptor.actions.length) throw new Error(`Capability ${name} must expose at least one action.`);
  const normalizedAliases = [...new Set((registration.aliases || []).map(normalizeName).filter(alias => alias && alias !== name))];
  for (const alias of normalizedAliases) {
    const existing = aliasIndex.get(alias);
    if (existing && existing !== name) throw new Error(`Capability alias ${alias} is already owned by ${existing}.`);
  }
  const value: CapabilityRegistration = {
    ...registration,
    namespace: registration.namespace || 'kurukoo',
    version: registration.version || '1',
    aliases: normalizedAliases,
    requiresCapabilities: [...new Set((registration.requiresCapabilities || []).map(normalizeName).filter(Boolean))],
    providesCapabilities: [...new Set((registration.providesCapabilities || []).map(normalizeName).filter(Boolean))],
    source: registration.source || 'core',
    actionMetadata: normalizeActionMetadata(registration.actionMetadata),
  };
  registry.set(name, value);
  for (const alias of normalizedAliases) aliasIndex.set(alias, name);
  return cloneRegistration(value);
}

export function registerCapabilities(registrations: CapabilityRegistration[]): void {
  for (const registration of registrations) registerCapability(registration);
}

export function extendCapabilityActions(name: string, actions: string[], actionMetadata?: Record<string, CapabilityActionMetadata>): CapabilityRegistration {
  const normalized = normalizeName(name);
  const canonicalName = registry.has(normalized) ? normalized : aliasIndex.get(normalized);
  if (!canonicalName) throw new Error(`Cannot extend unknown capability ${normalized}.`);
  const registration = registry.get(canonicalName);
  if (!registration) throw new Error(`Capability ${canonicalName} is unavailable.`);
  const nextActions = [...new Set([...registration.descriptor.actions, ...actions.map(action => String(action || '').trim()).filter(Boolean)])];
  const mergedMetadata = { ...(registration.actionMetadata || {}), ...normalizeActionMetadata(actionMetadata) };
  registration.descriptor = {
    ...registration.descriptor,
    actions: nextActions,
    nextAllowedActions: [...new Set([...registration.descriptor.nextAllowedActions, ...nextActions])],
    permissions: [...new Set([...registration.descriptor.permissions, ...Object.values(mergedMetadata).flatMap(metadata => metadata.permissions || [])])],
    confirmationRequired: registration.descriptor.confirmationRequired || Object.values(mergedMetadata).some(metadata => metadata.confirmationRequired === true),
    consentRequired: registration.descriptor.consentRequired || Object.values(mergedMetadata).some(metadata => metadata.confirmationRequired === true || (metadata.permissions || []).includes('explicit_user_consent')),
    risk: Object.values(mergedMetadata).some(metadata => metadata.risk === 'high_risk') ? 'high_risk' : Object.values(mergedMetadata).some(metadata => metadata.risk === 'confirmation_required') ? 'confirmation_required' : registration.descriptor.risk,
    owner: [...new Set([...registration.descriptor.owner, ...Object.keys(mergedMetadata).flatMap(() => [])])],
  };
  registration.actionMetadata = mergedMetadata;
  registry.set(canonicalName, registration);
  return cloneRegistration(registration);
}

export function getCapabilityRegistration(name: string): CapabilityRegistration | undefined {
  const normalized = normalizeName(name);
  const canonicalName = registry.has(normalized) ? normalized : aliasIndex.get(normalized);
  const registration = canonicalName ? registry.get(canonicalName) : undefined;
  return registration ? cloneRegistration(registration) : undefined;
}

export function listCapabilityRegistrations(): CapabilityRegistration[] {
  return [...registry.values()].map(cloneRegistration);
}

export function listRegisteredCapabilityNames(): string[] {
  return [...registry.keys()].sort();
}

export function resolveCapabilityComposition(names: string[]): CapabilityComposition {
  const requested = [...new Set(names.map(normalizeName).filter(Boolean))];
  const ordered: CapabilityRegistration[] = [];
  const unresolved: string[] = [];
  const visiting = new Set<string>();
  const visited = new Set<string>();
  const cycle: string[] = [];

  const visit = (rawName: string) => {
    const registration = getCapabilityRegistration(rawName);
    if (!registration) { unresolved.push(rawName); return; }
    const canonical = normalizeName(registration.descriptor.capability);
    if (visited.has(canonical)) return;
    if (visiting.has(canonical)) { cycle.push(canonical); return; }
    visiting.add(canonical);
    for (const dependency of registration.requiresCapabilities || []) visit(dependency);
    visiting.delete(canonical);
    visited.add(canonical);
    ordered.push(registration);
  };

  requested.forEach(visit);
  return { requested, ordered, unresolved: [...new Set(unresolved)], cycle: cycle.length ? [...new Set(cycle)] : undefined };
}

export function validateCapabilityRegistry(): { valid: boolean; duplicateAliases: string[]; unresolvedDependencies: Array<{ capability: string; dependency: string }>; cycles: string[][] } {
  const duplicateAliases: string[] = [];
  const unresolvedDependencies: Array<{ capability: string; dependency: string }> = [];
  for (const registration of registry.values()) {
    for (const alias of registration.aliases || []) {
      const owner = aliasIndex.get(alias);
      if (owner !== registration.descriptor.capability) duplicateAliases.push(alias);
    }
    for (const dependency of registration.requiresCapabilities || []) {
      if (!getCapabilityRegistration(dependency)) unresolvedDependencies.push({ capability: registration.descriptor.capability, dependency });
    }
  }
  const cycles: string[][] = [];
  for (const registration of registry.values()) {
    const composition = resolveCapabilityComposition([registration.descriptor.capability]);
    if (composition.cycle?.length) cycles.push(composition.cycle);
  }
  return { valid: duplicateAliases.length === 0 && unresolvedDependencies.length === 0 && cycles.length === 0, duplicateAliases, unresolvedDependencies, cycles };
}

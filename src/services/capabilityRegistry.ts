import type { UniversalCapabilityDescriptor, CapabilityRisk } from './universalCapabilityProtocol.js';

export interface CapabilityActionContract {
  action: string;
  risk: CapabilityRisk;
  confirmationRequired: boolean;
  permissions: string[];
  activationState: UniversalCapabilityDescriptor['activationState'];
  owner: string[];
}

export interface CapabilityRegistration {
  descriptor: UniversalCapabilityDescriptor;
  namespace?: string;
  version?: string;
  aliases?: string[];
  requiresCapabilities?: string[];
  providesCapabilities?: string[];
  source?: string;
  actionContracts?: CapabilityActionContract[];
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

function cloneRegistration(registration: CapabilityRegistration): CapabilityRegistration {
  return {
    ...registration,
    descriptor: { ...registration.descriptor, actions: [...registration.descriptor.actions], owner: [...registration.descriptor.owner], permissions: [...registration.descriptor.permissions], nextAllowedActions: [...registration.descriptor.nextAllowedActions] },
    aliases: [...(registration.aliases || [])],
    requiresCapabilities: [...(registration.requiresCapabilities || [])],
    providesCapabilities: [...(registration.providesCapabilities || [])],
    actionContracts: (registration.actionContracts || []).map(contract => ({ ...contract, permissions: [...contract.permissions], owner: [...contract.owner] })),
  };
}

function defaultActionContract(descriptor: UniversalCapabilityDescriptor, action: string): CapabilityActionContract {
  const normalized = String(action || '').trim();
  const readOnly = new Set(['inspect', 'status', 'read', 'open', 'view', 'context', 'discover', 'check_availability', 'quote', 'verify', 'track', 'history', 'balance']).has(normalized.toLowerCase());
  return {
    action: normalized,
    risk: readOnly ? 'read_only' : descriptor.risk,
    confirmationRequired: readOnly ? false : descriptor.confirmationRequired,
    permissions: [...descriptor.permissions],
    activationState: descriptor.activationState,
    owner: [...descriptor.owner],
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
  const existingContracts = registration.actionContracts || [];
  const contractMap = new Map(existingContracts.map(contract => [normalizeName(contract.action), contract]));
  for (const action of registration.descriptor.actions) {
    const key = normalizeName(action);
    if (!contractMap.has(key)) contractMap.set(key, defaultActionContract(registration.descriptor, action));
  }
  const value: CapabilityRegistration = {
    ...registration,
    namespace: registration.namespace || 'kurukoo',
    version: registration.version || '1',
    aliases: normalizedAliases,
    requiresCapabilities: [...new Set((registration.requiresCapabilities || []).map(normalizeName).filter(Boolean))],
    providesCapabilities: [...new Set((registration.providesCapabilities || []).map(normalizeName).filter(Boolean))],
    source: registration.source || 'core',
    actionContracts: [...contractMap.values()],
  };
  registry.set(name, value);
  for (const alias of normalizedAliases) aliasIndex.set(alias, name);
  return cloneRegistration(value);
}

export function registerCapabilities(registrations: CapabilityRegistration[]): void {
  for (const registration of registrations) registerCapability(registration);
}

export function extendCapabilityActions(name: string, actions: string[], contracts: CapabilityActionContract[] = []): CapabilityRegistration {
  const normalized = normalizeName(name);
  const canonicalName = registry.has(normalized) ? normalized : aliasIndex.get(normalized);
  if (!canonicalName) throw new Error(`Cannot extend unknown capability ${normalized}.`);
  const registration = registry.get(canonicalName);
  if (!registration) throw new Error(`Capability ${canonicalName} is unavailable.`);
  const nextActions = [...new Set([...registration.descriptor.actions, ...actions.map(action => String(action || '').trim()).filter(Boolean)])];
  const contractMap = new Map((registration.actionContracts || []).map(contract => [normalizeName(contract.action), contract]));
  for (const action of actions) {
    const key = normalizeName(action);
    if (!contractMap.has(key)) contractMap.set(key, defaultActionContract(registration.descriptor, action));
  }
  for (const contract of contracts) {
    contractMap.set(normalizeName(contract.action), { ...contract, permissions: [...contract.permissions], owner: [...contract.owner] });
  }
  registration.descriptor = { ...registration.descriptor, actions: nextActions, nextAllowedActions: [...new Set([...registration.descriptor.nextAllowedActions, ...nextActions])] };
  registration.actionContracts = [...contractMap.values()];
  registry.set(canonicalName, registration);
  return cloneRegistration(registration);
}

export function getCapabilityActionContract(name: string, action: string): CapabilityActionContract | undefined {
  const registration = getCapabilityRegistration(name);
  if (!registration) return undefined;
  const normalizedAction = normalizeName(action);
  return registration.actionContracts?.find(contract => normalizeName(contract.action) === normalizedAction) || (registration.descriptor.actions.some(item => normalizeName(item) === normalizedAction) ? defaultActionContract(registration.descriptor, action) : undefined);
}

export function listCapabilityActionContracts(name: string): CapabilityActionContract[] {
  return getCapabilityRegistration(name)?.actionContracts || [];
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

export function validateCapabilityRegistry(): { valid: boolean; duplicateAliases: string[]; unresolvedDependencies: Array<{ capability: string; dependency: string }>; cycles: string[][]; invalidActionContracts: Array<{ capability: string; action: string; reason: string }> } {
  const duplicateAliases: string[] = [];
  const unresolvedDependencies: Array<{ capability: string; dependency: string }> = [];
  const invalidActionContracts: Array<{ capability: string; action: string; reason: string }> = [];
  for (const registration of registry.values()) {
    for (const alias of registration.aliases || []) {
      const owner = aliasIndex.get(alias);
      if (owner !== registration.descriptor.capability) duplicateAliases.push(alias);
    }
    for (const dependency of registration.requiresCapabilities || []) {
      if (!getCapabilityRegistration(dependency)) unresolvedDependencies.push({ capability: registration.descriptor.capability, dependency });
    }
    const declared = new Set(registration.descriptor.actions.map(normalizeName));
    for (const contract of registration.actionContracts || []) {
      const action = normalizeName(contract.action);
      if (!declared.has(action)) invalidActionContracts.push({ capability: registration.descriptor.capability, action, reason: 'action_not_declared' });
      if (contract.confirmationRequired && contract.risk === 'read_only') invalidActionContracts.push({ capability: registration.descriptor.capability, action, reason: 'read_only_confirmation_conflict' });
      if (contract.permissions.length === 0) invalidActionContracts.push({ capability: registration.descriptor.capability, action, reason: 'missing_permissions' });
    }
  }
  const cycles: string[][] = [];
  for (const registration of registry.values()) {
    const composition = resolveCapabilityComposition([registration.descriptor.capability]);
    if (composition.cycle?.length) cycles.push(composition.cycle);
  }
  return { valid: duplicateAliases.length === 0 && unresolvedDependencies.length === 0 && cycles.length === 0 && invalidActionContracts.length === 0, duplicateAliases, unresolvedDependencies, cycles, invalidActionContracts };
}

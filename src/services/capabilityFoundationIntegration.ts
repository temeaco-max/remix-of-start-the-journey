import { ensureCapabilityFoundation } from './capabilityFoundation.js';
import { getCapabilityRegistration, listCapabilityRegistrations, resolveCapabilityComposition, validateCapabilityRegistry } from './capabilityRegistry.js';
import { listCapabilityExecutionAdapters } from './capabilityExtensionService.js';

export type CapabilityRuntimeSnapshot = {
  capabilityCount: number;
  skillCount: number;
  operationCount: number;
  agentToolCount: number;
  adapterCount: number;
  activationCounts: Record<string, number>;
  familyCounts: Record<string, number>;
  invalid: ReturnType<typeof validateCapabilityRegistry>;
};

export function resolveSkillCapabilityPlan(skill: string): string[] {
  ensureCapabilityFoundation();
  const registration = getCapabilityRegistration(`skill.${String(skill || '').trim().toLowerCase()}`);
  if (!registration) return [];
  const composition = resolveCapabilityComposition([registration.descriptor.capability]);
  if (composition.unresolved.length || composition.cycle?.length) return [];
  return composition.ordered
    .filter(item => item.descriptor.capability !== registration.descriptor.capability)
    .map(item => item.descriptor.capability);
}

export function resolveCapabilityDependencies(skill: string): string[] {
  return resolveSkillCapabilityPlan(skill);
}

export function resolveSkillCapabilityComposition(skill: string) {
  ensureCapabilityFoundation();
  const registration = getCapabilityRegistration(`skill.${String(skill || '').trim().toLowerCase()}`);
  if (!registration) return { requested: [], ordered: [], unresolved: [`skill.${String(skill || '').trim().toLowerCase()}`] };
  return resolveCapabilityComposition([registration.descriptor.capability]);
}

export function getCapabilityRuntimeSnapshot(): CapabilityRuntimeSnapshot {
  ensureCapabilityFoundation();
  const registrations = listCapabilityRegistrations();
  const adapters = listCapabilityExecutionAdapters();
  const activationCounts: Record<string, number> = {};
  const familyCounts: Record<string, number> = {};
  for (const registration of registrations) {
    const descriptor = registration.descriptor;
    activationCounts[descriptor.activationState] = (activationCounts[descriptor.activationState] || 0) + 1;
    familyCounts[descriptor.family] = (familyCounts[descriptor.family] || 0) + 1;
  }
  return {
    capabilityCount: registrations.length,
    skillCount: registrations.filter(item => item.descriptor.kind === 'skill').length,
    operationCount: registrations.filter(item => item.descriptor.kind === 'operation').length,
    agentToolCount: registrations.filter(item => item.descriptor.kind === 'agent_tool').length,
    adapterCount: adapters.length,
    activationCounts,
    familyCounts,
    invalid: validateCapabilityRegistry(),
  };
}

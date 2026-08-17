import { ensureCapabilityFoundation } from './capabilityFoundation.js';
import { getCapabilityRegistration, resolveCapabilityComposition } from './capabilityRegistry.js';

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

import { ensureCapabilityFoundation } from './capabilityFoundation.js';
import { getCapabilityRegistration } from './capabilityRegistry.js';
import { getSkillCapabilities } from './skillFlows.js';

export function resolveSkillCapabilityPlan(skill: string): string[] {
  ensureCapabilityFoundation();
  const references = getSkillCapabilities(skill).map(name => `atomic.${String(name).toLowerCase()}`);
  const registered = references.filter(reference => Boolean(getCapabilityRegistration(reference)));
  if (registered.length > 0) return registered;
  return getCapabilityRegistration(`skill.${skill}`) ? [`skill.${skill}`] : [];
}

export function resolveCapabilityDependencies(skill: string): string[] {
  return resolveSkillCapabilityPlan(skill);
}

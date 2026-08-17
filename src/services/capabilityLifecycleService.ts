import { getCapabilityRegistration } from './capabilityRegistry.js';
import { ensureCapabilityFoundation, normalizeSkillCapabilityReference } from './capabilityFoundation.js';

export type CapabilityLifecycleDecision = {
  capability: string;
  available: boolean;
  registered: boolean;
  activationState: string;
  mode: string;
  actions: string[];
  owner: string[];
  risk: string;
  confirmationRequired: boolean;
  nextActions: string[];
  failureStates: string[];
  continuationContext: string[];
};

export function resolveCapabilityLifecycle(name: string): CapabilityLifecycleDecision | null {
  ensureCapabilityFoundation();
  const normalized = normalizeSkillCapabilityReference(name);
  const registration = getCapabilityRegistration(normalized) || getCapabilityRegistration(name);
  if (!registration) return null;
  const descriptor = registration.descriptor as any;
  return {
    capability: descriptor.capability,
    available: true,
    registered: true,
    activationState: String(descriptor.activationState || 'unknown'),
    mode: String(descriptor.mode || 'structured_action'),
    actions: Array.isArray(descriptor.actions) ? descriptor.actions.map(String) : [],
    owner: Array.isArray(descriptor.owner) ? descriptor.owner.map(String) : [],
    risk: String(descriptor.risk || 'unknown'),
    confirmationRequired: Boolean(descriptor.confirmationRequired),
    nextActions: Array.isArray(descriptor.nextAllowedActions) ? descriptor.nextAllowedActions.map(String) : [],
    failureStates: Array.isArray(descriptor.failureStates) ? descriptor.failureStates.map(String) : [],
    continuationContext: Array.isArray(descriptor.continuationContext) ? descriptor.continuationContext.map(String) : [],
  };
}

export function canCapabilityBeUsedForAutonomousObservation(name: string): boolean {
  const decision = resolveCapabilityLifecycle(name);
  return Boolean(decision?.available && decision?.registered && decision.actions.length > 0 && ['read_only', 'structured_action', 'state_change', 'external_execution'].includes(decision.mode));
}

export function canCapabilityBeUsedForAutonomousAction(name: string): boolean {
  const decision = resolveCapabilityLifecycle(name);
  return Boolean(decision?.available && decision?.registered && decision.actions.length > 0 && decision.risk !== 'high_risk');
}

import type { UniversalCapabilityDescriptor } from './universalCapabilityProtocol.js';
import { registerCapabilities, getCapabilityRegistration } from './capabilityRegistry.js';
import { getEconomicCategory, getKnownCapabilitySkills, getSkillCapabilities, getSkillRequirements } from './skillFlows.js';

const ECONOMIC_ATOMS = [
  ['discovery', 'Discover relevant entities, opportunities or sources.', 'read_only'],
  ['availability', 'Check whether an entity or resource is available.', 'read_only'],
  ['quote', 'Obtain or project a price/quote without treating it as confirmed.', 'read_only'],
  ['verification', 'Evaluate identity, evidence or trust requirements.', 'read_only'],
  ['reservation', 'Place a reversible hold/reservation when an owning service permits it.', 'state_change'],
  ['payment', 'Authorize or execute a payment through an approved payment boundary.', 'external_execution'],
  ['escrow', 'Create or release an escrow state through an approved economic boundary.', 'external_execution'],
  ['contract', 'Prepare, review or confirm an agreement.', 'state_change'],
  ['fulfillment', 'Coordinate execution of an accepted economic request.', 'external_execution'],
  ['tracking', 'Observe execution progress and state.', 'read_only'],
  ['evidence', 'Capture, validate or associate completion evidence.', 'state_change'],
  ['cancellation', 'Cancel a still-cancellable state through its owning service.', 'state_change'],
  ['dispute', 'Open or progress a dispute against an exact economic object.', 'state_change'],
  ['completion', 'Confirm completion only from the canonical lifecycle/evidence boundary.', 'state_change'],
] as const;

const NATIVE_ATOMS = [
  ['observe', 'Read an authorised resource, context or state.', 'read_only'],
  ['view', 'Present authorised media or a read-only resource view.', 'read_only'],
  ['control', 'Send a state-changing command to an authorised connected resource.', 'state_change'],
  ['communicate', 'Send or continue a communication through a configured channel.', 'external_execution'],
  ['notify', 'Create or route an internal notification without claiming external delivery.', 'state_change'],
  ['schedule', 'Create or modify a time-based follow-up or reminder.', 'state_change'],
  ['remember', 'Store or revoke durable user-controlled memory.', 'state_change'],
  ['delegate', 'Create or manage a bounded autonomous goal.', 'state_change'],
  ['coordinate', 'Move a multi-party workflow through its canonical state machine.', 'state_change'],
  ['locate', 'Resolve or inspect location context without fabricating precision.', 'read_only'],
  ['authenticate', 'Establish or verify account/session identity.', 'state_change'],
  ['authorize', 'Establish explicit user permission for an action.', 'state_change'],
  ['execute', 'Invoke a canonical execution boundary using exact object identity and idempotency.', 'external_execution'],
  ['recover', 'Retry/resume/recover an exact failed or waiting operation without creating a duplicate.', 'state_change'],
  ['audit', 'Inspect canonical provenance, lifecycle and evidence for an object.', 'read_only'],
] as const;

function atomDescriptor(name: string, description: string, mode: string): UniversalCapabilityDescriptor {
  const readOnly = mode === 'read_only';
  const external = mode === 'external_execution';
  const action = name === 'discovery' ? 'discover' : name === 'availability' ? 'check_availability' : name === 'quote' ? 'quote' : name === 'verification' ? 'verify' : name === 'reservation' ? 'reserve' : name === 'payment' ? 'pay' : name === 'escrow' ? 'authorize_escrow' : name === 'contract' ? 'review_contract' : name === 'fulfillment' ? 'fulfill' : name === 'tracking' ? 'track' : name === 'evidence' ? 'submit_evidence' : name === 'cancellation' ? 'cancel' : name === 'dispute' ? 'dispute' : name === 'completion' ? 'confirm_completion' : name;
  return {
    kind: 'operation', capability: `atomic.${name}`, family: name === 'payment' || name === 'escrow' || name === 'fulfillment' ? 'economic-execution' : 'universal', mode: readOnly ? 'read_only' : mode as UniversalCapabilityDescriptor['mode'], actions: [action, 'inspect', 'status', 'recover'],
    context: { requiredInputs: [], optionalInputs: [] }, permissions: readOnly ? ['guest_initial_help', 'authenticated_owner'] : ['authenticated_owner'], owner: ['canonicalCapabilityExecutor', 'capabilityRegistry'],
    risk: readOnly ? 'read_only' : external ? 'confirmation_required' : 'low_risk', consentRequired: !readOnly, confirmationRequired: !readOnly,
    lifecycle: ['requested', 'awaiting_confirmation', 'accepted', 'waiting', 'executing', 'completed', 'cancelled', 'failed'],
    canonicalFactsAvailable: ['canonical_object_identity', 'lifecycle', 'evidence', 'external_activation'], executionStatus: ['not_started', 'accepted', 'waiting', 'needs_user', 'executing', 'completed', 'failed'],
    evidenceStatus: ['none', 'internal_record', 'canonical_service', 'provider_evidence', 'verified_external_evidence'], nextAllowedActions: [action, 'inspect', 'status', 'recover'],
    failureStates: ['blocked', 'failed', 'stale_context', 'foreign_context', 'confirmation_required'], retryPolicy: ['retry only through the canonical owner', 'preserve exact identity and idempotency'],
    recoveryActions: ['inspect', 'status', 'recover', 'cancel'], continuationContext: ['conversationId', 'contextId', 'canonicalObjectId', 'ownerScope'],
    externalDependencyState: external ? ['External activation/evidence is required before claiming completion.'] : [], activationState: external ? 'repository_ready_external_activation' : 'locally_available',
  };
}

function inferNativeComposition(skill: string): string[] {
  const normalized = String(skill || '').trim().toLowerCase();
  const capabilities = new Set<string>(['observe']);
  if (/^(remind|reminder|schedule|calendar|grocery_reminder|mot_reminder)/.test(normalized)) capabilities.add('schedule');
  if (/^(memory|remember|forget|preference)/.test(normalized)) capabilities.add('remember');
  if (/^(agent|delegate|monitor|watch|keep_checking)/.test(normalized)) capabilities.add('delegate');
  if (/^(notify|notification|alert)/.test(normalized)) capabilities.add('notify');
  if (/^(voice|call|message|send|contact|communicat|topic|reply|share)/.test(normalized)) capabilities.add('communicate');
  if (/^(device|tv|cctv|camera|iot|remote|smart_)/.test(normalized)) capabilities.add('view');
  if (/^(device|tv|cctv|camera|iot|remote|smart_).*(_control|_command|control|command)/.test(normalized)) capabilities.add('control');
  if (/^(locate|location|nearby|map|place)/.test(normalized)) capabilities.add('locate');
  if (/^(auth|verify|identity|account)/.test(normalized)) capabilities.add('authenticate');
  if (/^(coordinate|coordination|escalat|support|safety|emergency)/.test(normalized)) capabilities.add('coordinate');
  if (capabilities.size === 1) capabilities.add('communicate');
  return [...capabilities];
}

export function normalizeSkillCapabilityReference(name: string): string {
  const normalized = String(name || '').trim().toLowerCase();
  if (normalized.startsWith('atomic.') || normalized.startsWith('capability.')) return normalized;
  return `atomic.${normalized}`;
}

export function capabilityRegistrationForSkill(skill: string, requiredCapabilities: string[]) {
  const category = getEconomicCategory(skill) || 'uncategorized';
  const requirements = getSkillRequirements(skill);
  const requiredInputs = requirements.filter(requirement => requirement.required).map(requirement => ({ key: requirement.key, label: requirement.label, required: true }));
  const optionalInputs = requirements.filter(requirement => !requirement.required).map(requirement => ({ key: requirement.key, label: requirement.label, required: false }));
  const requiresExternalActivation = requiredCapabilities.some(name => ['payment', 'escrow', 'fulfillment', 'tracking', 'evidence', 'discovery'].includes(String(name).toLowerCase()));
  const confirmationRequired = requiredCapabilities.some(name => ['payment', 'escrow', 'fulfillment', 'completion', 'dispute', 'control'].includes(String(name).toLowerCase()));
  const mode = category === 'uncategorized' ? 'conversation' as const : 'structured_action' as const;
  return {
    descriptor: {
      kind: 'skill' as const,
      capability: `skill.${skill}`,
      family: category,
      mode,
      actions: ['understand', 'clarify', 'start', 'review', 'update', 'cancel', 'resume'],
      context: { requiredInputs, optionalInputs },
      permissions: requiredCapabilities.some(capability => ['payment', 'control', 'remember', 'delegate'].includes(String(capability).toLowerCase())) ? ['authenticated_owner'] : ['guest_initial_help', 'authenticated_owner'],
      owner: ['canonicalChatTurnService', 'skillFlows', 'capabilityRegistry'],
      risk: confirmationRequired ? 'confirmation_required' as const : 'low_risk' as const,
      consentRequired: confirmationRequired,
      confirmationRequired,
      lifecycle: ['requested', 'clarifying', 'ready', 'accepted', 'executing', 'completed', 'cancelled', 'failed'],
      canonicalFactsAvailable: ['intent', 'requirements', 'canonical_object_identity', 'lifecycle', 'evidence', 'external_activation'],
      executionStatus: ['not_started', 'accepted', 'waiting', 'needs_user', 'executing', 'completed', 'failed'],
      evidenceStatus: ['none', 'internal_record', 'canonical_service', 'provider_evidence', 'verified_external_evidence'],
      nextAllowedActions: ['understand', 'clarify', 'start', 'review', 'update', 'cancel', 'resume'],
      failureStates: ['blocked', 'failed', 'stale_context', 'foreign_context', 'confirmation_required'],
      retryPolicy: ['continue the exact canonical skill/request', 'do not create duplicate economic objects'],
      recoveryActions: ['clarify', 'review', 'resume', 'cancel'],
      continuationContext: ['conversationId', 'contextId', 'canonicalObjectId', 'ownerScope', 'lifecycle'],
      externalDependencyState: requiresExternalActivation ? ['One or more composed capabilities require external activation/evidence before Kurukoo may claim a completed real-world outcome.'] : [],
      activationState: requiresExternalActivation ? 'repository_ready_external_activation' as const : 'locally_available' as const,
    } as UniversalCapabilityDescriptor,
    namespace: 'kurukoo.skills', version: '1',
    aliases: [skill, `skill.${skill}`],
    requiresCapabilities: requiredCapabilities.map(normalizeSkillCapabilityReference),
    source: 'skill-composition',
  };
}

export function ensureCapabilityFoundation(): void {
  const registrations = [...ECONOMIC_ATOMS, ...NATIVE_ATOMS].map(([name, description, mode]) => ({
    descriptor: atomDescriptor(name, description, mode),
    namespace: 'kurukoo.atomic',
    version: '1',
    aliases: [name],
    providesCapabilities: [normalizeSkillCapabilityReference(name)],
    source: 'capability-foundation',
  }));
  registerCapabilities(registrations);
  const skillRegistrations = getKnownCapabilitySkills().map(skill => {
    const category = getEconomicCategory(skill);
    const capabilities = category ? getSkillCapabilities(skill) : inferNativeComposition(skill);
    return capabilityRegistrationForSkill(skill, capabilities);
  });
  registerCapabilities(skillRegistrations);
}

export function getRegisteredSkillCapabilityPlan(skill: string) {
  ensureCapabilityFoundation();
  return getCapabilityRegistration(`skill.${String(skill || '').trim().toLowerCase()}`);
}

export function isCapabilityAvailable(name: string): boolean {
  ensureCapabilityFoundation();
  return Boolean(getCapabilityRegistration(name));
}

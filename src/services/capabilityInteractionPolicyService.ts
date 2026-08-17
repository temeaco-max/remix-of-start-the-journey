import { listUniversalCapabilities, type CapabilityRisk, type UniversalCapabilityDescriptor } from './universalCapabilityProtocol.js';

export type InteractionPriority = 'background' | 'normal' | 'high' | 'critical';
export type InterruptionMode = 'never' | 'at_trigger' | 'conditional' | 'immediate';
export type GuestAccess = 'allowed' | 'allowed_for_initial_help' | 'blocked';
export type AuthRequirement = 'none' | 'after_initial_help' | 'required_before_action';
export type ConfirmationMode = 'none' | 'contextual' | 'explicit';
export type AutonomyMode = 'none' | 'bounded' | 'long_running';

export interface CapabilityInteractionPolicy {
  capability: string;
  priority: InteractionPriority;
  interruption: InterruptionMode;
  guestAccess: GuestAccess;
  authentication: AuthRequirement;
  confirmation: ConfirmationMode;
  autonomy: AutonomyMode;
  backgroundAllowed: boolean;
  resumable: boolean;
  preemptsOtherGoals: boolean;
  preservesPriorGoals: boolean;
  exactIdentityRequired: boolean;
  locationMode: 'none' | 'optional' | 'recommended' | 'required';
  voiceMode: 'none' | 'optional' | 'preferred' | 'required';
  externalEvidenceRequired: boolean;
  draftVsCommitRequired: boolean;
  failureMustPreserveContext: boolean;
  notes: string[];
}

const EMERGENCY_TERMS = /(^|[._:-])(emergency|safety|police|ambulance|fire|threat|assault|danger|distress)([._:-]|$)/i;
const REMINDER_TERMS = /(^|[._:-])reminder([._:-]|$)/i;
const AGENT_TERMS = /(^|[._:-])(agent|agent_goal)([._:-]|$)/i;
const PAYMENT_TERMS = /(^|[._:-])(payment|escrow|refund|subscription|order|checkout)([._:-]|$)/i;
const REMOTE_TERMS = /(^|[._:-])(remote|device|linked_device|voice|webrtc|call|dial)([._:-]|$)/i;
const MEMORY_TERMS = /(^|[._:-])memory([._:-]|$)/i;
const CHANNEL_SEND_TERMS = /(^|[._:-])(channel|message|sms|whatsapp|telegram|email)([._:-]|$)/i;

function riskToConfirmation(risk: CapabilityRisk): ConfirmationMode {
  if (risk === 'confirmation_required' || risk === 'high_risk') return 'explicit';
  return 'none';
}

export function deriveCapabilityInteractionPolicy(descriptor: UniversalCapabilityDescriptor): CapabilityInteractionPolicy {
  const key = `${descriptor.capability}`;
  const actionKey = descriptor.actions.join('|');
  const emergency = EMERGENCY_TERMS.test(key) || EMERGENCY_TERMS.test(actionKey) || /\bemergency\b/i.test(descriptor.family);
  const reminder = REMINDER_TERMS.test(key) || REMINDER_TERMS.test(actionKey) || /reminder/i.test(descriptor.family);
  const agent = AGENT_TERMS.test(key) || AGENT_TERMS.test(actionKey) || /agent/i.test(descriptor.family);
  const payment = PAYMENT_TERMS.test(key) || PAYMENT_TERMS.test(actionKey) || descriptor.risk === 'confirmation_required' && /economic|commerce|subscription|payment/i.test(descriptor.family);
  const remote = REMOTE_TERMS.test(key) || REMOTE_TERMS.test(actionKey);
  const memory = MEMORY_TERMS.test(key) || MEMORY_TERMS.test(actionKey);
  const channelSend = CHANNEL_SEND_TERMS.test(key) || CHANNEL_SEND_TERMS.test(actionKey);

  if (emergency) {
    return {
      capability: descriptor.capability,
      priority: 'critical',
      interruption: 'immediate',
      guestAccess: 'allowed_for_initial_help',
      authentication: 'after_initial_help',
      confirmation: 'contextual',
      autonomy: 'bounded',
      backgroundAllowed: false,
      resumable: true,
      preemptsOtherGoals: true,
      preservesPriorGoals: true,
      exactIdentityRequired: false,
      locationMode: 'recommended',
      voiceMode: 'preferred',
      externalEvidenceRequired: true,
      draftVsCommitRequired: false,
      failureMustPreserveContext: true,
      notes: ['Emergency/safety capabilities interrupt ordinary onboarding and unrelated goals.', 'Never require registration before initial emergency assistance when legally and technically unnecessary.', 'Never claim dispatch or connection without external evidence.'],
    };
  }

  if (reminder) {
    return {
      capability: descriptor.capability,
      priority: 'high',
      interruption: 'at_trigger',
      guestAccess: 'allowed_for_initial_help',
      authentication: 'after_initial_help',
      confirmation: 'none',
      autonomy: 'long_running',
      backgroundAllowed: true,
      resumable: true,
      preemptsOtherGoals: false,
      preservesPriorGoals: true,
      exactIdentityRequired: true,
      locationMode: 'none',
      voiceMode: 'optional',
      externalEvidenceRequired: false,
      draftVsCommitRequired: false,
      failureMustPreserveContext: true,
      notes: ['Reminder triggers may interrupt a current conversation according to user preference.', 'The pre-trigger conversation remains resumable.'],
    };
  }

  if (agent) {
    return {
      capability: descriptor.capability,
      priority: 'high',
      interruption: 'conditional',
      guestAccess: 'blocked',
      authentication: 'required_before_action',
      confirmation: 'contextual',
      autonomy: 'long_running',
      backgroundAllowed: true,
      resumable: true,
      preemptsOtherGoals: true,
      preservesPriorGoals: true,
      exactIdentityRequired: true,
      locationMode: 'optional',
      voiceMode: 'optional',
      externalEvidenceRequired: false,
      draftVsCommitRequired: false,
      failureMustPreserveContext: true,
      notes: ['Agent control commands override the agent goal they target.', 'Agent autonomy remains bounded by the existing runtime quotas and action policy.'],
    };
  }

  if (remote) {
    return {
      capability: descriptor.capability,
      priority: 'high',
      interruption: 'conditional',
      guestAccess: 'blocked',
      authentication: 'required_before_action',
      confirmation: descriptor.risk === 'read_only' ? 'none' : 'explicit',
      autonomy: 'bounded',
      backgroundAllowed: false,
      resumable: true,
      preemptsOtherGoals: false,
      preservesPriorGoals: true,
      exactIdentityRequired: true,
      locationMode: 'optional',
      voiceMode: /voice|webrtc|call|dial/i.test(key) ? 'preferred' : 'optional',
      externalEvidenceRequired: descriptor.activationState !== 'locally_available',
      draftVsCommitRequired: channelSend,
      failureMustPreserveContext: true,
      notes: ['Remote/device/calling actions require exact target identity and authorization.', 'Drafting and sending communications are separate actions.'],
    };
  }

  if (payment) {
    return {
      capability: descriptor.capability,
      priority: 'high',
      interruption: 'conditional',
      guestAccess: 'blocked',
      authentication: 'required_before_action',
      confirmation: 'explicit',
      autonomy: 'bounded',
      backgroundAllowed: false,
      resumable: true,
      preemptsOtherGoals: false,
      preservesPriorGoals: true,
      exactIdentityRequired: true,
      locationMode: 'optional',
      voiceMode: 'optional',
      externalEvidenceRequired: descriptor.activationState !== 'locally_available',
      draftVsCommitRequired: true,
      failureMustPreserveContext: true,
      notes: ['Discussion of price or payment is not authorization.', 'Payment state is authoritative only from the canonical payment owner.'],
    };
  }

  if (memory) {
    return {
      capability: descriptor.capability,
      priority: 'normal',
      interruption: 'never',
      guestAccess: 'allowed_for_initial_help',
      authentication: 'after_initial_help',
      confirmation: 'explicit',
      autonomy: 'none',
      backgroundAllowed: false,
      resumable: true,
      preemptsOtherGoals: false,
      preservesPriorGoals: true,
      exactIdentityRequired: true,
      locationMode: 'none',
      voiceMode: 'none',
      externalEvidenceRequired: false,
      draftVsCommitRequired: false,
      failureMustPreserveContext: true,
      notes: ['Conversation facts are not automatically persisted as memory without the existing memory policy.', 'Forget operations must target the exact memory object/context.'],
    };
  }

  const confirmation = riskToConfirmation(descriptor.risk);
  return {
    capability: descriptor.capability,
    priority: descriptor.mode === 'external_execution' ? 'high' : descriptor.mode === 'state_change' ? 'normal' : 'background',
    interruption: descriptor.mode === 'external_execution' ? 'conditional' : 'never',
    guestAccess: descriptor.mode === 'read_only' || descriptor.mode === 'conversation' ? 'allowed' : 'blocked',
    authentication: descriptor.mode === 'read_only' || descriptor.mode === 'conversation' ? 'none' : 'required_before_action',
    confirmation,
    autonomy: 'none',
    backgroundAllowed: descriptor.mode === 'read_only' || descriptor.mode === 'conversation',
    resumable: true,
    preemptsOtherGoals: false,
    preservesPriorGoals: true,
    exactIdentityRequired: descriptor.mode !== 'conversation',
    locationMode: descriptor.context.requiredInputs.some(input => /location|address|pickup|destination/i.test(input.key)) ? 'required' : 'none',
    voiceMode: descriptor.mode === 'external_execution' ? 'optional' : 'none',
    externalEvidenceRequired: descriptor.activationState !== 'locally_available',
    draftVsCommitRequired: false,
    failureMustPreserveContext: true,
    notes: ['Canonical domain services remain authoritative for state, authorization, execution and evidence.'],
  };
}

export async function getCapabilityInteractionPolicy(capability: string): Promise<CapabilityInteractionPolicy | null> {
  const descriptors = await listUniversalCapabilities();
  const descriptor = descriptors.find(item => item.capability === capability);
  return descriptor ? deriveCapabilityInteractionPolicy(descriptor) : null;
}

export async function getAllCapabilityInteractionPolicies(): Promise<CapabilityInteractionPolicy[]> {
  const descriptors = await listUniversalCapabilities();
  return descriptors.map(deriveCapabilityInteractionPolicy);
}

export function policyAllowsGuestInitialAction(policy: CapabilityInteractionPolicy): boolean {
  return policy.guestAccess === 'allowed' || policy.guestAccess === 'allowed_for_initial_help';
}

export function shouldInterruptCurrentConversation(policy: CapabilityInteractionPolicy): boolean {
  return policy.interruption === 'immediate' || policy.interruption === 'at_trigger' || policy.interruption === 'conditional' && policy.priority === 'high';
}

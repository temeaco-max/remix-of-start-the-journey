import { deriveInteractionPolicyForCapabilityName, type CapabilityInteractionPolicy } from './capabilityInteractionPolicyService.js';

export interface ConversationPriorityDecision {
  kind: 'none' | 'emergency' | 'control' | 'scheduled' | 'security' | 'ordinary';
  policy: CapabilityInteractionPolicy;
  shouldPreemptCurrentContext: boolean;
  guestAllowedForInitialHandling: boolean;
  requiresAuthenticationBeforeAction: boolean;
  capability: string;
  reason: string;
}

const EMERGENCY_PATTERN = /\b(emergency|ambulance|call\s+(?:the\s+)?police|call\s+(?:an\s+)?ambulance|fire\s*(?:truck|service)?|someone\s+is\s+attacking|i(?:'|\s*)m\s+being\s+attacked|danger|distress|unconscious|not\s+breathing)\b/i;
const AGENT_CONTROL_PATTERN = /\b(pause|resume|stop|cancel)\s+(?:the\s+)?(?:agent|task|goal)\b|\b(?:pause|resume|cancel)\s+it\b/i;
const REMINDER_PATTERN = /\b(?:remind me|set (?:a )?reminder|reminder for)\b/i;
const SECURITY_PATTERN = /\b(?:account locked|someone accessed my account|stolen phone|lost phone|unauthorized (?:charge|payment)|fraud)\b/i;

export function resolveConversationPriority(message: string): ConversationPriorityDecision {
  const text = String(message || '').trim();
  if (!text) return { kind: 'none', policy: deriveInteractionPolicyForCapabilityName('conversation'), shouldPreemptCurrentContext: false, guestAllowedForInitialHandling: true, requiresAuthenticationBeforeAction: false, capability: 'conversation', reason: 'empty-turn' };

  if (EMERGENCY_PATTERN.test(text)) {
    const policy = deriveInteractionPolicyForCapabilityName('safety', {
      family: 'safety', mode: 'external_execution', actions: ['assess', 'emergency_dispatch', 'dial', 'connect'], risk: 'high_risk', activationState: 'repository_ready_external_activation',
    });
    return { kind: 'emergency', policy, shouldPreemptCurrentContext: true, guestAllowedForInitialHandling: true, requiresAuthenticationBeforeAction: false, capability: 'safety', reason: 'critical-emergency-language-detected-before-normal-routing' };
  }

  if (AGENT_CONTROL_PATTERN.test(text)) {
    const policy = deriveInteractionPolicyForCapabilityName('agent.control', { family: 'agent-runtime', mode: 'state_change', actions: ['pause', 'resume', 'cancel'], risk: 'confirmation_required' });
    return { kind: 'control', policy, shouldPreemptCurrentContext: true, guestAllowedForInitialHandling: false, requiresAuthenticationBeforeAction: true, capability: 'agent.control', reason: 'explicit-agent-control-command' };
  }

  if (SECURITY_PATTERN.test(text)) {
    const policy = deriveInteractionPolicyForCapabilityName('security.response', { family: 'security', mode: 'state_change', actions: ['assess', 'secure', 'recover'], risk: 'high_risk' });
    return { kind: 'security', policy, shouldPreemptCurrentContext: true, guestAllowedForInitialHandling: true, requiresAuthenticationBeforeAction: true, capability: 'security.response', reason: 'security-interrupt-language-detected' };
  }

  if (REMINDER_PATTERN.test(text)) {
    const policy = deriveInteractionPolicyForCapabilityName('reminder.create', { family: 'native-assistance', mode: 'state_change', actions: ['create', 'update', 'cancel', 'open'], risk: 'low_risk' });
    return { kind: 'scheduled', policy, shouldPreemptCurrentContext: false, guestAllowedForInitialHandling: false, requiresAuthenticationBeforeAction: true, capability: 'reminder.create', reason: 'explicit-reminder-request' };
  }

  return { kind: 'ordinary', policy: deriveInteractionPolicyForCapabilityName('conversation'), shouldPreemptCurrentContext: false, guestAllowedForInitialHandling: true, requiresAuthenticationBeforeAction: false, capability: 'conversation', reason: 'no-high-priority-preemption-detected' };
}

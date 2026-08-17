import type { UniversalCapabilityDescriptor } from './universalCapabilityProtocol.js';
import { deriveCapabilityInteractionPolicy, type CapabilityInteractionPolicy } from './capabilityInteractionPolicyService.js';

const READ_ONLY = /^(answer|clarify|continue|inspect|view|list|open|preview|show|check|status|read|availability|quote|search|find|discover|explain)$/i;
const COMMIT = /^(create|update|change|save|send|publish|post|reply|invite|claim|redeem|select|book|hire|order|purchase|pay|authorize|confirm|cancel|delete|forget|revoke|pause|resume|stop|dispatch|connect|dial|execute|complete)$/i;

function actionName(action?: string): string { return String(action || '').trim().toLowerCase(); }

export function deriveActionInteractionPolicy(descriptor: UniversalCapabilityDescriptor, action?: string): CapabilityInteractionPolicy {
  const base = deriveCapabilityInteractionPolicy(descriptor);
  const normalized = actionName(action);
  if (!normalized) return base;

  if (base.capability.includes('reminder')) {
    if (READ_ONLY.test(normalized)) return { ...base, action: normalized, guestAccess: 'allowed', authentication: 'none', confirmation: 'none' };
    return { ...base, action: normalized, guestAccess: 'blocked', authentication: 'required_before_action', confirmation: /^(cancel|delete)$/i.test(normalized) ? 'contextual' : base.confirmation, exactIdentityRequired: true, notes: [...base.notes, 'Reminder mutations remain owner-scoped; trigger-time interruption is independent of creation authorization.'] };
  }

  if (base.capability.includes('memory')) {
    if (/^(view|list|inspect|read|show|check)$/i.test(normalized)) return { ...base, action: normalized, guestAccess: 'allowed', authentication: 'none', confirmation: 'none', exactIdentityRequired: false };
    return { ...base, action: normalized, guestAccess: 'blocked', authentication: 'required_before_action', confirmation: 'explicit', exactIdentityRequired: true };
  }

  if (base.capability.includes('agent')) return { ...base, action: normalized, guestAccess: 'blocked', authentication: 'required_before_action', exactIdentityRequired: true, confirmation: /^(pause|resume|cancel|stop)$/i.test(normalized) ? 'explicit' : base.confirmation };

  if (base.capability.includes('payment') || base.capability.includes('subscription') || base.capability.includes('order') || base.capability.includes('checkout')) {
    if (READ_ONLY.test(normalized)) return { ...base, action: normalized, guestAccess: 'allowed', authentication: 'none', confirmation: 'none', exactIdentityRequired: false, draftVsCommitRequired: false };
    return { ...base, action: normalized, guestAccess: 'blocked', authentication: 'required_before_action', confirmation: 'explicit', exactIdentityRequired: true, draftVsCommitRequired: true };
  }

  if (base.capability.includes('remote') || base.capability.includes('device') || /^(dial|connect|call|execute|send)$/i.test(normalized)) {
    if (READ_ONLY.test(normalized)) return { ...base, action: normalized, confirmation: 'none', exactIdentityRequired: true };
    return { ...base, action: normalized, guestAccess: 'blocked', authentication: 'required_before_action', confirmation: 'explicit', exactIdentityRequired: true };
  }

  if (base.draftVsCommitRequired && READ_ONLY.test(normalized)) return { ...base, action: normalized, confirmation: 'none', exactIdentityRequired: false };
  if (COMMIT.test(normalized)) return { ...base, action: normalized, exactIdentityRequired: true };
  return { ...base, action: normalized };
}

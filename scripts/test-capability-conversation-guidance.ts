import { buildCapabilityConversationGuidance, buildCapabilityOutcomeForConversation } from '../src/services/aiCapabilityContinuationService.js';

const completed = buildCapabilityOutcomeForConversation({
  capability: 'reminder',
  action: 'create',
  status: 'completed',
  canonicalObjectId: 'rem-1',
  facts: { dueAt: '2026-08-18T09:00:00Z' },
  evidenceLevel: 'canonical_service',
  nextActions: [{ capability: 'reminder', action: 'open', label: 'Open reminder' }],
});
const completedGuidance = buildCapabilityConversationGuidance(completed);
if (completedGuidance.tone !== 'natural' || !completedGuidance.instruction.includes('completed')) {
  throw new Error('Completed outcome should produce natural completion guidance');
}

const confirmation = buildCapabilityOutcomeForConversation({
  capability: 'payment',
  action: 'authorize',
  status: 'confirmation_required',
  canonicalObjectId: 'pay-1',
  facts: { amount: 2500, currency: 'NGN' },
  nextActions: [{ capability: 'payment', action: 'authorize', label: 'Confirm payment', requiresConfirmation: true }],
});
const confirmationGuidance = buildCapabilityConversationGuidance(confirmation);
if (confirmationGuidance.tone !== 'confirming' || !confirmationGuidance.instruction.includes('awaiting confirmation')) {
  throw new Error('Confirmation outcome should request explicit confirmation without claiming payment');
}

const unavailable = buildCapabilityOutcomeForConversation({
  capability: 'provider',
  action: 'select',
  status: 'external_unavailable',
  canonicalObjectId: 'req-1',
  facts: { reason: 'provider_activation_required' },
  recoveryActions: [{ capability: 'provider', action: 'retry', label: 'Retry after activation' }],
});
const unavailableGuidance = buildCapabilityConversationGuidance(unavailable);
if (unavailableGuidance.tone !== 'natural' || !unavailableGuidance.instruction.includes('preserve the user')) {
  throw new Error('Unavailable external outcome should preserve the goal and offer recovery');
}

console.log(JSON.stringify({ ok: true, cases: 3 }, null, 2));

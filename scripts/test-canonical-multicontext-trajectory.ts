/* Copyright (c) 2026 temeaco-max. All rights reserved. Proprietary and confidential. */
import fs from 'node:fs';
import assert from 'node:assert/strict';

const dbPath = `/tmp/kurukoo-multicontext-${process.pid}.sqlite`;
try { fs.unlinkSync(dbPath); } catch {}
process.env.NODE_ENV = 'test';
process.env.DB_PATH = dbPath;
process.env.MEMORY_ENCRYPTION_KEY = 'multicontext-trajectory-test-key';
process.env.KURUKOO_AI_HOSTED_PROVIDER = 'none';
process.env.KURUKOO_SMOLLM2_LOCAL = 'false';

const { updateProfile } = await import('../src/services/memoryProfile.js');
const { appendChatMessage } = await import('../src/services/chatConversationService.js');
const { processCanonicalChatTurn } = await import('../src/services/canonicalChatTurnService.js');

const phone = '+2348090000002';
await updateProfile(phone, 'multicontext-trajectory-test', { name: 'Amina', preferences: { onboarding_complete: true } });
let conversationId = '';
const seeded = await appendChatMessage({
  phone,
  sender: 'assistant',
  content: 'What area should I use for the plumber request?',
  channel: 'web',
  conversationId,
  cardData: {
    type: 'agentic_storefront',
    requestId: 'request-context-1',
    status: 'awaiting_match',
    fields: [{ key: 'location', required: true }, { key: 'service', required: true }],
  },
});
conversationId = seeded.conversationId;
await appendChatMessage({
  phone,
  sender: 'assistant',
  content: 'What should I remember about this reminder?',
  channel: 'web',
  conversationId,
  cardData: { type: 'reminder', reminderId: 'reminder-context-1', state: 'pending', fields: [{ key: 'time', required: true }] },
});

const safety = await processCanonicalChatTurn({ phone, message: 'There is immediate danger near Ikeja', channel: 'web', conversationId });
assert.equal(safety.contextDecision?.selectedContext, 'safety');
assert.ok(safety.contextDecision?.preserveContextIds.includes('request:request-context-1'));
assert.ok(safety.reply.trim());

const ambiguous = await processCanonicalChatTurn({ phone, message: 'Use that one', channel: 'web', conversationId });
assert.equal(ambiguous.contextDecision?.relation, 'clarify');
assert.equal(ambiguous.contextDecision?.ambiguous, true);
assert.ok(ambiguous.contextDecision?.preserveContextIds.includes('request:request-context-1'));
assert.match(ambiguous.reply, /which|mean|clarif|option/i);

const ordinal = await processCanonicalChatTurn({ phone, message: 'Use option 2', channel: 'web', conversationId });
assert.equal(ordinal.contextDecision?.ambiguous, false);
assert.equal(ordinal.contextDecision?.selectedContext, 'economic_request');
assert.equal(ordinal.contextDecision?.relation, 'answer');
assert.ok(ordinal.reply.trim());

console.log(JSON.stringify({
  harness: 'canonical-multicontext-trajectory-v1',
  turns: 3,
  preservedRequest: true,
  safetyInterruption: safety.contextDecision?.selectedContext,
  ambiguousReference: ambiguous.contextDecision?.relation,
  ordinalResolution: ordinal.contextDecision?.selectedContext,
  mutationAuthority: 'canonical services only',
}, null, 2));
try { fs.unlinkSync(dbPath); } catch {}

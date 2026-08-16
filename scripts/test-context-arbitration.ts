import assert from 'node:assert/strict';
import fs from 'node:fs';

const dbPath = `/tmp/kurukoo-context-arbitration-${process.pid}.sqlite`;
try { fs.unlinkSync(dbPath); } catch { /* isolated test path */ }
process.env.NODE_ENV = 'test';
process.env.DB_PATH = dbPath;
process.env.MEMORY_ENCRYPTION_KEY = 'context-arbitration-test-key';

const { updateProfile } = await import('../src/services/memoryProfile.js');
const { appendChatMessage, ensureConversation } = await import('../src/services/chatConversationService.js');
const { arbitrateChatContext } = await import('../src/services/contextArbitration.js');

const phone = '+2348090000001';
let conversationId = '';
await updateProfile(phone, 'context-arbitration-test', { name: 'Amina', preferences: { onboarding_complete: true } });
const seededMessage = await appendChatMessage({
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
conversationId = seededMessage.conversationId;

const ambiguous = await arbitrateChatContext({ phone, conversationId, message: 'Mikel' });
assert.equal(ambiguous.relation, 'clarify');
assert.equal(ambiguous.ambiguous, true);
assert.equal(ambiguous.selectedContext, 'topic_switch');
assert.ok(ambiguous.preserveContextIds.includes('request:request-context-1'));
assert.match(String(ambiguous.clarification), /Mikel/);

const safety = await arbitrateChatContext({ phone, conversationId, message: 'There is immediate danger near Ikeja' });
assert.equal(safety.selectedContext, 'safety');
assert.equal(safety.relation, 'switch');
assert.ok(safety.preserveContextIds.includes('request:request-context-1'));

const continuation = await arbitrateChatContext({ phone, conversationId, message: 'Ikeja' });
assert.equal(continuation.selectedContext, 'economic_request');
assert.equal(continuation.relation, 'answer');
assert.ok(continuation.preserveContextIds.length === 0);

const secondConversationId = await ensureConversation(phone, undefined, 'web', 'Safety thread', true);
const crossThread = await arbitrateChatContext({ phone, conversationId: secondConversationId, message: 'There is immediate danger near Yaba' });
assert.equal(crossThread.selectedContext, 'safety');
assert.ok(crossThread.preserveContextIds.includes('request:request-context-1'));
assert.ok(crossThread.activeContexts.some(context => context.conversationId === conversationId && context.type === 'economic_request'));

await appendChatMessage({
  phone,
  sender: 'assistant',
  content: 'What should I remember about this reminder?',
  channel: 'web',
  conversationId: secondConversationId,
  cardData: { type: 'reminder', reminderId: 'reminder-context-1', state: 'pending', fields: [{ key: 'time', required: true }] },
});
const ambiguousReference = await arbitrateChatContext({ phone, conversationId: secondConversationId, message: 'Use that one' });
assert.equal(ambiguousReference.selectedContext, 'topic_switch');
assert.equal(ambiguousReference.relation, 'clarify');
assert.equal(ambiguousReference.ambiguous, true);
assert.ok(ambiguousReference.preserveContextIds.includes('request:request-context-1'));
const ordinalReference = await arbitrateChatContext({ phone, conversationId: secondConversationId, message: 'Use option 2' });
assert.equal(ordinalReference.ambiguous, false);
assert.equal(ordinalReference.selectedContext, 'economic_request');
assert.equal(ordinalReference.relation, 'answer');

console.log('Context arbitration regression passed: ambiguous identity input clarifies, active requests are preserved, explicit safety switches are isolated, normal answers continue the request, and multi-context relative references fail closed unless explicitly ordinal.');
try { fs.unlinkSync(dbPath); } catch { /* best effort cleanup */ }

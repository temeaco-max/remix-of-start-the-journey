import assert from 'node:assert/strict';
import fs from 'node:fs';

const dbPath = `/tmp/kurukoo-conversation-reconciliation-${process.pid}.sqlite`;
try { fs.unlinkSync(dbPath); } catch {}
process.env.NODE_ENV = 'test';
process.env.DB_PATH = dbPath;
process.env.MEMORY_ENCRYPTION_KEY = 'conversation-reconciliation-test-key';
process.env.KURUKOO_AGENT_ENABLED = 'true';
process.env.KURUKOO_AGENT_AUTONOMOUS = 'true';

const { updateProfile } = await import('../src/services/memoryProfile.js');
const { processCanonicalChatTurn } = await import('../src/services/canonicalChatTurnService.js');

const phone = '+2348090000098';
await updateProfile(phone, 'conversation-reconciliation', { name: 'Ada', preferences: { onboarding_complete: true } });
let conversationId: string | undefined;
const send = async (message: string) => {
  const result = await processCanonicalChatTurn({ phone, channel: 'web', conversationId, message });
  conversationId = result.conversationId || conversationId;
  return result;
};

for (const message of ['hello', 'how are you?', 'what can you help me with?', "I'm frustrated", 'my phone is acting strange', "I'm thinking about getting a cleaner", 'what do you think?', 'tell me more']) {
  const result = await send(message);
  assert.notEqual(result.contextDecision?.relation, 'create', `${message} must remain conversational`);
  assert.equal(result.cardData?.type, undefined, `${message} must not create an action card`);
}

const request = await send('I need a cleaner in Ibadan this weekend.');
assert.equal(request.contextDecision?.selectedContext, 'economic_request');
assert.equal(request.contextDecision?.relation, 'create');
assert.equal(request.cardData?.type, 'agentic_storefront');
const requestId = String(request.cardData?.requestId || '');
assert.ok(requestId);

const correction = await send('Actually make that Saturday morning.');
assert.equal(correction.contextDecision?.relation, 'correction');
assert.equal(String(correction.cardData?.requestId), requestId);

const memory = await send('What do you remember about me?');
assert.equal(memory.contextDecision?.selectedContext, 'memory');
assert.equal(memory.contextDecision?.relation, 'switch');
assert.equal(memory.cardData?.requestId, undefined);

const reminder = await send('Set a reminder for Friday.');
assert.equal(reminder.contextDecision?.selectedContext, 'reminder');
assert.equal(reminder.contextDecision?.relation, 'switch');
assert.equal(reminder.cardData?.type, 'reminder');

const resumed = await send('Go back to the cleaner.');
assert.equal(resumed.contextDecision?.selectedContext, 'economic_request');
assert.equal(resumed.contextDecision?.relation, 'resume');
assert.equal(String(resumed.cardData?.requestId), requestId);

const relative = await send('The cheaper one.');
assert.equal(relative.contextDecision?.selectedContext, 'economic_request');
assert.equal(relative.contextDecision?.relation, 'answer');
assert.equal(relative.cardData?.canonicalAction, 'economic_request.price_reference_pending');
assert.equal(String(relative.cardData?.requestId), requestId);
assert.ok(!JSON.stringify(relative.cardData).includes('"location":"the cheaper one"'), 'relative price language must not become a location field');

const confirmation = await send('Yes, go ahead');
assert.equal(confirmation.contextDecision?.selectedContext, 'economic_request');
assert.equal(confirmation.cardData?.canonicalAction, 'economic_request.confirmation_blocked');
assert.equal(String(confirmation.cardData?.requestId), requestId);
assert.match(confirmation.reply, /not dispatched|not.*claimed fulfilment/i);

console.log('Conversation reconciliation regression passed: natural dialogue stayed conversation-only, explicit request/action boundaries, correction, memory switch, reminder switch, exact resumption, relative price reference, and truthful confirmation were verified.');
try { fs.unlinkSync(dbPath); } catch {}

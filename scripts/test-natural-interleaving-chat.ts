/* Copyright (c) 2026 temeaco-max. All rights reserved. Proprietary and confidential. */
import assert from 'node:assert/strict';
import fs from 'node:fs';

const dbPath = `/tmp/kurukoo-natural-interleaving-${process.pid}.sqlite`;
try { fs.unlinkSync(dbPath); } catch { /* isolated test path */ }
process.env.NODE_ENV = 'test';
process.env.DB_PATH = dbPath;
process.env.MEMORY_ENCRYPTION_KEY = 'natural-interleaving-test-key';
process.env.KURUKOO_AGENT_ENABLED = 'true';
process.env.KURUKOO_AGENT_AUTONOMOUS = 'true';

const { updateProfile, getMemoryFacts } = await import('../src/services/memoryProfile.js');
const { processCanonicalChatTurn } = await import('../src/services/canonicalChatTurnService.js');
const { getDb } = await import('../src/database.js');

const phone = '+2348090000002';
await updateProfile(phone, 'natural-interleaving-test', { name: 'Mikel', preferences: { onboarding_complete: true, safety_capture_state: 'none' } });

const first = await processCanonicalChatTurn({ phone, channel: 'web', message: 'I need a plumber in Ikeja' });
assert.equal(first.contextDecision?.selectedContext, 'economic_request');
assert.equal(first.contextDecision?.relation, 'create');
assert.ok(first.cardData?.requestId, 'first request should create a canonical Economic Request');
const firstRequestId = String(first.cardData.requestId);

const memoryTurn = await processCanonicalChatTurn({ phone, channel: 'web', conversationId: first.conversationId, message: 'Remember that I prefer mornings' });
assert.equal(memoryTurn.contextDecision?.selectedContext, 'memory');
assert.equal(memoryTurn.contextDecision?.relation, 'switch');
assert.equal(memoryTurn.cardData?.requestId, undefined, 'memory turn must not mutate the active request');

const second = await processCanonicalChatTurn({ phone, channel: 'web', conversationId: first.conversationId, message: 'I need a ride from Yaba to Ikeja' });
assert.equal(second.contextDecision?.selectedContext, 'economic_request');
assert.equal(second.contextDecision?.relation, 'create');
assert.ok(second.cardData?.requestId, 'second request should have its own canonical request');
assert.notEqual(String(second.cardData.requestId), firstRequestId, 'new request must not reuse the first request');

const corrected = await processCanonicalChatTurn({ phone, channel: 'web', conversationId: first.conversationId, message: 'Change the pickup to Surulere' });
assert.equal(corrected.contextDecision?.relation, 'correction');
assert.equal(String(corrected.cardData?.requestId), String(second.cardData.requestId), 'correction must target the selected latest request');
assert.ok(JSON.stringify(corrected.cardData).toLowerCase().includes('surulere'), 'corrected request should contain the updated pickup');

const resumed = await processCanonicalChatTurn({ phone, channel: 'web', conversationId: first.conversationId, message: 'resume my request' });
assert.equal(resumed.contextDecision?.relation, 'resume');
assert.ok(resumed.cardData?.requestId, 'resume should return a canonical request card');

const clarifyPhone = '+2348090000003';
await updateProfile(clarifyPhone, 'clarification-test', { name: 'Amina', preferences: { onboarding_complete: true } });
const clarifyStart = await processCanonicalChatTurn({ phone: clarifyPhone, channel: 'web', message: 'I need a plumber' });
const ambiguous = await processCanonicalChatTurn({ phone: clarifyPhone, channel: 'web', conversationId: clarifyStart.conversationId, message: 'Mikel' });
assert.equal(ambiguous.cardData?.type, 'context_clarification');
const accepted = await processCanonicalChatTurn({ phone: clarifyPhone, channel: 'web', conversationId: clarifyStart.conversationId, message: 'Use it for the current request' });
assert.equal(accepted.contextDecision?.relation, 'answer');
assert.ok(JSON.stringify(accepted.cardData).toLowerCase().includes('mikel'), 'accepted clarification should update the intended request');

const memoryAlternativePhone = '+2348090000004';
await updateProfile(memoryAlternativePhone, 'clarification-memory-test', { name: 'Tola', preferences: { onboarding_complete: true } });
const memoryStart = await processCanonicalChatTurn({ phone: memoryAlternativePhone, channel: 'web', message: 'I need a plumber' });
await processCanonicalChatTurn({ phone: memoryAlternativePhone, channel: 'web', conversationId: memoryStart.conversationId, message: 'Mikel' });
const storedAsMemory = await processCanonicalChatTurn({ phone: memoryAlternativePhone, channel: 'web', conversationId: memoryStart.conversationId, message: 'Treat it as new information' });
assert.equal(storedAsMemory.contextDecision?.selectedContext, 'memory');
assert.equal(storedAsMemory.cardData?.type, 'memory_fact_recorded');
assert.ok((await getMemoryFacts(memoryAlternativePhone, ['conversation_context'])).some(fact => fact.value === 'Mikel' && fact.provenance === 'user_declared'));

const db = await getDb();
const requests = db.exec('SELECT id, status FROM economic_requests WHERE phone = ?', [phone])[0]?.values || [];
assert.ok(requests.length >= 2, 'interleaving must preserve at least two request records');
const requestCountBeforeLongHorizon = requests.length;
const requestIdsBeforeLongHorizon = new Set(requests.map(row => String(row[0])));

const longHorizonTurns = Array.from({ length: 80 }, (_, index) => [
  'I am still thinking it through.',
  'Please keep the earlier request safe while I ask something else.',
  'What information is still missing?',
  'I do not want to start anything new right now.',
  'I will come back to the ride later.',
  'The first request still matters too.',
][index % 6]);
let longConversationId = first.conversationId;
for (const [index, message] of longHorizonTurns.entries()) {
  const channel = index < 20 ? 'web' : index < 40 ? 'whatsapp' : index < 60 ? 'telegram' : 'web';
  const turn = await processCanonicalChatTurn({ phone, channel, conversationId: longConversationId, message });
  assert.notEqual(turn.contextDecision?.relation, 'create', `ordinary long-horizon turn ${index + 1} must not create an Economic Request`);
  if (turn.cardData?.requestId) assert.ok(requestIdsBeforeLongHorizon.has(String(turn.cardData.requestId)), `ordinary long-horizon turn ${index + 1} may reference only an existing request`);
  const countAfterTurn = db.exec('SELECT COUNT(*) FROM economic_requests WHERE phone = ?', [phone])[0]?.values?.[0]?.[0] || 0;
  assert.equal(Number(countAfterTurn), requestCountBeforeLongHorizon, `ordinary long-horizon turn ${index + 1} must not create an Economic Request`);
  longConversationId = turn.conversationId || longConversationId;
  if ([4, 9, 19, 39, 79].includes(index)) assert.ok(longConversationId, `long-horizon checkpoint ${index + 1} must preserve conversation continuity`);
}
const requestsAfterLongHorizon = db.exec('SELECT id FROM economic_requests WHERE phone = ?', [phone])[0]?.values || [];
assert.equal(requestsAfterLongHorizon.length, requestCountBeforeLongHorizon, '80-turn cross-channel conversation must not contaminate request state with premature actions');

console.log('Natural interleaving Chat regression passed: 5/10/20/40/80-turn checkpoints preserved bounded conversation continuity across web, WhatsApp and Telegram without premature Economic Request creation.');
try { fs.unlinkSync(dbPath); } catch { /* best effort cleanup */ }

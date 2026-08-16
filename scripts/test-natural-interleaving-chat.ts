import assert from 'node:assert/strict';
import fs from 'node:fs';

const dbPath = `/tmp/kurukoo-natural-interleaving-${process.pid}.sqlite`;
try { fs.unlinkSync(dbPath); } catch { /* isolated test path */ }
process.env.NODE_ENV = 'test';
process.env.DB_PATH = dbPath;
process.env.MEMORY_ENCRYPTION_KEY = 'natural-interleaving-test-key';
process.env.KURUKOO_AGENT_ENABLED = 'true';
process.env.KURUKOO_AGENT_AUTONOMOUS = 'true';

const { updateProfile } = await import('../src/services/memoryProfile.js');
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

const resumed = await processCanonicalChatTurn({ phone, channel: 'web', conversationId: first.conversationId, message: 'resume my request' });
assert.equal(resumed.contextDecision?.relation, 'resume');
assert.ok(resumed.cardData?.requestId, 'resume should return a canonical request card');

const db = await getDb();
const requests = db.exec('SELECT id, status FROM economic_requests WHERE phone = ?', [phone])[0]?.values || [];
assert.ok(requests.length >= 2, 'interleaving must preserve at least two request records');

console.log('Natural interleaving Chat regression passed: memory did not corrupt the first request, a second request received a distinct canonical record, and explicit resumption returned a request card.');
try { fs.unlinkSync(dbPath); } catch { /* best effort cleanup */ }

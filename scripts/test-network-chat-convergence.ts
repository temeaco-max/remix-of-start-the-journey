import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const dbPath = path.join(os.tmpdir(), `kurukoo-network-chat-${process.pid}-${Date.now()}.sqlite`);
process.env.DB_PATH = dbPath;
process.env.NODE_ENV = 'test';
process.env.KURUKOO_SMOLLM2_LOCAL = 'false';
process.env.KURUKOO_FCM_PROJECT_ID = '';

const { getDb } = await import('../src/database.js');
const { updateProfile } = await import('../src/services/memoryProfile.js');
const { find_worker } = await import('../src/services/find-worker.js');
const { processCanonicalChatTurn } = await import('../src/services/canonicalChatTurnService.js');
const { createOpenIntention } = await import('../src/services/deferredRequestService.js');
const { processDueDeferred } = await import('../src/services/backgroundWorkers.js');

const userPhone = '+2348011112222';
const providerPhone = '+2348099998888';
const db = await getDb();

await updateProfile(userPhone, 'network-convergence-test', {
  name: 'Network User',
  location: 'Ikeja',
  country: 'ng',
  preferences: { onboarding_complete: true },
});
await updateProfile(providerPhone, 'network-convergence-test', {
  name: 'Verified Ikeja Plumber',
  location: 'Ikeja',
  primary_lga: 'Ikeja',
  country: 'ng',
  preferences: { onboarding_complete: true },
});
db.run(`UPDATE memory_profiles SET verified_provider = 1 WHERE phone = ?`, [providerPhone]);

db.run(`INSERT INTO skills (phone, skill, is_available, hourly_rate, rating, jobs_completed, operation_mode, service_radius_km) VALUES (?, 'plumber', 1, 25000, 4.8, 22, 'mobile', 15)`, [providerPhone]);

const discovery = await find_worker({ skill: 'plumber', location: 'Ikeja', max: 3 });
assert.equal(discovery.count, 1, 'canonical provider discovery should return the verified available provider');
assert.equal(discovery.providers[0].phone, providerPhone, 'discovery must preserve canonical provider identity');
assert.equal(discovery.providers[0].verified, true, 'discovery must expose verification truthfully');

const turn = await processCanonicalChatTurn({ phone: userPhone, message: 'I need a plumber.', channel: 'web' });
assert.ok(turn.conversationId, 'Chat network turn must create a canonical conversation');
assert.ok(turn.cardData, 'provider request should return a structured request card');
const requestId = typeof turn.cardData?.requestId === 'string' ? turn.cardData.requestId : null;
assert.ok(requestId, 'provider request card must identify the canonical Economic Request');

const intention = await createOpenIntention(userPhone, 'plumber', JSON.stringify({ location: 'Ikeja' }), {
  skill: 'plumber', location: 'Ikeja', economicRequestId: requestId!, maxAttempts: 3,
});
db.run(`UPDATE open_intentions SET next_check_at = datetime('now', '-1 minute') WHERE id = ?`, [intention.id]);
const deferred = await processDueDeferred();
assert.equal(deferred.matched, 1, 'deferred worker should re-enter canonical provider discovery');

const notifications = db.prepare(`SELECT title, body, link FROM internal_notifications WHERE phone = ? ORDER BY id DESC LIMIT 5`);
notifications.bind([userPhone]);
let foundLink: any = null;
while (notifications.step()) {
  const row = notifications.getAsObject() as any;
  if (String(row.title).includes('found a match')) { foundLink = row; break; }
}
notifications.free();
assert.ok(foundLink, 'deferred provider match should persist a notification');
assert.match(String(foundLink.link), /\/chat\?requestId=/, 'deferred notification must deep-link back to canonical Chat request context');
assert.match(String(foundLink.link), /prompt=/, 'deferred notification must include a truthful continuation prompt');

console.log('Network-to-Chat convergence contract passed: verified discovery, provider request card, deferred re-entry, notification persistence, and canonical Chat deep link are connected.');
try { fs.unlinkSync(dbPath); } catch {}

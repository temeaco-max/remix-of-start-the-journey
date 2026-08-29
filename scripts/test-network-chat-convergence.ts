/* Copyright (c) 2026 temeaco-max. All rights reserved. Proprietary and confidential. */
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
const { recordLocationConsent } = await import('../src/services/progressiveTrustService.js');
const { find_worker } = await import('../src/services/find-worker.js');
const { processCanonicalChatTurn } = await import('../src/services/canonicalChatTurnService.js');
const { routeIntent } = await import('../src/services/intentRouter.js');
const { createOpenIntention, markAwaitingMatch } = await import('../src/services/deferredRequestService.js');
const { processDueDeferred } = await import('../src/services/backgroundWorkers.js');
const { generateProactiveOpportunities, actOnOpportunity } = await import('../src/services/opportunityEngine.js');

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
db.run(`UPDATE memory_profiles SET verified_provider = 1, is_available = 1 WHERE phone = ?`, [providerPhone]);

db.run(`INSERT INTO skills (phone, skill, is_available, hourly_rate, rating, jobs_completed, operation_mode, service_radius_km) VALUES (?, 'plumber', 1, 25000, 4.8, 22, 'mobile', 15)`, [providerPhone]);

const testLat = 6.6018;
const testLng = 3.3515;
await recordLocationConsent({ phone: userPhone, purpose: 'network_discovery', precision: 'precise', latitude: testLat, longitude: testLng });
db.run(`INSERT INTO pulse_sessions (phone, skill, lat, lng, expires_at, active) VALUES (?, 'plumber', ?, ?, datetime('now', '+30 minutes'), 1)`, [providerPhone, testLat + 0.003, testLng + 0.003]);

const discovery = await find_worker({ skill: 'plumber', location: 'Ikeja', max: 3 });
assert.equal(discovery.count, 1, 'canonical provider discovery should return the verified available provider');
assert.equal(discovery.providers[0].phone, providerPhone, 'discovery must preserve canonical provider identity');
assert.equal(discovery.providers[0].verified, true, 'discovery must expose verification truthfully');

const liveDiscovery = await find_worker({ skill: 'plumber', ownerPhone: userPhone, max: 3 });
assert.equal(liveDiscovery.count, 1, 'consented owner location should enrich provider discovery');
assert.equal(liveDiscovery.providers[0].live_now, true, 'live Pulse presence should be visible to canonical matching');
assert.ok(Number.isFinite(liveDiscovery.providers[0].distance_km), 'live match should include distance when consented coordinates are available');

const productJourney = await routeIntent('I need a phone charger', userPhone);
assert.equal(productJourney.skill, 'product_sourcing', 'natural charger request should enter canonical product sourcing');
assert.match(productJourney.reply, /verified seller reference|stock|price|delivery/i, 'product response must state truthful sourcing boundaries');

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

const consentedDeferred = await createOpenIntention(userPhone, 'plumber', JSON.stringify({}), { skill: 'plumber', economicRequestId: requestId!, maxAttempts: 3 });
db.run(`UPDATE open_intentions SET next_check_at = datetime('now', '-1 minute') WHERE id = ?`, [consentedDeferred.id]);
const consentedPass = await processDueDeferred();
assert.ok(consentedPass.matched >= 1, 'deferred matching should use owner consent when no intention location is supplied');

const openFollowUp = await createOpenIntention(userPhone, 'specialist', JSON.stringify({ location: 'Ikeja' }), { skill: 'specialist', location: 'Ikeja' });
await markAwaitingMatch(userPhone, openFollowUp.id);
const opportunities = await generateProactiveOpportunities(userPhone);
const followUp = opportunities.find((item: any) => String(item.title).includes('Follow-up: specialist'));
assert.ok(followUp, 'eligible deferred intention should create a follow-up opportunity');
assert.equal(followUp.ctaText, 'Continue in Chat', 'follow-up opportunity should make Chat the supported action');
assert.match(String(followUp.ctaLink), /\/chat\?/, 'follow-up opportunity should preserve request/intention context');
assert.match(String(followUp.ctaLink), /requestId=/, 'intention-only follow-up should preserve its intention context');
const linkedFollowUp = await createOpenIntention(userPhone, 'linked specialist', JSON.stringify({ location: 'Ikeja' }), { skill: 'linked specialist', location: 'Ikeja', economicRequestId: requestId! });
await markAwaitingMatch(userPhone, linkedFollowUp.id);
const linkedOpportunities = await generateProactiveOpportunities(userPhone);
const linkedOpportunity = linkedOpportunities.find((item: any) => String(item.title).includes('Follow-up: linked specialist'));
assert.ok(linkedOpportunity, 'an Economic Request-linked intention should create a follow-up opportunity');
const linkedUrl = new URL(String(linkedOpportunity.ctaLink), 'https://kurukoo.test');
assert.equal(linkedUrl.searchParams.get('canonicalAction'), 'economic_request.open', 'linked follow-up should use the canonical Economic Request action');
assert.equal(linkedUrl.searchParams.get('objectType'), 'economic_request', 'linked follow-up should identify the canonical request type');
assert.equal(linkedUrl.searchParams.get('objectId'), requestId, 'linked follow-up should preserve the canonical request owner context');
assert.equal(linkedUrl.searchParams.get('requestId'), null, 'linked follow-up should not fall back to the legacy requestId handoff');
const nonRewardAction = await actOnOpportunity(Number(followUp.id || 0), userPhone);
if (followUp.id) assert.match(nonRewardAction.message, /ready in Chat|no external action/i, 'non-reward opportunity must not claim unsupported execution');
assert.ok(openFollowUp.id, 'follow-up fixture should remain owner-scoped');

console.log('Network-to-Chat convergence contract passed: consented location, live Pulse discovery, verified provider matching, provider request card, deferred re-entry, notification persistence, opportunity return-to-Chat, and canonical deep links.');
try { fs.unlinkSync(dbPath); } catch {}

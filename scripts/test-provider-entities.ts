import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const dbPath = path.join(os.tmpdir(), `kurukoo-provider-entities-${process.pid}-${Date.now()}.sqlite`);
process.env.DB_PATH = dbPath;
process.env.NODE_ENV = 'production';
process.env.KURUKOO_PAY_PROVIDER = 'sandbox';

const { getDb, saveDb } = await import('../src/database.js');
const { find_worker } = await import('../src/services/find-worker.js');
const { createEconomicRequest, getEconomicRequest, transitionEconomicRequest } = await import('../src/services/skillFlows.js');
const { runOrchestrationPass, lockEscrowForEconomicRequest } = await import('../src/services/tradeEngine.js');
const { isProviderEntityType, normalizeProviderEntityType } = await import('../src/services/providerEntity.js');

const db = await getDb();
const customerPhone = '+2347000000301';
const humanPhone = '+2347000000302';
const businessPhone = '+2347000000303';
const authorizedDronePhone = '+2347000000304';
const unauthorizedDronePhone = '+2347000000305';

for (const [phone, name, providerType, verified] of [
  [customerPhone, 'Provider Entity Customer', 'human', 0],
  [humanPhone, 'Human Plumber', 'human', 1],
  [businessPhone, 'Business Plumber', 'business', 1],
  [authorizedDronePhone, 'Authorized Delivery Asset', 'drone', 1],
  [unauthorizedDronePhone, 'Unverified Delivery Asset', 'drone', 0],
] as const) {
  db.run(
    `INSERT INTO memory_profiles (phone, name, location, country, provider_type, verified_provider)
     VALUES (?, ?, 'Ikeja', 'ng', ?, ?)`,
    [phone, name, providerType, verified]
  );
}

db.run(`INSERT INTO skills (phone, skill, is_available, hourly_rate, rating, jobs_completed, operation_mode) VALUES (?, 'plumber', 1, 3000, 4.8, 10, 'stationary')`, [humanPhone]);
db.run(`INSERT INTO skills (phone, skill, is_available, hourly_rate, rating, jobs_completed, operation_mode) VALUES (?, 'plumber', 1, 3500, 4.7, 8, 'stationary')`, [businessPhone]);
db.run(`INSERT INTO skills (phone, skill, is_available, hourly_rate, rating, jobs_completed, operation_mode) VALUES (?, 'delivery', 1, 4500, 4.9, 4, 'delivery')`, [authorizedDronePhone]);
// A category-specific human verification marker must not authorize a non-human entity.
db.run(`INSERT INTO skills (phone, skill, is_available, hourly_rate, rating, jobs_completed, operation_mode, verified_artist) VALUES (?, 'delivery', 1, 100, 5, 99, 'delivery', 1)`, [unauthorizedDronePhone]);

assert.equal(isProviderEntityType('drone'), true, 'drone must be a constrained provider entity type');
assert.equal(isProviderEntityType('invented_asset'), false, 'unknown provider types must be rejected');
assert.equal(normalizeProviderEntityType('invented_asset'), 'human', 'legacy/invalid provider types must normalize safely');

const persistedTypes = db.exec(
  `SELECT phone, provider_type FROM memory_profiles WHERE phone IN (?, ?, ?) ORDER BY phone`,
  [humanPhone, businessPhone, authorizedDronePhone]
)[0]?.values || [];
assert.deepEqual(
  persistedTypes.map((row: unknown[]) => row[1]),
  ['human', 'business', 'drone'],
  'provider type must persist without changing existing human records'
);

const plumbers = await find_worker({ skill: 'plumber', location: 'Ikeja', max: 10 });
assert.deepEqual(
  plumbers.providers.map((provider) => provider.phone).sort(),
  [humanPhone, businessPhone].sort(),
  'existing verified human and business providers must remain discoverable through the canonical matcher'
);
assert.deepEqual(
  plumbers.providers.map((provider) => provider.provider_type).sort(),
  ['business', 'human'],
  'canonical discovery must represent provider type alongside the existing capability match'
);

const deliveries = await find_worker({ skill: 'delivery', location: 'Ikeja', max: 10 });
assert.deepEqual(
  deliveries.providers.map((provider) => provider.phone),
  [authorizedDronePhone],
  'only an independently verified autonomous provider may match its declared delivery capability'
);
assert.equal(deliveries.providers[0]?.provider_type, 'drone', 'authorized autonomous provider type must be represented in discovery');
assert.equal(deliveries.providers[0]?.distance_km, undefined, 'discovery must not fabricate location or telemetry data');
assert.equal(deliveries.providers[0]?.hourly_rate, 4500, 'discovery must use the declared provider rate rather than fabricate a quote');

const requestId = 'provider-entity-delivery-request';
await createEconomicRequest({
  id: requestId,
  phone: customerPhone,
  skill: 'delivery',
  requirements: { location: 'Ikeja' },
});
await transitionEconomicRequest(requestId, 'awaiting_match');
const orchestration = await runOrchestrationPass();
assert.deepEqual(orchestration.errors, [], 'provider entity discovery must not introduce orchestration errors');
const request = await getEconomicRequest(requestId);
assert.equal(request?.providerPhone, authorizedDronePhone, 'Economic Requests must use the same canonical discovery result');
assert.equal(request?.status, 'quoted', 'authorized provider discovery must continue through the existing quote lifecycle');
assert.equal((request?.quote as { source?: string } | undefined)?.source, 'provider_listed_rate', 'the existing declared-rate quote path must remain canonical');

const escrowAttempt = await lockEscrowForEconomicRequest(requestId);
assert.equal(escrowAttempt.success, false, 'provider type must not bypass verified-payment and escrow requirements');
assert.match(escrowAttempt.message, /Verified payment must be completed/, 'escrow must retain the existing payment-evidence gate');

saveDb(true);
try { fs.rmSync(dbPath, { force: true }); } catch { /* temporary database cleanup is best-effort */ }

console.log('Provider entity integration checks passed');
console.log('Verified: canonical human/business discovery, constrained provider types, authorized autonomous concept matching, no verification bypass, no fabricated telemetry, and unchanged Economic Request/escrow gates.');

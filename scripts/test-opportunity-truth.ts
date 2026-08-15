import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const dbPath = path.join(os.tmpdir(), `kurukoo-opportunity-truth-${process.pid}-${Date.now()}.sqlite`);
process.env.DB_PATH = dbPath;
process.env.NODE_ENV = 'test';
process.env.KURUKOO_FCM_PROJECT_ID = '';

const { getDb } = await import('../src/database.js');
const { updateProfile } = await import('../src/services/memoryProfile.js');
const { generateProactiveOpportunities } = await import('../src/services/opportunityEngine.js');

const phone = '+2348012345678';
const db = await getDb();
await updateProfile(phone, 'opportunity-truth-test', {
  name: 'Evidence User',
  location: 'Ikeja',
  primary_lga: 'Ikeja',
  country: 'ng',
  preferences: { onboarding_complete: true },
});
db.run(`INSERT INTO skills (phone, skill, is_available, operation_mode) VALUES (?, 'plumber', 1, 'mobile')`, [phone]);

const withoutDemand = await generateProactiveOpportunities(phone);
assert.equal(withoutDemand.some((item: any) => item.type === 'job'), false, 'a provider skill alone must not create a local demand claim');
assert.equal(withoutDemand.some((item: any) => /rice|wholesale|discount|supply alert/i.test(String(item.title) + String(item.subtitle))), false, 'location defaults must not create unsupported market claims');

const requestId = 'opportunity-truth-request';
db.run(`INSERT INTO economic_requests (id, phone, skill, category, status, requirements_json) VALUES (?, ?, 'plumber', 'home_services', 'requested', ?)`, [requestId, '+2348099999999', JSON.stringify({ location: 'Ikeja' })]);
const withDemand = await generateProactiveOpportunities(phone);
const demandAlert = withDemand.find((item: any) => item.type === 'job');
assert.ok(demandAlert, 'an open matching Economic Request should create a provider opportunity');
assert.match(String(demandAlert.subtitle), /recorded (demand|request)/i, 'demand opportunity must identify its evidence source');
assert.match(String(demandAlert.ctaLink), /\/chat\?prompt=/, 'demand opportunity must return to canonical Chat');

console.log('Opportunity truth contract passed: no fabricated demand or location claims, evidence-backed demand alert, and Chat continuation link.');
try { fs.unlinkSync(dbPath); } catch {}

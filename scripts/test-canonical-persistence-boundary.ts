import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const dbPath = path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'kurukoo-persistence-')), 'state.sqlite');
process.env.KURUKOO_DATABASE_MODE = 'sqljs';
process.env.DB_PATH = dbPath;
process.env.NODE_ENV = 'test';

const { getCanonicalStore, closeCanonicalStore } = await import('../src/services/canonicalStore.js');
const { updateProfile, getProfile, recordMemoryFact, getMemoryFacts } = await import('../src/services/memoryProfile.js');
const { appendChatMessage, listChatMessages } = await import('../src/services/chatConversationService.js');
const { requestPhoneOtp, verifyPhoneOtp } = await import('../src/services/otpAuthService.js');
const { enqueueDurableJob, claimDurableJob, completeDurableJob } = await import('../src/services/durableJobQueue.js');

const store = await getCanonicalStore();
await store.run('CREATE TABLE IF NOT EXISTS canonical_boundary_test (id TEXT PRIMARY KEY, value TEXT)');
await store.run('INSERT INTO canonical_boundary_test(id,value) VALUES(?,?)', ['shared', 'one']);
assert.equal((await store.one<any>('SELECT value FROM canonical_boundary_test WHERE id=?', ['shared']))?.value, 'one');
await assert.rejects(() => store.transaction(async tx => { await tx.run('UPDATE canonical_boundary_test SET value=? WHERE id=?', ['rolled-back','shared']); throw new Error('rollback'); }));
assert.equal((await store.one<any>('SELECT value FROM canonical_boundary_test WHERE id=?', ['shared']))?.value, 'one');

await updateProfile('+2348000000000', 'boundary-test', { name: 'Boundary User', location: 'Lagos', provenance: 'user_declared' });
await recordMemoryFact('+2348000000000', 'language', 'English', 'user_declared');
assert.equal((await getProfile('+2348000000000'))?.name, 'Boundary User');
assert.equal((await getMemoryFacts('+2348000000000', ['language']))[0]?.value, 'English');

const message = await appendChatMessage({ phone: '+2348000000000', sender: 'user', content: 'persistence boundary message', channel: 'web' });
assert.ok(message.id > 0);
assert.equal((await listChatMessages('+2348000000000', { limit: 10 })).some(row => row.content === 'persistence boundary message'), true);

process.env.OTP_DEBUG = 'true';
const otp = await requestPhoneOtp('+2348111111111');
assert.equal(otp.success, true);
assert.ok(otp.debugCode);
assert.equal((await verifyPhoneOtp('+2348111111111', otp.debugCode!)).success, true);

const jobId = await enqueueDurableJob({ kind: 'canonical.boundary', payload: { ok: true } });
const job = await claimDurableJob('boundary-worker');
assert.equal(job?.id, jobId);
assert.equal(await completeDurableJob(jobId, 'boundary-worker'), true);

await closeCanonicalStore();
console.log('Canonical persistence boundary: VERIFIED (SQL.js compatibility path, rollback, Memory, Chat, OTP and durable job state).');

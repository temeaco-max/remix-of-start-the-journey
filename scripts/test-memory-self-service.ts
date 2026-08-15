import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

process.env.NODE_ENV = 'test';
const { getDb } = await import('../src/database.js');
const { getMemoryFacts, recordMemoryFact, revokeMemoryFact } = await import('../src/services/memoryProfile.js');

const db = await getDb();
const owner = '+2347000099001';
const stranger = '+2347000099002';
db.run('INSERT OR IGNORE INTO memory_profiles (phone, name) VALUES (?, ?)', [owner, 'Memory Owner']);
db.run('INSERT OR IGNORE INTO memory_profiles (phone, name) VALUES (?, ?)', [stranger, 'Memory Stranger']);

await recordMemoryFact(owner, 'preference', 'short answers', 'user_declared', { sourceRef: 'test' });
await recordMemoryFact(stranger, 'preference', 'long answers', 'user_declared', { sourceRef: 'test' });
const ownerFacts = await getMemoryFacts(owner);
assert.ok(ownerFacts.some((fact) => fact.field === 'preference' && fact.value === 'short answers'));
const ownerFact = ownerFacts.find((fact) => fact.field === 'preference' && fact.value === 'short answers');
assert.ok(ownerFact, 'owner fact should be present');

const strangerAttempt = await revokeMemoryFact(stranger, ownerFact.id);
assert.equal(strangerAttempt.revoked, false, 'another account must not revoke the owner fact');
assert.equal(strangerAttempt.reason, 'not_found');

const revoked = await revokeMemoryFact(owner, ownerFact.id);
assert.deepEqual(revoked, { revoked: true });
assert.equal((await getMemoryFacts(owner)).some((fact) => fact.id === ownerFact.id), false, 'revoked facts must leave active retrieval');
const repeated = await revokeMemoryFact(owner, ownerFact.id);
assert.equal(repeated.revoked, false);
assert.equal(repeated.reason, 'already_revoked');

const source = fs.readFileSync(path.join(process.cwd(), 'src/routes/economicRequestRouter.ts'), 'utf8');
assert.match(source, /router\.get\('\/memory\/facts', authenticateUser/);
assert.match(source, /router\.delete\('\/memory\/facts\/:id', authenticateUser/);
assert.match(source, /facts\.map\(\(\{ id, field, value, provenance, confidence, observedAt, expiresAt \}\)/, 'memory route must not expose source_ref');

console.log('Memory self-service contract passed: owner scoping, revocation, repeat handling, active retrieval, and source-reference redaction.');

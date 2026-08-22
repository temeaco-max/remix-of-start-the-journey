import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const connectionString = String(process.env.KURUKOO_TEST_POSTGRES_URL || '').trim();

if (!connectionString) {
  console.log('PostgreSQL migration round-trip: BLOCKED_EXTERNAL — set KURUKOO_TEST_POSTGRES_URL to a disposable local PostgreSQL database.');
  process.exit(0);
}

const postgresModule = require('postgres') as { default?: any } | any;
const postgres = typeof postgresModule === 'function' ? postgresModule : postgresModule.default;
if (typeof postgres !== 'function') throw new Error('Pinned postgres client is required for the migration round-trip contract.');

const workspace = fs.mkdtempSync(path.join(os.tmpdir(), 'kurukoo-postgres-roundtrip-'));
const sourcePath = path.join(workspace, 'source.sqlite');
const sourcePhone = '+2348000000999';
const requestId = `pg-roundtrip-${crypto.randomUUID()}`;
const executionId = `exec-roundtrip-${crypto.randomUUID()}`;
const schemaMigrationVersion = `sqljs-export-`;

process.env.KURUKOO_DATABASE_MODE = 'sqljs';
process.env.DB_PATH = sourcePath;
process.env.NODE_ENV = 'test';
process.env.KURUKOO_AGENT_ENABLED = 'true';

const { getDb, saveDb } = await import('../src/database.js');
const { updateProfile } = await import('../src/services/memoryProfile.js');
const { appendChatMessage } = await import('../src/services/chatConversationService.js');
const { createEconomicRequest } = await import('../src/services/economicRequestPersistence.js');
const { sendFcmPush } = await import('../src/services/pushNotifications.js');
const { recordAgentWorkerRun } = await import('../src/services/agentRuntime.js');

await updateProfile(sourcePhone, 'postgres-roundtrip', {
  name: 'PostgreSQL Round Trip',
  location: 'Lagos',
  preferences: { preferred_channel: 'web' },
  provenance: 'user_declared',
});
await appendChatMessage({ phone: sourcePhone, sender: 'user', content: 'Keep this canonical chat message.', channel: 'web' });
await createEconomicRequest({ id: requestId, phone: sourcePhone, skill: 'plumber', requirements: { urgency: 'today' } });
await sendFcmPush(sourcePhone, 'Round-trip notification', 'Retain this queue record.', '/chat');
await recordAgentWorkerRun({ startedAt: new Date().toISOString(), status: 'completed', dueGoalCount: 0, updatedGoalCount: 0 });

const sourceDb = await getDb();
sourceDb.run(`INSERT INTO execution_requests(id,request_id,action_id,provider_phone,role,capability,action_requested,idempotency_key,correlation_id,connector_id,authorization_context,status,requested_at,updated_at) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?)`, [
  executionId,
  requestId,
  'roundtrip-action',
  '+2348000000777',
  'service_provider',
  'plumber',
  'inspect',
  `roundtrip-idempotency-${executionId}`,
  `roundtrip-correlation-${executionId}`,
  'development-simulator',
  JSON.stringify({ test_only: true }),
  'pending',
  new Date().toISOString(),
  new Date().toISOString(),
]);
saveDb(true);

const sourceDigestBefore = crypto.createHash('sha256').update(fs.readFileSync(sourcePath)).digest('hex');
  const migration = spawnSync('npx', ['tsx', 'scripts/migrate-sqlite-to-postgres.ts', '--execute'], {
  cwd: process.cwd(),
  encoding: 'utf8',
  env: {
    ...process.env,
    DB_PATH: sourcePath,
    DATABASE_URL: connectionString,
    KURUKOO_POSTGRES_SSL: String(process.env.KURUKOO_POSTGRES_SSL || 'false'),
  },
});
assert.equal(migration.status, 0, `${migration.stdout}\n${migration.stderr}`);
assert.match(migration.stdout, /"status": "verified"/);
const sourceDigestAfter = crypto.createHash('sha256').update(fs.readFileSync(sourcePath)).digest('hex');
  assert.equal(sourceDigestAfter, sourceDigestBefore, 'SQL.js export/import must not mutate the source database');

  const canonicalRuntime = spawnSync('npx', ['tsx', 'scripts/test-postgres-canonical-runtime.ts'], {
    cwd: process.cwd(),
    encoding: 'utf8',
    env: {
      ...process.env,
      KURUKOO_TEST_POSTGRES_URL: connectionString,
      KURUKOO_POSTGRES_SSL: String(process.env.KURUKOO_POSTGRES_SSL || 'false'),
      KURUKOO_POSTGRES_RUNTIME_PHONE: sourcePhone,
      KURUKOO_POSTGRES_RUNTIME_REQUEST_ID: requestId,
      KURUKOO_POSTGRES_RUNTIME_EXECUTION_ID: executionId,
    },
  });
  assert.equal(canonicalRuntime.status, 0, `${canonicalRuntime.stdout}\n${canonicalRuntime.stderr}`);
  assert.match(canonicalRuntime.stdout, /PostgreSQL canonical runtime: VERIFIED/);

const sql = postgres(connectionString, {
  max: 2,
  connect_timeout: 5,
  ssl: String(process.env.KURUKOO_POSTGRES_SSL || 'false').toLowerCase() !== 'false' ? 'require' : false,
});

try {
  const profile = await sql`SELECT phone, preferences, behavior_patterns FROM memory_profiles WHERE phone = ${sourcePhone}`;
  assert.equal(profile.length, 1, 'encrypted Memory profile must survive import');
  assert.match(String(profile[0].preferences), /^[a-f0-9]{32}:/i, 'preferences must remain encrypted at rest');
  assert.match(String(profile[0].behavior_patterns), /^[a-f0-9]{32}:/i, 'behavior patterns must remain encrypted at rest');

  const messages = await sql`SELECT content FROM messages WHERE phone = ${sourcePhone}`;
  assert.equal(messages.some((row: any) => row.content === 'Keep this canonical chat message.'), true, 'Chat message must survive import');
  const requests = await sql`SELECT id, status FROM economic_requests WHERE id = ${requestId}`;
  assert.deepEqual(requests.map((row: any) => [row.id, row.status]), [[requestId, 'requested']], 'Economic Request must survive import');
  const notifications = await sql`SELECT title FROM internal_notifications WHERE phone = ${sourcePhone}`;
  assert.equal(notifications.some((row: any) => row.title === 'Round-trip notification'), true, 'Notification queue record must survive import');
  const agentRuns = await sql`SELECT COUNT(*)::int AS count FROM agent_worker_runs`;
  assert.ok(Number(agentRuns[0]?.count || 0) >= 1, 'Agent runtime state must survive import');
  const execution = await sql`SELECT id, idempotency_key FROM execution_requests WHERE id = ${executionId}`;
  assert.equal(execution.length, 1, 'Execution record must survive import');
  await assert.rejects(() => sql.unsafe(`INSERT INTO execution_requests(id,request_id,action_id,provider_phone,role,capability,action_requested,idempotency_key,correlation_id,connector_id,authorization_context,status,requested_at,updated_at) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)`, [
    `duplicate-${executionId}`, requestId, 'roundtrip-action', '+2348000000777', 'service_provider', 'plumber', 'inspect', execution[0].idempotency_key, `duplicate-${executionId}`, 'development-simulator', '{}', 'pending', new Date().toISOString(), new Date().toISOString(),
  ]), /duplicate key|unique/i, 'execution idempotency must remain unique after import');
  const ledger = await sql`SELECT version FROM schema_migrations WHERE version LIKE ${`${schemaMigrationVersion}%`}`;
  assert.equal(ledger.length, 1, 'import must record its deterministic schema checksum in the migration ledger');
  console.log('PostgreSQL migration round-trip: VERIFIED — real PostgreSQL schema, source immutability, encrypted Memory, Chat, Economic Request, notification, agent, execution, and idempotency preservation passed.');
} finally {
  await sql.end({ timeout: 5 });
  fs.rmSync(workspace, { recursive: true, force: true });
}

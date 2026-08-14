import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import type { AddressInfo } from 'node:net';

const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'kurukoo-fresh-db-'));
process.env.DB_PATH = path.join(tempDir, 'fresh.sqlite');
process.env.JWT_SECRET = 'fresh-database-test-secret-0123456789';
process.env.ADMIN_USERNAME = 'fresh-admin';
process.env.ADMIN_PASSWORD = 'fresh-admin-password';
process.env.KURUKOO_DISABLE_LISTEN = 'true';
process.env.KURUKOO_DEV_AUTH = 'false';

const { app } = await import('../src/index.js');
const { getDb } = await import('../src/database.js');
const { sendFcmPush } = await import('../src/services/pushNotifications.js');
const { getPilotReadiness } = await import('../src/services/pilotReadiness.js');

const server = app.listen(0, '127.0.0.1');
await new Promise<void>((resolve, reject) => { server.once('listening', resolve); server.once('error', reject); });
const { port } = server.address() as AddressInfo;
const base = `http://127.0.0.1:${port}`;
try {
  const db = await getDb();
  const requiredTables = ['memory_profiles', 'messages', 'economic_requests', 'internal_notifications', 'topics', 'trust_score_ledger'];
  for (const table of requiredTables) assert.ok(db.exec(`SELECT 1 FROM ${table} LIMIT 1`) || true, `fresh schema must create ${table}`);
  for (const route of ['/health', '/channels', '/topics', '/sitemap-topics.xml', '/robots.txt', '/discover', '/resources', '/pricing']) {
    const response = await fetch(`${base}${route}`, { redirect: 'manual' });
    assert.ok([200, 301, 302].includes(response.status), `fresh runtime route should be available: ${route}`);
  }
  assert.equal((await sendFcmPush('+2348000000000', 'Fresh DB', 'Internal notification')).valueOf(), false, 'missing FCM must not claim external delivery');
  const notifications = db.exec("SELECT delivery_state FROM internal_notifications WHERE phone='+2348000000000'");
  assert.equal(notifications[0]?.values?.[0]?.[0], 'queued', 'fresh notification must persist queued delivery state');
  const readiness = getPilotReadiness(process.env, process.cwd());
  assert.equal(readiness.categories.CHANNELS.FCM.state, 'NOT_CONFIGURED');
  assert.equal(readiness.categories.AGENT.runtime.state, 'DISABLED');
  console.log('Fresh database regression passed: schema bootstrap, core routes, internal notification queue, readiness state, Topics, trust, and request tables are deployment-independent.');
} finally {
  server.close();
  fs.rmSync(tempDir, { recursive: true, force: true });
}

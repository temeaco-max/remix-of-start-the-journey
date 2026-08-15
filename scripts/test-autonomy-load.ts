import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'kurukoo-autonomy-load-'));
process.env.NODE_ENV = 'test';
process.env.DB_PATH = path.join(tempDir, 'autonomy-load.sqlite');
process.env.KURUKOO_DISABLE_LISTEN = 'true';
process.env.KURUKOO_AGENT_ENABLED = 'true';
process.env.KURUKOO_AGENT_AUTONOMOUS = 'true';

const { getDb } = await import('../src/database.js');
const { listQueuedNotifications, sendFcmPush } = await import('../src/services/pushNotifications.js');

const startRss = process.memoryUsage().rss;
const batchSize = 100;
const phones = Array.from({ length: batchSize }, (_, index) => `+2348099${String(index).padStart(5, '0')}`);
const results = await Promise.all(phones.map((phone, index) => sendFcmPush(phone, 'Load test', `Bounded notification ${index}`, '/chat/')));
assert.equal(results.filter(Boolean).length, 0, 'Unconfigured FCM must never report delivered during load testing');

const duplicateResults = await Promise.all([
  sendFcmPush(phones[0], 'Duplicate', 'Same body', '/chat/'),
  sendFcmPush(phones[0], 'Duplicate', 'Same body', '/chat/'),
  sendFcmPush(phones[0], 'Duplicate', 'Same body', '/chat/'),
]);
assert.equal(duplicateResults.filter(result => result === false).length, 3, 'Duplicate enqueue attempts must remain non-delivery and idempotent');

const db = await getDb();
const count = Number(db.exec(`SELECT COUNT(*) AS count FROM internal_notifications WHERE title = 'Load test'`)[0]?.values?.[0]?.[0] || 0);
assert.equal(count, batchSize, 'Concurrent enqueue should persist exactly one record per unique notification');
const queued = await listQueuedNotifications(200);
assert.equal(queued.filter(item => item.title === 'Load test').length, batchSize, 'All load-test notifications must be durably queued');
process.env.KURUKOO_NOTIFICATION_MAX_QUEUE = String(batchSize);
assert.equal(await sendFcmPush(phones[0], 'Queue cap', 'This must be rejected at the configured cap', '/chat/'), false, 'A full pending queue must fail closed instead of growing without bound');
const capped = Number(db.exec(`SELECT COUNT(*) AS count FROM internal_notifications WHERE title = 'Queue cap'`)[0]?.values?.[0]?.[0] || 0);
assert.equal(capped, 0, 'Queue-cap rejection must not create a durable record');

const rssGrowthMb = (process.memoryUsage().rss - startRss) / 1024 / 1024;
assert.ok(rssGrowthMb < 128, `Notification enqueue RSS growth exceeded bounded local threshold: ${rssGrowthMb.toFixed(2)} MB`);
console.log(`Autonomy load regression passed: ${batchSize} concurrent durable enqueues, duplicate suppression, provider non-attribution, and RSS growth ${rssGrowthMb.toFixed(2)} MB.`);

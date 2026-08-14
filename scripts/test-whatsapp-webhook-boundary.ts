import assert from 'node:assert/strict';
import type { AddressInfo } from 'node:net';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'kurukoo-wa-webhook-'));
process.env.DB_PATH = path.join(tempDir, 'whatsapp.sqlite');
process.env.JWT_SECRET = 'whatsapp-webhook-test-secret-0123456789';
process.env.WHATSAPP_VERIFY_TOKEN = 'fixture-verify-token';
process.env.KURUKOO_DISABLE_LISTEN = 'true';

const { app } = await import('../src/index.js');
const server = app.listen(0, '127.0.0.1');
await new Promise<void>((resolve, reject) => { server.once('listening', resolve); server.once('error', reject); });
const { port } = server.address() as AddressInfo;
const base = `http://127.0.0.1:${port}`;
try {
  const verified = await fetch(`${base}/api/webhook/whatsapp?hub.mode=subscribe&hub.verify_token=fixture-verify-token&hub.challenge=challenge-123`);
  assert.equal(verified.status, 200);
  assert.equal(await verified.text(), 'challenge-123');
  const wrong = await fetch(`${base}/api/webhook/whatsapp?hub.mode=subscribe&hub.verify_token=wrong&hub.challenge=challenge-123`);
  assert.equal(wrong.status, 403);
  const missing = await fetch(`${base}/api/webhook/whatsapp?hub.mode=subscribe&hub.challenge=challenge-123`);
  assert.equal(missing.status, 403);
  console.log('WhatsApp webhook boundary regression passed: exact challenge verification succeeds and missing/wrong tokens fail closed.');
} finally {
  server.close();
  fs.rmSync(tempDir, { recursive: true, force: true });
}

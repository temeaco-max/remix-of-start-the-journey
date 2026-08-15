import assert from 'node:assert/strict';
import type { AddressInfo } from 'node:net';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'kurukoo-wa-webhook-'));
process.env.DB_PATH = path.join(tempDir, 'whatsapp.sqlite');
process.env.JWT_SECRET = 'whatsapp-webhook-test-secret-0123456789';
process.env.WHATSAPP_VERIFY_TOKEN = 'fixture-verify-token';
process.env.WHATSAPP_APP_SECRET = 'fixture-app-secret';
process.env.TELEGRAM_WEBHOOK_SECRET = 'fixture-telegram-secret';
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
  const invalidWhatsApp = await fetch(`${base}/api/webhook/whatsapp`, { method: 'POST', headers: { 'content-type': 'application/json', 'x-hub-signature-256': 'sha256=invalid' }, body: JSON.stringify({ entry: [] }) });
  assert.equal(invalidWhatsApp.status, 401);
  const invalidTelegram = await fetch(`${base}/api/webhook/telegram`, { method: 'POST', headers: { 'content-type': 'application/json', 'x-telegram-bot-api-secret-token': 'wrong' }, body: JSON.stringify({ message: { text: 'hello', chat: { id: 1 }, from: { id: 1 } } }) });
  assert.equal(invalidTelegram.status, 401);
  console.log('Webhook boundary regression passed: exact WhatsApp challenge verification succeeds and invalid WhatsApp/Telegram authentication fails closed.');
} finally {
  server.close();
  fs.rmSync(tempDir, { recursive: true, force: true });
}

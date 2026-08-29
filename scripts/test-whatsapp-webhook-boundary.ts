/* Copyright (c) 2026 temeaco-max. All rights reserved. Proprietary and confidential. */
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
process.env.WHATSAPP_TOKEN = 'fixture-whatsapp-token';
process.env.WHATSAPP_PHONE_NUMBER_ID = 'fixture-phone-number-id';
process.env.TELEGRAM_WEBHOOK_SECRET = 'fixture-telegram-secret';
process.env.TELEGRAM_BOT_TOKEN = 'fixture-telegram-bot-token';
process.env.KURUKOO_DISABLE_LISTEN = 'true';

const { app } = await import('../src/index.js');
const { isChannelConfigured } = await import('../src/channels/channelRegistry.js');
assert.equal(isChannelConfigured('whatsapp'), true, 'WhatsApp readiness requires and recognizes the full credential boundary');
assert.equal(isChannelConfigured('telegram'), true, 'Telegram readiness requires both bot and webhook credentials');
process.env.WHATSAPP_APP_SECRET = 'CHANGE_ME_TO_A_REAL_SECRET';
assert.equal(isChannelConfigured('whatsapp'), false, 'WhatsApp placeholder authentication must not be reported configured');
process.env.WHATSAPP_APP_SECRET = 'fixture-app-secret';
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
  const priorNodeEnv = process.env.NODE_ENV;
  process.env.NODE_ENV = 'production';
  delete process.env.TELEGRAM_WEBHOOK_SECRET;
  const missingTelegramSecret = await fetch(`${base}/api/webhook/telegram`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ message: { text: 'hello', chat: { id: 1 }, from: { id: 1 } } }) });
  assert.equal(missingTelegramSecret.status, 401, 'Telegram must reject production webhooks when the authentication secret is absent');
  if (priorNodeEnv === undefined) delete process.env.NODE_ENV; else process.env.NODE_ENV = priorNodeEnv;
  console.log('Webhook boundary regression passed: exact WhatsApp challenge verification succeeds, complete channel readiness is enforced, and invalid or missing WhatsApp/Telegram authentication fails closed.');
} finally {
  server.close();
  fs.rmSync(tempDir, { recursive: true, force: true });
}

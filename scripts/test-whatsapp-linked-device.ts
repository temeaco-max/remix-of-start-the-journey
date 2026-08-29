/* Copyright (c) 2026 temeaco-max. All rights reserved. Proprietary and confidential. */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import type { AddressInfo } from 'node:net';
import jwt from 'jsonwebtoken';

const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'kurukoo-linked-device-'));
process.env.DB_PATH = path.join(tempDir, 'linked.sqlite');
process.env.JWT_SECRET = 'linked-device-test-secret-0123456789';
process.env.KURUKOO_DISABLE_LISTEN = 'true';
process.env.KURUKOO_WHATSAPP_LINKED_DEVICE_ENABLED = 'false';
process.env.KURUKOO_WHATSAPP_LINKED_DEVICE_ALLOW = 'false';
process.env.KURUKOO_WHATSAPP_LINKED_DEVICE_OWNER_PHONE = '';

const { app } = await import('../src/index.js');
const { isQrPairingExpiry } = await import('../src/services/whatsappLinkedDeviceService.js');
const owner = '+2348095550301';
const stranger = '+2348095550302';
const tokenFor = (phone: string) => jwt.sign({ phone, role: 'user' }, process.env.JWT_SECRET!, { algorithm: 'HS256' });
const server = app.listen(0, '127.0.0.1');
await new Promise<void>((resolve, reject) => { server.once('listening', resolve); server.once('error', reject); });
const { port } = server.address() as AddressInfo;
const baseUrl = `http://127.0.0.1:${port}`;

try {
  const disabled = await fetch(`${baseUrl}/api/whatsapp-linked-device/status`, { headers: { authorization: `Bearer ${tokenFor(owner)}` } });
  assert.equal(disabled.status, 503, 'Linked-device status must fail closed while disabled');

  process.env.KURUKOO_WHATSAPP_LINKED_DEVICE_ENABLED = 'true';
  process.env.KURUKOO_WHATSAPP_LINKED_DEVICE_ALLOW = 'true';
  process.env.KURUKOO_WHATSAPP_LINKED_DEVICE_OWNER_PHONE = owner;

  const strangerStatus = await fetch(`${baseUrl}/api/whatsapp-linked-device/status`, { headers: { authorization: `Bearer ${tokenFor(stranger)}` } });
  assert.equal(strangerStatus.status, 403, 'A non-owner must not inspect or pair the linked device');

  const pairingPage = await fetch(`${baseUrl}/whatsapp-linked-device`, { headers: { authorization: `Bearer ${tokenFor(owner)}` } });
  assert.equal(pairingPage.status, 200, 'Authenticated owner should receive the browser pairing page');
  const pairingHtml = await pairingPage.text();
  assert.match(pairingHtml, /Start pairing/);
  assert.match(pairingHtml, /WhatsApp linked-device pairing QR code/);

  const ownerStatus = await fetch(`${baseUrl}/api/whatsapp-linked-device/status`, { headers: { authorization: `Bearer ${tokenFor(owner)}` } });
  assert.equal(ownerStatus.status, 200, 'Configured owner should inspect linked-device status');
  const status = await ownerStatus.json() as { enabled?: boolean; ownerConfigured?: boolean; connected?: boolean; qrDataUrl?: string };
  assert.equal(status.enabled, true);
  assert.equal(status.ownerConfigured, true);
  assert.equal(status.connected, false);
  assert.equal('qrDataUrl' in status, false, 'No pairing QR should be exposed before an explicit start');

  const qrBeforeStart = await fetch(`${baseUrl}/api/whatsapp-linked-device/pairing-qr`, { headers: { authorization: `Bearer ${tokenFor(owner)}` } });
  assert.equal(qrBeforeStart.status, 404, 'Pairing QR must not exist before explicit connector startup');

  assert.equal(isQrPairingExpiry(408, { message: 'QR refs attempts ended' }, false), true, 'Baileys QR expiry must be classified as pairing expiry');
  assert.equal(isQrPairingExpiry(408, { message: 'connection lost' }, true), false, 'A registered session must retain reconnect behavior');
  assert.equal(isQrPairingExpiry(500, { message: 'fatal auth failure' }, false), false, 'Non-QR failures must not be classified as pairing expiry');

  console.log(JSON.stringify({ ok: true, pairingPageStatus: pairingPage.status, disabledStatus: disabled.status, strangerStatus: strangerStatus.status, ownerStatus: ownerStatus.status, connected: false, qrExposedBeforeStart: false, qrExpiryGuard: true }));
} finally {
  await new Promise<void>(resolve => server.close(() => resolve()));
  fs.rmSync(tempDir, { recursive: true, force: true });
}

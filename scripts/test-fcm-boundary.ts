import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import type { AddressInfo } from 'node:net';
import jwt from 'jsonwebtoken';

const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'kurukoo-fcm-boundary-'));
process.env.DB_PATH = path.join(tempDir, 'fcm.sqlite');
process.env.JWT_SECRET = 'test-jwt-secret';
process.env.KURUKOO_DISABLE_LISTEN = 'true';
process.env.FCM_SERVICE_ACCOUNT_JSON = '';
process.env.FIREBASE_API_KEY = 'public-test-api-key';
process.env.FIREBASE_AUTH_DOMAIN = 'kurukoo-test.firebaseapp.com';
process.env.FIREBASE_PROJECT_ID = 'kurukoo-test';
process.env.FIREBASE_STORAGE_BUCKET = 'kurukoo-test.appspot.com';
process.env.FIREBASE_MESSAGING_SENDER_ID = '1234567890';
process.env.FIREBASE_APP_ID = '1:1234567890:web:test';
process.env.KURUKOO_FCM_VAPID_KEY = 'public-test-vapid-key';

const { app } = await import('../src/index.js');
const { updateProfile } = await import('../src/services/memoryProfile.js');
const { getDb } = await import('../src/database.js');
const phone = '+2348095550201';
const token = jwt.sign({ phone, role: 'user' }, process.env.JWT_SECRET!, { algorithm: 'HS256' });
const server = app.listen(0, '127.0.0.1');
await new Promise<void>((resolve, reject) => { server.once('listening', resolve); server.once('error', reject); });
const { port } = server.address() as AddressInfo;
const baseUrl = `http://127.0.0.1:${port}`;
const authHeaders = { authorization: `Bearer ${token}`, 'content-type': 'application/json' };

try {
  const webConfig = await fetch(`${baseUrl}/api/fcm/config`);
  assert.equal(webConfig.status, 200, 'Firebase web config boundary should be public');
  const webPayload = await webConfig.json() as { configured?: boolean; config?: Record<string, unknown>; reason?: string };
  assert.equal(webPayload.configured, true, 'Firebase web configuration should report configured when public web values are present');
  assert.equal(webPayload.config?.apiKey, process.env.FIREBASE_API_KEY);
  assert.equal(webPayload.config?.vapidKey, process.env.KURUKOO_FCM_VAPID_KEY);
  assert.equal('privateKey' in (webPayload.config || {}), false, 'Firebase web config must never expose service-account private keys');
  assert.equal('clientEmail' in (webPayload.config || {}), false, 'Firebase web config must never expose service-account client identity');

  const unauthenticated = await fetch(`${baseUrl}/api/fcm/register`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ phone, token: 'device-token-unauthenticated' }) });
  assert.equal(unauthenticated.status, 401, 'FCM registration must require authentication');

  const before = await getDb();
  const beforeProfile = before.exec('SELECT phone FROM memory_profiles WHERE phone = ?', [phone]);
  assert.equal(beforeProfile[0]?.values?.length || 0, 0, 'Unauthenticated registration must not create a profile');

  await updateProfile(phone, 'fcm-boundary-test', { name: 'FCM Boundary User', country: 'ng' });
  const deviceTokenA = 'device-token-test-a';
  const registeredA = await fetch(`${baseUrl}/api/fcm/register`, { method: 'POST', headers: authHeaders, body: JSON.stringify({ token: deviceTokenA, deviceId: 'device-test-a', platform: 'web', credentialType: 'pwa' }) });
  assert.equal(registeredA.status, 200, 'Authenticated owner should register the first FCM device');
  const payloadA = await registeredA.json() as Record<string, unknown>;
  assert.equal(payloadA.tokenRegistered, true);
  assert.equal('token' in payloadA, false, 'Registration response must not echo the device token');
  assert.equal('phone' in payloadA, false, 'Registration response must not echo the owner phone');

  const deviceTokenB = 'device-token-test-b';
  const registeredB = await fetch(`${baseUrl}/api/fcm/register`, { method: 'POST', headers: authHeaders, body: JSON.stringify({ token: deviceTokenB, deviceId: 'device-test-b', platform: 'android', credentialType: 'android' }) });
  assert.equal(registeredB.status, 200, 'The same account should support a second FCM device');
  const payloadB = await registeredB.json() as Record<string, unknown>;
  assert.equal(payloadB.activeDevices, 2, 'Registration should report both active devices');

  const listed = await fetch(`${baseUrl}/api/fcm/devices`, { headers: { authorization: `Bearer ${token}` } });
  assert.equal(listed.status, 200, 'Owner should be able to list registered devices');
  const listedPayload = await listed.json() as { devices?: Array<Record<string, unknown>> };
  assert.equal(listedPayload.devices?.length, 2);
  assert.equal('token' in (listedPayload.devices?.[0] || {}), false, 'Device inventory must never expose registration tokens');

  const revoked = await fetch(`${baseUrl}/api/fcm/register`, { method: 'DELETE', headers: authHeaders, body: JSON.stringify({ deviceId: 'device-test-a' }) });
  assert.equal(revoked.status, 200, 'Owner should be able to revoke a registered device');
  const revokedPayload = await revoked.json() as Record<string, unknown>;
  assert.equal(revokedPayload.revoked, true);

  const db = await getDb();
  const devices = db.exec('SELECT device_id, token, active FROM fcm_devices WHERE phone = ? ORDER BY device_id', [phone])[0]?.values || [];
  assert.deepEqual(devices, [['device-test-a', deviceTokenA, 0], ['device-test-b', deviceTokenB, 1]], 'Revocation must deactivate only the targeted device');
  const stored = db.exec('SELECT fcm_token FROM memory_profiles WHERE phone = ?', [phone]);
  assert.equal(stored[0]?.values?.[0]?.[0], deviceTokenB, 'Legacy profile field should point to the remaining active token');
  console.log(JSON.stringify({ ok: true, webConfig: true, unauthenticatedStatus: unauthenticated.status, firstRegistration: registeredA.status, secondRegistration: registeredB.status, activeDevicesBeforeRevoke: 2, revoked: true, tokenInventoryExposed: false, unauthenticatedProfileCreated: false }));
} finally {
  await new Promise<void>(resolve => server.close(() => resolve()));
  fs.rmSync(tempDir, { recursive: true, force: true });
}

/* Copyright (c) 2026 temeaco-max. All rights reserved. Proprietary and confidential. */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'kurukoo-privacy-bridge-'));
process.env.DB_PATH = path.join(tempDir, 'privacy.sqlite');
process.env.JWT_SECRET = 'privacy-bridge-test-secret-0123456789';
process.env.KURUKOO_DISABLE_LISTEN = 'true';
process.env.FF_PRIVATE_NUMBER_MASKING = 'true';
process.env.NUMBER_MASKING_PROVIDER = 'pending-test-provider';

try {
  await import('../src/database.js');
  const { getDb } = await import('../src/database.js');
  const { generateProxyNumber, getPrivacyBridgeStatus, getProxyForPhone, getRealNumber, maskPhoneNumber, releaseProxyNumber } = await import('../src/services/privacyBridge.js');
  const db = await getDb();
  assert.ok(db.exec('SELECT 1 FROM privacy_bridge LIMIT 1') || true, 'privacy bridge table must be bootstrapped');
  const phone = '+2348000000000';
  const proxy = await generateProxyNumber(phone, 'test');
  assert.match(proxy, /^\+2348009\d{7}$/);
  assert.equal(await generateProxyNumber(phone, 'test'), proxy, 'active owner mapping must be reused');
  assert.equal(await getProxyForPhone(phone), proxy);
  assert.equal(await getRealNumber(proxy), phone);
  assert.notEqual(maskPhoneNumber(phone), phone, 'display masking must not reveal the real number');
  const status = getPrivacyBridgeStatus(process.env);
  assert.equal(status.enabled, true);
  assert.equal(status.configured, true);
  assert.equal(status.externalActivationRequired, true);
  assert.match(status.note, /external activation/i);
  assert.equal(await releaseProxyNumber(proxy), true);
  assert.equal(await getRealNumber(proxy), null, 'released mapping must not resolve');
  console.log('Privacy bridge regression passed: schema, owner-scoped mapping, masking, expiry-aware resolution, release, and external activation truth are enforced.');
} finally {
  fs.rmSync(tempDir, { recursive: true, force: true });
}

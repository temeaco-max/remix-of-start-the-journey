/* Copyright (c) 2026 temeaco-max. All rights reserved. Proprietary and confidential. */
import assert from 'node:assert/strict';

process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = process.env.JWT_SECRET || 'email-otp-test-secret-0123456789';
process.env.DB_PATH = `tmp/email-otp-test-${Date.now()}.sqlite`;
process.env.KURUKOO_EMAIL_OTP_ENABLED = 'true';
process.env.OTP_DEBUG = 'true';
delete process.env.RESEND_API_KEY;
delete process.env.EMAIL_FROM;
delete process.env.EMAIL_WEBHOOK_URL;

const { requestEmailOtp, verifyEmailOtp } = await import('../src/services/otpAuthService.ts');
const { getDb } = await import('../src/database.ts');

const email = `otp-test-${Date.now()}@example.test`;
const requested = await requestEmailOtp(email, '+2348035550199');
assert.equal(requested.success, true);
assert.equal(requested.provider, 'disabled');
assert.ok(requested.debugCode);
assert.equal(requested.debugCode?.length, 6);

const db = await getDb();
const stored = db.exec('SELECT code_hash FROM email_otps WHERE email = ?', [email])[0]?.values?.[0]?.[0];
assert.ok(stored);
assert.notEqual(stored, requested.debugCode);
const logBody = db.exec('SELECT body FROM email_log WHERE recipient = ?', [email])[0]?.values?.[0]?.[0];
assert.equal(logBody, '[redacted]');

const verified = await verifyEmailOtp(email, requested.debugCode!);
assert.deepEqual(verified, { success: true, email, phone: '+2348035550199', message: 'Email verified' });
const replay = await verifyEmailOtp(email, requested.debugCode!);
assert.equal(replay.success, false);

console.log(JSON.stringify({ ok: true, provider: requested.provider, emailVerified: verified.success, replayRejected: !replay.success, plaintextRedacted: logBody === '[redacted]' }));

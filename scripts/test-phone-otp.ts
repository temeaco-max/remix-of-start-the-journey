import assert from 'node:assert/strict';
import { requestPhoneOtp, verifyPhoneOtp } from '../src/services/otpAuthService.js';

const previousNodeEnv = process.env.NODE_ENV;
const previousDebug = process.env.OTP_DEBUG;
const previousApiKey = process.env.AFRICASTALKING_API_KEY;
const previousUsername = process.env.AFRICASTALKING_USERNAME;
process.env.NODE_ENV = 'test';
process.env.OTP_DEBUG = 'true';
delete process.env.AFRICASTALKING_API_KEY;
delete process.env.AFRICASTALKING_USERNAME;

const phone = `+234808${String(Date.now()).slice(-7)}`;
const issued = await requestPhoneOtp(phone);
assert.equal(issued.success, true);
assert.equal(issued.provider, undefined);
assert.match(String(issued.message), /no external SMS was sent/i);
assert.match(String(issued.debugCode), /^\d{6}$/);

const verified = await verifyPhoneOtp(phone, String(issued.debugCode));
assert.equal(verified.success, true);
assert.equal(verified.phone, phone);
const replay = await verifyPhoneOtp(phone, String(issued.debugCode));
assert.equal(replay.success, false);

if (previousNodeEnv === undefined) delete process.env.NODE_ENV; else process.env.NODE_ENV = previousNodeEnv;
if (previousDebug === undefined) delete process.env.OTP_DEBUG; else process.env.OTP_DEBUG = previousDebug;
if (previousApiKey === undefined) delete process.env.AFRICASTALKING_API_KEY; else process.env.AFRICASTALKING_API_KEY = previousApiKey;
if (previousUsername === undefined) delete process.env.AFRICASTALKING_USERNAME; else process.env.AFRICASTALKING_USERNAME = previousUsername;
console.log('Phone OTP regression passed: canonical SMS seam, truthful unavailable delivery, debug-only development code, verification and replay rejection.');

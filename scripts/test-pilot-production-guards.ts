/* Copyright (c) 2026 temeaco-max. All rights reserved. Proprietary and confidential. */
import assert from 'node:assert/strict';

process.env.NODE_ENV = 'production';
process.env.KURUKOO_DEV_AUTH = 'true';
process.env.KURUKOO_TEST_PHONE = '+2348012345678';

const auth = await import('../src/services/devTestAuthService.js');
assert.equal(auth.isDevelopmentTestAuthEnabled(), false, 'development auth must be disabled in production');
assert.equal(auth.isDevelopmentTestIdentity('+2348012345678'), false, 'production must not recognize the configured development identity');
assert.equal(auth.verifyDevelopmentTestOtp('+2348012345678', '111111'), null, 'production must reject the deterministic development OTP');
assert.equal(auth.getDevelopmentTestAuthStatus().active, false, 'production readiness must report development auth inactive');

const adminSource = await import('node:fs').then(fs => fs.promises.readFile(new URL('../src/routes/adminRoutes.ts', import.meta.url), 'utf8'));
assert.match(adminSource, /authenticateAdmin/, 'test-only admin operations must remain behind admin authentication');
assert.match(adminSource, /test-chat\/reset/, 'test reset route must remain explicit and auditable');

console.log('Pilot production guard regression passed: development auth, 111111 OTP, and test-only admin boundaries are disabled or protected in production.');

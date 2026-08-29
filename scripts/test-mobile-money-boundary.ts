/* Copyright (c) 2026 temeaco-max. All rights reserved. Proprietary and confidential. */
import assert from 'node:assert/strict';

process.env.NODE_ENV = 'test';
process.env.KURUKOO_PAY_PROVIDER = 'sandbox';
const { initiateMobileMoneyTopup, verifyIdentity } = await import('../src/services/mobileMoney.js');

const sandbox = await initiateMobileMoneyTopup('sandbox', '+2347000000001', 1000);
assert.equal(sandbox.success, false, 'sandbox must never report a successful payment');
assert.equal(sandbox.checkoutUrl, '', 'sandbox must never provide an externally valid checkout URL');
assert.match(sandbox.gatewayResponse, /not a real payment rail/i);

process.env.KURUKOO_PAY_PROVIDER = 'unsupported-provider';
const secretLikeProvider = 'provider-secret-like-value';
const unsupported = await initiateMobileMoneyTopup(secretLikeProvider, '+2347000000001', 1000);
assert.equal(unsupported.success, false, 'unverified providers must fail closed');
assert.equal(unsupported.checkoutUrl, '');
assert.match(unsupported.gatewayResponse, /no verified production adapter/i);
assert.doesNotMatch(unsupported.gatewayResponse, /provider-secret-like-value/i, 'provider input must not be echoed into a client-facing payment error');

const invalidNin = await verifyIdentity('+2347000000001', '123', 'NIN');
assert.equal(invalidNin.verified, false);
assert.match(invalidNin.message, /format is invalid/i);

const unconfiguredNin = await verifyIdentity('+2347000000001', '12345678901', 'NIN');
assert.equal(unconfiguredNin.verified, false, 'valid formatting is not identity verification');
assert.equal(unconfiguredNin.fullName, '');
assert.match(unconfiguredNin.message, /not been performed/i);

console.log('Mobile-money boundary contract passed: sandbox, unsupported payment providers, invalid identity formats, and unconfigured KYC all fail closed.');

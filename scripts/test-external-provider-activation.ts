import assert from 'node:assert/strict';
import { activateConfiguredExternalProviders } from '../src/services/externalActivationService.js';

const result = await activateConfiguredExternalProviders();
assert.ok(result && Array.isArray(result.results), 'activation result must contain provider results');

const expected = new Set(['telegram', 'whatsapp', 'stripe', 'email', 'fcm', 'mistral']);
const providers = new Set(result.results.map((item) => item.provider));
for (const provider of expected) assert.ok(providers.has(provider), `missing activation result: ${provider}`);

for (const item of result.results) {
  assert.equal(typeof item.configured, 'boolean', `${item.provider}: configured must be boolean`);
  assert.equal(typeof item.activated, 'boolean', `${item.provider}: activated must be boolean`);
  assert.equal(typeof item.verified, 'boolean', `${item.provider}: verified must be boolean`);
  assert.equal(typeof item.detail, 'string', `${item.provider}: detail must be string`);
  assert.ok(item.detail.length <= 500, `${item.provider}: detail must remain bounded`);
  if (item.activated) assert.equal(item.verified, true, `${item.provider}: activated implies verified`);
}

const liveConfigured = process.env.MISTRAL_API_KEY || process.env.STRIPE_SECRET_KEY || process.env.TELEGRAM_BOT_TOKEN || process.env.WHATSAPP_ACCESS_TOKEN || process.env.WHATSAPP_TOKEN || process.env.RESEND_API_KEY || process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
if (!liveConfigured) {
  console.log(JSON.stringify({ status: 'contract-only', message: 'No live provider credentials supplied; shape and truth-boundary checks passed.', results: result.results }, null, 2));
} else {
  console.log(JSON.stringify({ status: 'live-probe', generatedAt: result.generatedAt, results: result.results }, null, 2));
  const hardFailures = result.results.filter((item) => item.configured && !item.verified && !['whatsapp', 'telegram'].includes(item.provider));
  assert.equal(hardFailures.length, 0, `configured provider verification failures: ${hardFailures.map((item) => `${item.provider}: ${item.detail}`).join('; ')}`);
}

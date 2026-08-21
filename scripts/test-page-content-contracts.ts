import assert from 'node:assert/strict';
import { PAGE_CONTENT_CONTRACTS } from '../src/services/pageContentContracts.js';

const required = ['desk','discover','topics','requests','reminders','saved','cart','tasks','connect','agents','capabilities','opportunities','wallet','points','top-up','subscriptions','checkout','confirmations','memory','artifacts','prayer','call','notifications','safety','settings'];
for (const key of required) {
  const contract = PAGE_CONTENT_CONTRACTS[key];
  assert.ok(contract, `Missing page content contract: ${key}`);
  assert.ok(contract.purpose.trim(), `${key}: purpose missing`);
  assert.ok(contract.jobs.length > 0, `${key}: real-world jobs missing`);
  assert.ok(contract.sections.length >= 3, `${key}: insufficient information architecture`);
  assert.ok(contract.actions.length > 0, `${key}: actions missing`);
  assert.ok(contract.states.includes('loading') && contract.states.includes('failure'), `${key}: loading/failure states missing`);
  assert.ok(contract.dataAuthority.trim(), `${key}: canonical data authority missing`);
}

assert.equal(PAGE_CONTENT_CONTRACTS.settings.audience, 'authenticated');
assert.equal(PAGE_CONTENT_CONTRACTS.requests.seo, 'noindex');
assert.match(PAGE_CONTENT_CONTRACTS.checkout.truthBoundary || '', /payment/i);
assert.match(PAGE_CONTENT_CONTRACTS.safety.truthBoundary || '', /emergency/i);

console.log(`Page content contracts passed for ${required.length} authenticated/shared surfaces.`);

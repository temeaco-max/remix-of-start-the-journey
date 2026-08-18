import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'kurukoo-trusted-contact-consent-'));
process.env.DB_PATH = path.join(tempDir, 'flow.sqlite');
process.env.JWT_SECRET = 'trusted-contact-consent-test-secret-0123456789';
process.env.KURUKOO_DISABLE_LISTEN = 'true';
process.env.NODE_ENV = 'test';
process.env.KURUKOO_CONTACT_CONSENT_EXPOSE_DEV_LINK = 'true';
for (const key of ['AFRICASTALKING_API_KEY', 'AFRICASTALKING_USERNAME', 'RESEND_API_KEY', 'EMAIL_FROM', 'EMAIL_WEBHOOK_URL']) delete process.env[key];

try {
  const { addSafetyContact, listSafetyContacts } = await import('../src/services/safetyService.js');
  const { createTrustedContactConsentRequest, getTrustedContactReadiness, listTrustedContactConsentRequests, respondToTrustedContactConsent } = await import('../src/services/trustedContactService.js');

  const owner = '+2348095550201';
  const contact = await addSafetyContact(owner, { name: 'Consent Sentinel', phone: '+2348095550202', relationship: 'trusted contact' });
  const readiness = getTrustedContactReadiness();
  assert.equal(readiness.providerAvailable, false);
  assert.equal(readiness.externalActivationRequired, true);

  const request = await createTrustedContactConsentRequest(owner, contact.id, 'sms');
  assert.equal(request.status, 'pending');
  assert.equal(request.delivery_state, 'not_configured');
  assert.ok(request.consent_url, 'Development-only consent link must be available to test the token boundary');

  const stored = await listTrustedContactConsentRequests(owner, contact.id);
  assert.equal(stored.length, 1);
  assert.equal(stored[0]?.consent_url, undefined, 'Stored listings must never expose the raw consent token');

  const token = new URL(request.consent_url!).searchParams.get('token');
  assert.ok(token);
  const accepted = await respondToTrustedContactConsent(token!, 'accept');
  assert.deepEqual(accepted, { status: 'accepted', contactId: contact.id });
  assert.equal(await respondToTrustedContactConsent(token!, 'accept'), null, 'Consent tokens must be single-use');

  const contacts = await listSafetyContacts(owner);
  assert.equal(contacts.find((entry) => entry.id === contact.id)?.status, 'active');
  console.log('Trusted-contact consent regression passed: provider-unavailable state, raw-token boundary, acceptance, activation and replay rejection are enforced.');
} finally {
  fs.rmSync(tempDir, { recursive: true, force: true });
}

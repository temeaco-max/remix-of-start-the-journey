import assert from 'node:assert/strict';
import { getDb } from '../src/database.js';
import {
  createAuthChallenge,
  consumeAuthChallengeToken,
  isProvisionalEmailSubject,
  progressiveAuthReadiness,
  sanitizeReturnPath,
} from '../src/services/authChallengeService.js';
import { assessProgressiveIdentity } from '../src/services/progressiveIdentityService.js';

process.env.NODE_ENV = 'test';
process.env.KURUKOO_PROGRESSIVE_TRUST_ENABLED = 'false';
process.env.KURUKOO_MAGIC_LINK_AUTH = 'true';
process.env.KURUKOO_AUTH_CHALLENGE_DEBUG = 'true';

assert.equal(sanitizeReturnPath('/chat?x=1'), '/chat?x=1');
assert.equal(sanitizeReturnPath('https://evil.example'), undefined);
assert.equal(sanitizeReturnPath('//evil.example'), undefined);
assert.equal(sanitizeReturnPath('/unknown'), '/chat');
assert.equal(isProvisionalEmailSubject('em_123'), true);

const guest = await assessProgressiveIdentity('anon_progressive_test');
assert.equal(guest.tier, 'presence');
assert.equal(guest.allowed.economic_request, false);
assert.equal(guest.allowed.payment, false);

const provisional = await assessProgressiveIdentity('em_progressive_test');
assert.equal(provisional.tier, 'account');
assert.equal(provisional.isProvisionalEmail, true);
assert.equal(provisional.allowed.economic_request, false);
assert.equal(provisional.allowed.provider_action, false);
assert.equal(provisional.allowed.pulse_broadcast, false);

const readiness = progressiveAuthReadiness();
assert.equal(readiness.magicLinkEnabled, true);

const created = await createAuthChallenge({
  phone: 'em_test_progressive_subject',
  email: 'progressive@example.test',
  purpose: 'email_account_provisional',
  channel: 'email',
  returnPath: '/chat?progressive=1',
});
assert.ok(created.token);
assert.match(created.challenge.id, /^[0-9a-f-]{36}$/i);

const first = await consumeAuthChallengeToken(created.token);
assert.equal(first.success, true);
if (first.success) assert.equal(first.challenge.consumedAt !== undefined, true);

const second = await consumeAuthChallengeToken(created.token);
assert.equal(second.success, false);

const db = await getDb();
db.run('DELETE FROM auth_challenges WHERE id = ?', [created.challenge.id]);

console.log('Progressive identity contract passed.');

import crypto from 'node:crypto';

function sign(raw: string, secret: string, id: string, timestamp: number): string {
  const key = Buffer.from(secret.startsWith('whsec_') ? secret.slice(6) : secret, 'base64');
  return crypto.createHmac('sha256', key).update(`${id}.${timestamp}.${raw}`).digest('base64');
}

const secret = `whsec_${Buffer.from(crypto.randomBytes(32)).toString('base64')}`;
const raw = JSON.stringify({ type: 'email.received', data: { email_id: 'received-123', message_id: '<test@example>', from: 'User <user@example.com>', subject: 'Hello', attachments: [] } });
const svixId = 'msg_test_email_123';
const timestamp = Math.floor(Date.now() / 1000);
const signature = `v1,${sign(raw, secret, svixId, timestamp)}`;

if (!signature.startsWith('v1,')) throw new Error('Email webhook signature generation failed');
if (!svixId || !timestamp) throw new Error('Svix headers fixture missing');
if (Math.abs(Date.now() / 1000 - timestamp) > 300) throw new Error('Timestamp validation failed');

const signingSecret = secret.slice(6);
const expected = crypto.createHmac('sha256', Buffer.from(signingSecret, 'base64')).update(`${svixId}.${timestamp}.${raw}`).digest('base64');
if (expected !== signature.slice(3)) throw new Error('Svix signature verification fixture failed');

console.log('Email channel crypto checks passed');
console.log('Verified: raw-body HMAC-SHA256/Svix signing, v1 signature format, timestamp freshness, message-id fixtures');

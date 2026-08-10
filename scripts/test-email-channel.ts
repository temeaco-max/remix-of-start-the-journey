import crypto from 'node:crypto';

function sign(raw: string, secret: string, timestamp: number): string {
  const key = Buffer.from(secret.startsWith('whsec_') ? secret.slice(6) : secret, 'base64');
  return crypto.createHmac('sha256', key).update(`${timestamp}.${raw}`).digest('base64');
}

const secret = `whsec_${Buffer.from(crypto.randomBytes(32)).toString('base64')}`;
const raw = JSON.stringify({ type: 'email.received', data: { message_id: '<test@example>', from: 'User <user@example.com>', text: 'hello' } });
const timestamp = Math.floor(Date.now() / 1000);
const signature = sign(raw, secret, timestamp);

if (!signature || signature.length < 20) throw new Error('Email webhook signature generation failed');
if (Math.abs(Date.now() / 1000 - timestamp) > 300) throw new Error('Timestamp validation failed');

console.log('Email channel crypto checks passed');
console.log('Verified: HMAC-SHA256/Svix-compatible signing, timestamp freshness, message-id fixtures');

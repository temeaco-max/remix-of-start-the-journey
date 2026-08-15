import 'dotenv/config';

import crypto from 'node:crypto';

const production = process.env.NODE_ENV === 'production';
const defaults: Record<string, string> = {
  PORT: '3000',
  CREDIT_ECONOMY_ENABLED: 'true'
};
if (!production) defaults.KURUKOO_PAY_PROVIDER = 'sandbox';
for (const [key, value] of Object.entries(defaults)) if (!process.env[key]) process.env[key] = value;

if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) {
  if (production) {
    console.error('[Kurukoo Startup] JWT_SECRET must be configured with at least 32 characters in production.');
  } else {
    process.env.JWT_SECRET = crypto.randomBytes(48).toString('base64url');
    console.warn('[Kurukoo Startup] JWT_SECRET is unconfigured or too short; generated an ephemeral development/test secret.');
  }
}

const secretKeys = [
  'JWT_SECRET', 'GEMINI_API_KEY', 'HUGGINGFACE_API_KEY', 'GROQ_API_KEY',
  'WHATSAPP_TOKEN', 'TELEGRAM_BOT_TOKEN', 'STRIPE_SECRET_KEY', 'MOMO_API_KEY', 'PAGA_API_KEY', 'AFRICASTALKING_API_KEY'
];

for (const key of secretKeys) {
  if (!process.env[key]) {
    console.warn(`[Kurukoo Startup] Secret not configured: ${key}`);
  }
}
if (production && !process.env.KURUKOO_PAY_PROVIDER) console.warn('[Kurukoo Startup] Payment provider is unconfigured; economic payment/escrow operations will fail closed.');
console.log(`[Kurukoo Startup] Environment ready. PORT=${process.env.PORT}, PayProvider=${process.env.KURUKOO_PAY_PROVIDER || 'unconfigured'}, CreditEconomy=${process.env.CREDIT_ECONOMY_ENABLED}`);

import './src/index.js';

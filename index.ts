import 'dotenv/config';

const defaults: Record<string, string> = {
  PORT: '3000',
  KURUKOO_PAY_PROVIDER: 'sandbox',
  CREDIT_ECONOMY_ENABLED: 'true'
};

for (const [key, value] of Object.entries(defaults)) {
  if (!process.env[key]) process.env[key] = value;
}

const secretKeys = [
  'JWT_SECRET',
  'GITHUB_TOKEN',
  'GEMINI_API_KEY',
  'HUGGINGFACE_API_KEY',
  'GROQ_API_KEY',
  'WHATSAPP_TOKEN',
  'TELEGRAM_BOT_TOKEN',
  'STRIPE_SECRET_KEY',
  'MOMO_API_KEY',
  'PAGA_API_KEY',
  'AFRICASTALKING_API_KEY'
];

// Never print secret values. Production should fail closed for security-critical secrets.
const production = process.env.NODE_ENV === 'production';
for (const key of secretKeys) {
  if (!process.env[key]) {
    if (production && ['JWT_SECRET', 'GITHUB_TOKEN'].includes(key)) {
      throw new Error(`[Kurukoo Startup] Missing required production secret: ${key}`);
    }
    console.warn(`[Kurukoo Startup] Secret not configured: ${key}`);
  }
}

if (process.env.JWT_SECRET && process.env.JWT_SECRET.length < 32) {
  throw new Error('[Kurukoo Startup] JWT_SECRET must contain at least 32 characters');
}

console.log(`[Kurukoo Startup] Environment ready. PORT=${process.env.PORT}, PayProvider=${process.env.KURUKOO_PAY_PROVIDER}, CreditEconomy=${process.env.CREDIT_ECONOMY_ENABLED}`);

import './src/index.js';

// Background workers (orchestration, memory lifecycle, deferred, purge)
import { startBackgroundWorkers } from './src/services/backgroundWorkers.js';
startBackgroundWorkers();

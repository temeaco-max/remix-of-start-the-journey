import 'dotenv/config';

// Define all environment variables from .env.example
const requiredOrDefaultEnv: Record<string, string> = {
  PORT: '3000',
  KURUKOO_PAY_PROVIDER: 'sandbox',
  CREDIT_ECONOMY_ENABLED: 'true'
};

const optionalEnvKeys = [
  'GROQ_API_KEY',
  'WHATSAPP_VERIFY_TOKEN',
  'WHATSAPP_TOKEN',
  'AFRICASTALKING_API_KEY',
  'AFRICASTALKING_USERNAME',
  'MOMO_API_KEY',
  'PAGA_API_KEY',
  'STRIPE_SECRET_KEY',
  'AT_API_KEY',
  'VERIFYME_SECRET'
];

console.log('[Kurukoo Startup] Validating environment configuration against .env.example...');

// Apply defaults for critical/config variables
for (const [key, defaultVal] of Object.entries(requiredOrDefaultEnv)) {
  if (!process.env[key]) {
    process.env[key] = defaultVal;
    console.warn(`[Kurukoo Startup] Warning: ${key} not provided. Assigned default: '${defaultVal}'.`);
  } else {
    console.log(`[Kurukoo Startup] OK: ${key} is set.`);
  }
}

// Check optional keys and log status
for (const key of optionalEnvKeys) {
  if (!process.env[key]) {
    console.log(`[Kurukoo Startup] Info: Optional integration key ${key} is not set (running in stub/fallback mode).`);
  } else {
    console.log(`[Kurukoo Startup] OK: Optional key ${key} is configured.`);
  }
}

console.log(`[Kurukoo Startup] Environment validation complete. PORT=${process.env.PORT}, PayProvider=${process.env.KURUKOO_PAY_PROVIDER}, CreditEconomy=${process.env.CREDIT_ECONOMY_ENABLED}`);

// Import the main application entry point
import './src/index.js';

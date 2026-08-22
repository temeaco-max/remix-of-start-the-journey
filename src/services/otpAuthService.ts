/**
 * OTP authentication for phone-first Kurukoo identity.
 *
 * Phone remains the canonical communications identity. Email OTP is an
 * additional bootstrap/recovery path and does not silently mark a phone as
 * verified.
 */
import crypto from 'crypto';
import { getCanonicalPersistenceMode } from './canonicalPersistence.js';
import { getCanonicalStore } from './canonicalStore.js';
import { sendEmail } from './emailService.js';
import { sendSmsText } from '../channels/sms.js';

const OTP_TTL_MS = 10 * 60 * 1000;
const MAX_ATTEMPTS = 5;

function enabledByDefault(name: string): boolean { return process.env[name] === 'true' || (process.env.NODE_ENV !== 'production' && !process.env[name]); }
export function isEmailOtpEnabled(): boolean { return enabledByDefault('KURUKOO_EMAIL_OTP_ENABLED'); }

export async function ensureOtpSchema(): Promise<void> {
  const store = await getCanonicalStore();
  await store.run(`CREATE TABLE IF NOT EXISTS phone_otps (
    phone TEXT PRIMARY KEY,
    code_hash TEXT NOT NULL,
    attempts INTEGER DEFAULT 0,
    expires_at TEXT NOT NULL,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
  )`);
  await store.run(`CREATE TABLE IF NOT EXISTS email_otps (
    email TEXT PRIMARY KEY,
    phone TEXT,
    code_hash TEXT NOT NULL,
    attempts INTEGER DEFAULT 0,
    expires_at TEXT NOT NULL,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
  )`);
  if (getCanonicalPersistenceMode() === 'sqljs') {
    for (const statement of ['ALTER TABLE memory_profiles ADD COLUMN email_verified_at TEXT', 'ALTER TABLE memory_profiles ADD COLUMN phone_verified_at TEXT']) {
      try { await store.run(statement); } catch { /* migration already applied */ }
    }
  }
}

function normalizePhone(phone: string): string {
  const raw = String(phone || '').trim().replace(/[\s-]/g, '');
  if (!raw) return '';
  if (raw.startsWith('+')) return raw;
  if (raw.startsWith('234') && raw.length >= 12) return `+${raw}`;
  if (raw.startsWith('0') && raw.length === 11) return `+234${raw.slice(1)}`;
  return `+${raw}`;
}
function normalizeEmail(email: string): string { return String(email || '').trim().toLowerCase(); }
function validEmail(email: string): boolean { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email); }
function hashCode(code: string, subject: string): string {
  const configured = String(process.env.JWT_SECRET || '').trim();
  if (!configured && process.env.NODE_ENV === 'production') throw new Error('[Kurukoo Security] JWT_SECRET must be configured before OTP signing.');
  return crypto.createHmac('sha256', configured || 'development-only-otp-secret').update(`${subject}:${code}`).digest('hex');
}
function generateCode(): string { return String(crypto.randomInt(100000, 999999)); }

export async function requestPhoneOtp(phoneInput: string): Promise<{ success: boolean; message: string; debugCode?: string }> {
  await ensureOtpSchema();
  const phone = normalizePhone(phoneInput);
  if (!phone || phone.length < 8) return { success: false, message: 'Valid phone number required' };
  const code = generateCode(); const expiresAt = new Date(Date.now() + OTP_TTL_MS).toISOString();
  const store = await getCanonicalStore();
  await store.run(`INSERT INTO phone_otps (phone, code_hash, attempts, expires_at, created_at) VALUES (?, ?, 0, ?, CURRENT_TIMESTAMP)
    ON CONFLICT(phone) DO UPDATE SET code_hash = excluded.code_hash, attempts = 0, expires_at = excluded.expires_at, created_at = CURRENT_TIMESTAMP`, [phone, hashCode(code, phone), expiresAt]);
  const delivery = await sendSmsText(phone, `Your Kurukoo verification code is ${code}. It expires in 10 minutes. If you did not request this, ignore this message.`);
  const exposeDebug = process.env.NODE_ENV !== 'production' && process.env.OTP_DEBUG === 'true';
  if (!delivery.ok && !exposeDebug) return { success: false, message: 'Phone delivery is not configured or was not accepted. No verification claim was made.' };
  return { success: true, message: delivery.ok ? 'Verification code sent to your phone' : 'Development verification code generated; no external SMS was sent', ...(exposeDebug ? { debugCode: code } : {}) };
}

export async function verifyPhoneOtp(phoneInput: string, code: string): Promise<{ success: boolean; phone?: string; message: string }> {
  await ensureOtpSchema();
  const phone = normalizePhone(phoneInput);
  if (!phone || !code) return { success: false, message: 'Phone and code required' };
  const store = await getCanonicalStore();
  const row = await store.one<any>(`SELECT code_hash, attempts, expires_at FROM phone_otps WHERE phone = ?`, [phone]);
  if (!row) return { success: false, message: 'No active verification request' };
  if (new Date(String(row.expires_at)).getTime() < Date.now()) { await store.run(`DELETE FROM phone_otps WHERE phone = ?`, [phone]); return { success: false, message: 'Code expired — request a new one' }; }
  if (Number(row.attempts || 0) >= MAX_ATTEMPTS) { await store.run(`DELETE FROM phone_otps WHERE phone = ?`, [phone]); return { success: false, message: 'Too many attempts — request a new code' }; }
  if (hashCode(String(code).trim(), phone) !== String(row.code_hash)) { await store.run(`UPDATE phone_otps SET attempts = attempts + 1 WHERE phone = ?`, [phone]); return { success: false, message: 'Invalid verification code' }; }
  await store.run(`DELETE FROM phone_otps WHERE phone = ?`, [phone]);
  return { success: true, phone, message: 'Phone verified' };
}

export async function requestEmailOtp(emailInput: string, phoneInput?: string): Promise<{ success: boolean; message: string; provider?: string; debugCode?: string }> {
  if (!isEmailOtpEnabled()) return { success: false, message: 'Email OTP is not enabled in this deployment' };
  await ensureOtpSchema();
  const email = normalizeEmail(emailInput); if (!validEmail(email)) return { success: false, message: 'Valid email address required' };
  const phone = phoneInput ? normalizePhone(phoneInput) : ''; const code = generateCode(); const expiresAt = new Date(Date.now() + OTP_TTL_MS).toISOString();
  const store = await getCanonicalStore();
  await store.run(`INSERT INTO email_otps (email, phone, code_hash, attempts, expires_at, created_at) VALUES (?, ?, ?, 0, ?, CURRENT_TIMESTAMP)
    ON CONFLICT(email) DO UPDATE SET phone = excluded.phone, code_hash = excluded.code_hash, attempts = 0, expires_at = excluded.expires_at, created_at = CURRENT_TIMESTAMP`, [email, phone || null, hashCode(code, email), expiresAt]);
  const delivery = await sendEmail(email, 'Your Kurukoo verification code', `Your Kurukoo verification code is ${code}. It expires in 10 minutes. If you did not request this, you can ignore this email.`, { idempotencyKey: `kurukoo-email-otp:${email}:${expiresAt}`, tags: { purpose: 'authentication', channel: 'email' }, sensitive: true });
  const exposeDebug = process.env.NODE_ENV !== 'production' && process.env.OTP_DEBUG === 'true';
  if (!delivery.ok && !exposeDebug) return { success: false, message: 'Email delivery is not configured or was not accepted. No verification claim was made.', provider: delivery.provider };
  return { success: true, message: delivery.ok ? 'Verification code sent to your email' : 'Development verification code generated; no external email was sent', provider: delivery.provider, ...(exposeDebug ? { debugCode: code } : {}) };
}

export async function verifyEmailOtp(emailInput: string, code: string): Promise<{ success: boolean; email?: string; phone?: string; message: string }> {
  if (!isEmailOtpEnabled()) return { success: false, message: 'Email OTP is not enabled in this deployment' };
  await ensureOtpSchema();
  const email = normalizeEmail(emailInput); if (!validEmail(email) || !code) return { success: false, message: 'Email and code are required' };
  const store = await getCanonicalStore();
  const row = await store.one<any>(`SELECT phone, code_hash, attempts, expires_at FROM email_otps WHERE email = ?`, [email]);
  if (!row) return { success: false, message: 'No active email verification request' };
  if (new Date(String(row.expires_at)).getTime() < Date.now()) { await store.run(`DELETE FROM email_otps WHERE email = ?`, [email]); return { success: false, message: 'Code expired — request a new one' }; }
  if (Number(row.attempts || 0) >= MAX_ATTEMPTS) { await store.run(`DELETE FROM email_otps WHERE email = ?`, [email]); return { success: false, message: 'Too many attempts — request a new code' }; }
  if (hashCode(String(code).trim(), email) !== String(row.code_hash)) { await store.run(`UPDATE email_otps SET attempts = attempts + 1 WHERE email = ?`, [email]); return { success: false, message: 'Invalid verification code' }; }
  await store.run(`DELETE FROM email_otps WHERE email = ?`, [email]);
  return { success: true, email, phone: row.phone ? String(row.phone) : undefined, message: 'Email verified' };
}
export function normalizeOtpEmail(email: string): string { return normalizeEmail(email); }
export function normalizeOtpPhone(phone: string): string { return normalizePhone(phone); }

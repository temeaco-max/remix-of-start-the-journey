/* Copyright (c) 2026 temeaco-max. All rights reserved. Proprietary and confidential. */
const DEV_TEST_OTP = '111111';

function normalizePhone(phoneInput: string): string {
  const raw = String(phoneInput || '').trim().replace(/[\s-]/g, '');
  if (!raw) return '';
  if (raw.startsWith('+')) return raw;
  if (raw.startsWith('234') && raw.length >= 12) return `+${raw}`;
  if (raw.startsWith('0') && raw.length === 11) return `+234${raw.slice(1)}`;
  return raw.startsWith('+') ? raw : `+${raw}`;
}

export function isDevelopmentTestAuthEnabled(): boolean {
  if (process.env.NODE_ENV === 'production') return false;
  return process.env.KURUKOO_DEV_AUTH === 'true';
}

export function getConfiguredTestPhone(): string {
  return normalizePhone(process.env.KURUKOO_TEST_PHONE || '');
}

export function getConfiguredTestName(): string {
  return String(process.env.KURUKOO_TEST_NAME || 'Kurukoo Development Tester').trim() || 'Kurukoo Development Tester';
}

export function isDevelopmentTestIdentity(phoneInput: string): boolean {
  const phone = normalizePhone(phoneInput);
  const configured = getConfiguredTestPhone();
  return isDevelopmentTestAuthEnabled() && Boolean(configured) && phone === configured;
}

export function getDevelopmentTestAuthStatus(): { active: boolean; configured: boolean; phone?: string; label?: string } {
  const active = isDevelopmentTestAuthEnabled();
  const phone = getConfiguredTestPhone();
  return {
    active,
    configured: active && Boolean(phone),
    ...(active && phone ? { phone, label: 'Development test account' } : {}),
  };
}

export function verifyDevelopmentTestOtp(phoneInput: string, codeInput: string): { success: boolean; phone?: string; testMode?: boolean; message: string } | null {
  if (!isDevelopmentTestIdentity(phoneInput)) return null;
  if (String(codeInput || '').trim() !== DEV_TEST_OTP) return { success: false, testMode: true, message: 'Invalid development test code' };
  return { success: true, phone: getConfiguredTestPhone(), testMode: true, message: 'Development test identity verified' };
}

export function developmentTestOtpLabel(): string {
  return DEV_TEST_OTP;
}

export { normalizePhone as normalizeDevelopmentTestPhone };

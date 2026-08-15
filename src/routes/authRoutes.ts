/** OTP-first authentication with one phone-based Kurukoo identity. */
import { Router } from 'express';
import jwt from 'jsonwebtoken';
import { getDb, saveDb } from '../database.js';
import { migrateGuestSessionToAccount } from '../services/guestSessionMigration.js';
import { applyQrReferralAttribution } from '../services/qrContextService.js';
import { ensureOtpSchema, isEmailOtpEnabled, normalizeOtpEmail, requestEmailOtp, requestPhoneOtp, verifyEmailOtp, verifyPhoneOtp } from '../services/otpAuthService.js';
import { authRateLimit } from '../middleware/rateLimit.js';
import { authenticateUser, AuthRequest } from '../middleware/auth.js';
import { developmentTestOtpLabel, getConfiguredTestName, getDevelopmentTestAuthStatus, isDevelopmentTestIdentity, verifyDevelopmentTestOtp } from '../services/devTestAuthService.js';
import { registerTrustedDevice } from '../services/progressiveTrustService.js';

const router = Router();
const AUTH_COOKIE = 'kurukoo_auth';

export function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret || secret.length < 32) throw new Error('JWT_SECRET must be configured with at least 32 characters');
  return secret;
}

export interface UserTokenClaims {
  operatorPhone?: string;
  operatorSession?: boolean;
  testActor?: boolean;
  actorRole?: string;
  actorContextId?: string;
}

export function issueUserToken(phone: string, claims: UserTokenClaims = {}): string {
  return jwt.sign({ phone, role: 'user', ...claims }, getJwtSecret(), { expiresIn: '30d', algorithm: 'HS256' });
}

function setAuthCookie(res: any, token: string, clearGuest = false): void {
  const options = { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax' as const, maxAge: 30 * 24 * 60 * 60 * 1000, path: '/' };
  res.cookie(AUTH_COOKIE, token, options);
  if (clearGuest) res.clearCookie('kurukoo_guest_id', { httpOnly: true, secure: options.secure, sameSite: 'lax', path: '/' });
}

export async function upsertProfile(phone: string, name?: string, email?: string, goal?: string): Promise<void> {
  const db = await getDb();
  const stmt = db.prepare('SELECT phone FROM memory_profiles WHERE phone = ?');
  stmt.bind([phone]);
  const exists = stmt.step();
  stmt.free();
  if (exists) {
    db.run("UPDATE memory_profiles SET name=COALESCE(NULLIF(?, ''),name), email=COALESCE(NULLIF(?, ''),email) WHERE phone=?", [name || '', email || '', phone]);
  } else {
    db.run(`INSERT INTO memory_profiles (phone,name,location,country,subscription_tier,wallet_balance_minor,preferences,behavior_patterns,email,is_available) VALUES (?,?,'Ibadan','ng','Base',30,?,'{}',?,1)`, [phone, name || 'Kurukoo User', JSON.stringify({ goal: goal || 'buyer' }), email || '']);
  }
  saveDb();
}

router.post('/request-otp', authRateLimit, async (req, res) => {
  try {
    const phone = String(req.body?.phone || '').trim();
    const testStatus = getDevelopmentTestAuthStatus();
    if (testStatus.active && isDevelopmentTestIdentity(phone)) {
      return res.json({ success: true, testMode: true, message: 'Development test authentication is active. Use the displayed test code.', devCode: developmentTestOtpLabel() });
    }
    const result = await requestPhoneOtp(phone);
    if (!result.success) return res.status(400).json(result);
    res.json(result);
  } catch (e) {
    console.error('request-otp error:', e);
    res.status(500).json({ success: false, message: 'Failed to issue verification code' });
  }
});

router.post('/request-email-otp', authRateLimit, async (req, res) => {
  try {
    if (!isEmailOtpEnabled()) return res.status(503).json({ success: false, message: 'Email OTP is not enabled in this deployment' });
    const result = await requestEmailOtp(String(req.body?.email || ''), String(req.body?.phone || ''));
    if (!result.success) return res.status(502).json(result);
    res.json(result);
  } catch (e) {
    console.error('request-email-otp error:', e);
    res.status(500).json({ success: false, message: 'Failed to issue email verification code' });
  }
});

router.post('/verify-email-otp', authRateLimit, async (req, res) => {
  try {
    const email = normalizeOtpEmail(String(req.body?.email || ''));
    const result = await verifyEmailOtp(email, String(req.body?.code || ''));
    if (!result.success || !result.email) return res.status(401).json(result);
    const db = await getDb();
    let userPhone = result.phone || '';
    if (!userPhone) {
      const lookup = db.prepare('SELECT phone FROM memory_profiles WHERE lower(email) = lower(?) LIMIT 1'); lookup.bind([email]);
      if (lookup.step()) userPhone = String(lookup.getAsObject().phone || '');
      lookup.free();
    }
    if (!userPhone) userPhone = String(req.body?.phone || '').trim();
    if (!userPhone) return res.status(400).json({ success: false, message: 'Phone number is required to create a phone-first Kurukoo account.' });
    await upsertProfile(userPhone, req.body?.name, email, req.body?.goal);
    db.run('UPDATE memory_profiles SET email_verified_at = CURRENT_TIMESTAMP WHERE phone = ?', [userPhone]);
    saveDb();
    const guestPhone = String(req.body?.guestPhone || '').trim();
    if (guestPhone.startsWith('anon_')) {
      try { await migrateGuestSessionToAccount(guestPhone, userPhone); await applyQrReferralAttribution(guestPhone, userPhone); }
      catch (migrationError) { console.error('Guest migration failed during email verify:', migrationError); }
    }
    const token = issueUserToken(userPhone);
    const deviceId = String(req.body?.deviceId || req.headers['x-kurukoo-device-id'] || '').trim();
    if (deviceId) await registerTrustedDevice({ phone: userPhone, deviceId, credentialType: req.body?.credentialType || 'web', label: req.body?.label || 'Email-verified browser', pushCapable: req.body?.pushCapable === true });
    setAuthCookie(res, token, guestPhone.startsWith('anon_'));
    res.json({ success: true, phone: userPhone, email, token, emailVerified: true, deviceRegistered: Boolean(deviceId), message: 'Email verified. Your phone remains the primary Kurukoo channel identity.' });
  } catch (e: any) {
    console.error('verify-email-otp error:', e);
    res.status(500).json({ success: false, message: e.message || 'Email verification failed' });
  }
});

router.post('/verify-otp', authRateLimit, async (req, res) => {
  try {
    const phone = String(req.body?.phone || '').trim();
    const code = String(req.body?.code || '').trim();
    const guestPhone = String(req.body?.guestPhone || '').trim();
    const developmentResult = verifyDevelopmentTestOtp(phone, code);
    const result = developmentResult || await verifyPhoneOtp(phone, code);
    if (!result.success || !result.phone) return res.status(401).json(result);

    const userPhone = result.phone;
    const profileName = developmentResult?.testMode ? getConfiguredTestName() : req.body?.name;
    await upsertProfile(userPhone, profileName, req.body?.email, req.body?.goal);
    await ensureOtpSchema();
    const db = await getDb();
    db.run('UPDATE memory_profiles SET phone_verified_at = CURRENT_TIMESTAMP WHERE phone = ?', [userPhone]);
    if (req.body?.email) db.run('UPDATE memory_profiles SET email = COALESCE(NULLIF(?, \'\'), email) WHERE phone = ?', [String(req.body.email).trim().toLowerCase(), userPhone]);
    saveDb();

    if (guestPhone.startsWith('anon_')) {
      try {
        await migrateGuestSessionToAccount(guestPhone, userPhone);
        // Attribution records a qualified referral only after identity is verified;
        // it does not award Points and never runs during QR scan/activation.
        await applyQrReferralAttribution(guestPhone, userPhone);
      } catch (migrationError) { console.error('Guest migration or QR attribution failed during verify-otp:', migrationError); }
    }

    const token = issueUserToken(userPhone);
    const deviceId = String(req.body?.deviceId || req.headers['x-kurukoo-device-id'] || '').trim();
    if (deviceId) await registerTrustedDevice({ phone: userPhone, deviceId, credentialType: req.body?.credentialType || 'web', label: req.body?.label || 'Phone-verified browser', pushCapable: req.body?.pushCapable === true });
    setAuthCookie(res, token, guestPhone.startsWith('anon_'));
    res.json({ success: true, phone: userPhone, token, deviceRegistered: Boolean(deviceId), message: developmentResult?.testMode ? 'Development test identity authenticated' : 'Authenticated', ...(developmentResult?.testMode ? { testMode: true } : {}) });
  } catch (e: any) {
    console.error('verify-otp error:', e);
    res.status(500).json({ success: false, message: e.message || 'Verification failed' });
  }
});

router.post('/login', authRateLimit, async (req, res) => {
  try {
    const { phone, name, email, goal } = req.body || {};
    if (!phone && !email) return res.status(400).json({ success: false, error: 'Phone number or email required' });
    const authHeader = req.headers.authorization;
    if (authHeader?.startsWith('Bearer ')) {
      try {
        const token = authHeader.slice(7).trim();
        const decoded = jwt.verify(token, getJwtSecret(), { algorithms: ['HS256'] }) as any;
        if (decoded?.phone) {
          await upsertProfile(decoded.phone, name, email, goal);
          setAuthCookie(res, token);
          return res.json({ success: true, phone: decoded.phone, name: name || 'Kurukoo User', token });
        }
      } catch { /* continue */ }
    }
    if (process.env.OTP_LEGACY_LOGIN === 'true') {
      const userPhone = String(phone);
      await upsertProfile(userPhone, name, email, goal);
      const token = issueUserToken(userPhone);
      setAuthCookie(res, token);
      return res.json({ success: true, phone: userPhone, name: name || 'Kurukoo User', token, warning: 'Legacy login enabled — disable OTP_LEGACY_LOGIN in production' });
    }
    return res.status(401).json({ success: false, error: 'Phone login requires OTP.', require_otp: true });
  } catch (e: any) {
    console.error('Auth login error:', e);
    res.status(500).json({ success: false, error: e.message || 'Login failed' });
  }
});

router.post('/logout', (_req, res) => {
  const options = { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax' as const, path: '/' };
  res.clearCookie(AUTH_COOKIE, options);
  res.clearCookie('kurukoo_guest_id', options);
  res.cookie(AUTH_COOKIE, '', { ...options, maxAge: 0 });
  res.cookie('kurukoo_guest_id', '', { ...options, maxAge: 0 });
  res.json({ success: true });
});

router.get('/me', authenticateUser, async (req: AuthRequest, res) => {
  const phone = String(req.user?.phone || '');
  res.json({ success: true, user: req.user, developmentTestAccount: isDevelopmentTestIdentity(phone), testAuth: getDevelopmentTestAuthStatus(), sessionContext: { operator: req.user?.operatorSession === true, testActor: req.user?.testActor === true, actorRole: req.user?.actorRole || null, actorContextId: req.user?.actorContextId || null, operatorPhone: req.user?.operatorPhone || null } });
});

export default router;

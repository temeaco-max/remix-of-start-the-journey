import { Router } from 'express';
import { authenticateAdmin, authenticateUser, type AuthRequest } from '../middleware/auth.js';
import {
  ensureProviderVerification,
  getProviderVerification,
  listProviderVerifications,
  reviewProviderVerification,
  submitProviderVerification,
  expireProviderVerifications,
} from '../services/providerVerificationLifecycle.js';
import { normalizeProviderEntityType } from '../services/providerEntity.js';

const router = Router();
const adminRouter = Router();

function evidenceList(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return Array.from(new Set(value.map(item => String(item || '').trim()).filter(Boolean))).slice(0, 50);
}

router.get('/provider-verification/me', authenticateUser, async (req: AuthRequest, res) => {
  const phone = String(req.user?.phone || '').trim();
  if (!phone) return res.status(401).json({ success: false, error: 'Authenticated identity is required.' });
  try {
    const record = await ensureProviderVerification(phone, req.query.entityType || 'human');
    return res.json({ success: true, verification: record });
  } catch (error) {
    return res.status(500).json({ success: false, error: error instanceof Error ? error.message : 'Unable to load verification status.' });
  }
});

router.post('/provider-verification/submit', authenticateUser, async (req: AuthRequest, res) => {
  const phone = String(req.user?.phone || '').trim();
  if (!phone) return res.status(401).json({ success: false, error: 'Authenticated identity is required.' });
  const entityType = normalizeProviderEntityType(req.body?.entityType);
  const evidence = evidenceList(req.body?.evidence);
  try {
    const verification = await submitProviderVerification({ providerPhone: phone, entityType, evidence });
    return res.status(verification.state === 'submitted' ? 200 : 400).json({ success: verification.state === 'submitted', verification, next: verification.state === 'submitted' ? 'operator_review' : 'submit_at_least_one_evidence_item' });
  } catch (error) {
    return res.status(409).json({ success: false, error: error instanceof Error ? error.message : 'Unable to submit verification.' });
  }
});

adminRouter.get('/provider-verification', authenticateAdmin, async (req: AuthRequest, res) => {
  try {
    const state = typeof req.query.state === 'string' ? req.query.state as any : undefined;
    const limit = Number(req.query.limit || 100);
    const verifications = await listProviderVerifications(state, limit);
    return res.json({ success: true, verifications, operator: `admin:${process.env.ADMIN_USERNAME || 'admin'}` });
  } catch (error) {
    return res.status(500).json({ success: false, error: error instanceof Error ? error.message : 'Unable to list provider verifications.' });
  }
});

adminRouter.post('/provider-verification/:phone/review', authenticateAdmin, async (req: AuthRequest, res) => {
  const providerPhone = String(req.params.phone || '').trim();
  const decision = String(req.body?.decision || '').trim() as 'verified' | 'rejected' | 'suspended';
  if (!providerPhone || !['verified', 'rejected', 'suspended'].includes(decision)) return res.status(400).json({ success: false, error: 'A provider phone and valid review decision are required.' });
  const reviewerId = `admin:${process.env.ADMIN_USERNAME || 'admin'}`;
  try {
    const verification = await reviewProviderVerification({ providerPhone, reviewerId, decision, reason: req.body?.reason ? String(req.body.reason).slice(0, 500) : undefined, expiresAt: req.body?.expiresAt ? String(req.body.expiresAt) : undefined });
    return res.json({ success: true, verification, externalActivationRequired: decision === 'verified' });
  } catch (error) {
    return res.status(409).json({ success: false, error: error instanceof Error ? error.message : 'Unable to review provider verification.' });
  }
});

adminRouter.post('/provider-verification/maintenance/expire', authenticateAdmin, async (_req: AuthRequest, res) => {
  try {
    const expired = await expireProviderVerifications();
    return res.json({ success: true, expired, operator: `admin:${process.env.ADMIN_USERNAME || 'admin'}` });
  } catch (error) {
    return res.status(500).json({ success: false, error: error instanceof Error ? error.message : 'Unable to expire provider verifications.' });
  }
});

export { router as providerVerificationRoutes, adminRouter as adminProviderVerificationRoutes };
export default router;

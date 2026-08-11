/**
 * Subscription routes — removes client-trusted identity mutation.
 *
 * ✗ POST { phone, plan }  (unauthenticated body trust)
 * ✓ authenticated session → memory profile → validated plan → confirmed payment → tier
 */
import { Router } from 'express';
import { authenticateUser, AuthRequest } from '../middleware/auth.js';
import { paymentRateLimit } from '../middleware/rateLimit.js';
import {
  upgradeSubscriptionAfterPayment,
  subscribeProviderTier,
} from '../services/subscriptionService.js';

const router = Router();

/**
 * Consumer plan upgrade. Phone is taken from JWT only.
 */
router.post('/upgrade', authenticateUser, paymentRateLimit, async (req: AuthRequest, res) => {
  try {
    const phone = req.user?.phone;
    if (!phone) return res.status(401).json({ error: 'Authentication required' });

    const plan = String(req.body?.plan || '').trim();
    const country = String(req.body?.country || req.body?.locale || 'ng').trim().toLowerCase();
    const payment_ref = req.body?.payment_ref ? String(req.body.payment_ref) : undefined;

    // Ignore any body.phone — identity comes from session only
    if (req.body?.phone && req.body.phone !== phone) {
      return res.status(403).json({ error: 'Forbidden: subscription must use authenticated identity' });
    }

    const result = await upgradeSubscriptionAfterPayment(phone, plan, country, { payment_ref });
    if (!result.success) {
      const status = result.payment_required ? 402 : result.error === 'plan_not_found' ? 404 : 400;
      return res.status(status).json(result);
    }
    res.json(result);
  } catch (e: any) {
    console.error('Subscription upgrade error:', e);
    res.status(500).json({ error: e.message || 'Failed to upgrade subscription' });
  }
});

/**
 * Provider lead-subscription (Base / Plus / Business).
 */
router.post('/provider', authenticateUser, paymentRateLimit, async (req: AuthRequest, res) => {
  try {
    const phone = req.user?.phone;
    if (!phone) return res.status(401).json({ error: 'Authentication required' });

    const tier = String(req.body?.tier || '').trim();
    const payment_ref = req.body?.payment_ref ? String(req.body.payment_ref) : undefined;

    if (req.body?.phone && req.body.phone !== phone) {
      return res.status(403).json({ error: 'Forbidden: subscription must use authenticated identity' });
    }

    const result = await subscribeProviderTier(phone, tier, { payment_ref });
    if (!result.success) {
      const status = result.payment_required ? 402 : 400;
      return res.status(status).json(result);
    }
    res.json(result);
  } catch (e: any) {
    console.error('Provider subscribe error:', e);
    res.status(500).json({ success: false, error: e.message || 'Internal error' });
  }
});

export default router;

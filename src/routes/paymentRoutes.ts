/**
 * Payment-related mutations — points top-up and credits.
 * Identity from JWT; rate-limited; does not invent parallel wallet ledgers.
 */
import { Router } from 'express';
import { authenticateUser, AuthRequest } from '../middleware/auth.js';
import { paymentRateLimit } from '../middleware/rateLimit.js';
import { addPoints, getPointsBalance, addCredits } from '../services/pointsEngine.js';
import { getProfile } from '../services/memoryProfile.js';

const router = Router();

router.get('/points/balance', authenticateUser, async (req: AuthRequest, res) => {
  const phone = req.user?.phone || (req.query.phone as string);
  if (!phone || (req.user?.phone && req.user.phone !== phone)) {
    return res.status(403).json({ error: 'Forbidden: You can only view your own balance' });
  }
  try {
    const balance = await getPointsBalance(phone);
    const profile = await getProfile(phone, 'points_query');
    res.json({
      success: true,
      phone,
      points: balance,
      tier: profile?.subscription_tier || 'Base',
      currency: '₦',
    });
  } catch (e: any) {
    res.status(500).json({ error: e.message || 'Failed to fetch points balance' });
  }
});

/**
 * Points top-up requires auth + payment_ref for non-sandbox.
 * In sandbox, still requires authenticated phone matching JWT.
 */
router.post('/points/topup', authenticateUser, paymentRateLimit, async (req: AuthRequest, res) => {
  const phone = req.user?.phone;
  if (!phone) return res.status(401).json({ error: 'Authentication required' });

  if (req.body?.phone && req.body.phone !== phone) {
    return res.status(403).json({ error: 'Forbidden: top-up must use authenticated identity' });
  }

  const amount_points = req.body?.amount_points;
  const payment_ref = req.body?.payment_ref;
  if (!amount_points) {
    return res.status(400).json({ error: 'amount_points is required' });
  }

  const provider = process.env.KURUKOO_PAY_PROVIDER || 'sandbox';
  if (provider !== 'sandbox' && (!payment_ref || String(payment_ref).length < 8)) {
    return res.status(402).json({
      error: 'payment_ref required from regulated PSP confirmation',
      payment_required: true,
    });
  }

  try {
    const points = parseInt(amount_points, 10);
    if (isNaN(points) || points <= 0) {
      return res.status(400).json({ error: 'Invalid points amount' });
    }
    await addPoints(phone, points, `Top-up ref: ${payment_ref || 'sandbox'}`);
    const newBalance = await getPointsBalance(phone);
    res.json({
      success: true,
      message: `Successfully credited ${points} Points!`,
      balance: newBalance,
    });
  } catch (e: any) {
    res.status(500).json({ error: e.message || 'Failed to top up points' });
  }
});

router.post('/credits/topup', authenticateUser, paymentRateLimit, async (req: AuthRequest, res) => {
  const phone = req.user?.phone;
  if (!phone) return res.status(401).json({ error: 'Authentication required' });

  if (req.body?.phone && req.body.phone !== phone) {
    return res.status(403).json({ error: 'Forbidden: credit top-up must use authenticated identity' });
  }

  const amount = Number(req.body?.amount);
  if (!amount || amount <= 0) {
    return res.status(400).json({ error: 'Valid amount is required' });
  }

  const fcmToken = req.body?.fcmToken || req.headers['x-fcm-token'];
  try {
    const profile = await getProfile(phone, 'credit_topup');
    if (profile?.fcm_token) {
      if (!fcmToken || fcmToken !== profile.fcm_token) {
        return res.status(403).json({
          success: false,
          error: 'Device session token mismatch or missing. Please re-authenticate.',
        });
      }
    }

    const provider = process.env.KURUKOO_PAY_PROVIDER || 'sandbox';
    if (provider !== 'sandbox' && (!req.body?.payment_ref || String(req.body.payment_ref).length < 8)) {
      return res.status(402).json({
        success: false,
        error: 'payment_ref required from regulated PSP confirmation',
        payment_required: true,
      });
    }

    await addCredits(phone, amount, `Purchased ${amount} credit pack`);
    res.json({ success: true });
  } catch (e: any) {
    res.status(500).json({ success: false, error: e.message || 'Failed to top up credits' });
  }
});

export default router;

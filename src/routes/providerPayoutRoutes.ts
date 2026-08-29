/* Copyright (c) 2026 temeaco-max. All rights reserved. Proprietary and confidential. */
import { Router } from 'express';
import { authenticateAdmin, authenticateUser, type AuthRequest } from '../middleware/auth.js';
import { getProviderPayoutBalance, requestProviderPayout, settleProviderPayout, failProviderPayout, listProviderPayouts, getProviderPayoutReadiness } from '../services/providerPayoutService.js';

const router = Router();
const adminRouter = Router();

function phoneOf(req: AuthRequest): string {
  return String(req.user?.phone || '').trim();
}

router.get('/provider-payouts/balance', authenticateUser, async (req: AuthRequest, res) => {
  const phone = phoneOf(req);
  if (!phone) return res.status(401).json({ success: false, error: 'Authenticated identity is required.' });
  try {
    const balance = await getProviderPayoutBalance(phone, String(req.query.currency || 'NGN'));
    return res.json({ success: true, balance });
  } catch (error) {
    return res.status(500).json({ success: false, error: error instanceof Error ? error.message : 'Unable to load payout balance.' });
  }
});

router.get('/provider-payouts', authenticateUser, async (req: AuthRequest, res) => {
  const phone = phoneOf(req);
  if (!phone) return res.status(401).json({ success: false, error: 'Authenticated identity is required.' });
  try {
    const payouts = await listProviderPayouts(phone, Number(req.query.limit) || 20);
    return res.json({ success: true, payouts });
  } catch (error) {
    return res.status(500).json({ success: false, error: error instanceof Error ? error.message : 'Unable to list payouts.' });
  }
});

router.post('/provider-payouts/request', authenticateUser, async (req: AuthRequest, res) => {
  const phone = phoneOf(req);
  if (!phone) return res.status(401).json({ success: false, error: 'Authenticated identity is required.' });
  try {
    const payout = await requestProviderPayout({ providerPhone: phone, amountMinor: Number(req.body?.amountMinor), currency: String(req.body?.currency || 'NGN'), rail: req.body?.rail, destinationRef: String(req.body?.destinationRef || ''), idempotencyKey: req.body?.idempotencyKey ? String(req.body.idempotencyKey) : undefined });
    return res.status(201).json({ success: true, payout, note: 'Payout requested. Funds are reserved and will be marked settled only with evidence from the payout rail.' });
  } catch (error) {
    return res.status(400).json({ success: false, error: error instanceof Error ? error.message : 'Unable to request payout.' });
  }
});

router.get('/provider-payouts/readiness', authenticateUser, async (_req: AuthRequest, res) => {
  return res.json({ success: true, readiness: getProviderPayoutReadiness() });
});

adminRouter.post('/provider-payouts/:id/settle', authenticateAdmin, async (req: AuthRequest, res) => {
  try {
    const payout = await settleProviderPayout(String(req.params.id), String(req.body?.externalReference || ''));
    return res.json({ success: true, payout });
  } catch (error) {
    return res.status(400).json({ success: false, error: error instanceof Error ? error.message : 'Unable to settle payout.' });
  }
});

adminRouter.post('/provider-payouts/:id/fail', authenticateAdmin, async (req: AuthRequest, res) => {
  try {
    const payout = await failProviderPayout(String(req.params.id), String(req.body?.reason || 'Payout rejected by rail.'));
    return res.json({ success: true, payout });
  } catch (error) {
    return res.status(400).json({ success: false, error: error instanceof Error ? error.message : 'Unable to fail payout.' });
  }
});

export default router;
export { adminRouter as providerPayoutAdminRouter };

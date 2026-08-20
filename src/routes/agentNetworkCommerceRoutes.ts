import { Router } from 'express';
import { authenticateAdmin, authenticateUser, type AuthRequest } from '../middleware/auth.js';
import {
  activateNetworkAgent,
  chargeProviderLead,
  createPointsTopUpIntent,
  getAgentNetworkSummary,
  getNetworkAgentByPhone,
  getProviderLeadCost,
  registerNetworkAgent,
  settlePointsTopUp,
} from '../services/agentNetworkCommerce.js';

const router = Router();

router.post('/agent-network/register', authenticateUser, async (req: AuthRequest, res) => {
  try {
    const phone = String(req.user?.phone || '');
    const agent = await registerNetworkAgent({
      phone,
      name: req.body?.name,
      agentType: req.body?.agentType,
      country: req.body?.country,
      region: req.body?.region,
    });
    res.status(201).json({ success: true, agent });
  } catch (error) {
    res.status(400).json({ error: error instanceof Error ? error.message : 'Unable to register as a Kurukoo network agent.' });
  }
});

router.get('/agent-network/me', authenticateUser, async (req: AuthRequest, res) => {
  try {
    const phone = String(req.user?.phone || '');
    res.json({ success: true, agent: await getNetworkAgentByPhone(phone) });
  } catch (error) {
    res.status(500).json({ error: error instanceof Error ? error.message : 'Unable to load network agent status.' });
  }
});

router.post('/agent-network/points/topup-intents', authenticateUser, async (req: AuthRequest, res) => {
  try {
    const agentId = String(req.body?.agentId || '').trim() || undefined;
    const customerPhone = String(req.user?.phone || '');
    const intent = await createPointsTopUpIntent({
      customerPhone,
      points: req.body?.points,
      fiatAmountMinor: req.body?.fiatAmountMinor,
      currency: req.body?.currency,
      agentId,
      idempotencyKey: req.body?.idempotencyKey,
    });
    res.status(201).json({ success: true, topUp: intent, paymentRequired: true, settlement: 'verified-payment-only' });
  } catch (error) {
    res.status(400).json({ error: error instanceof Error ? error.message : 'Unable to create Points top-up intent.' });
  }
});

router.post('/agent-network/provider-leads/charge', authenticateUser, async (req: AuthRequest, res) => {
  try {
    const providerPhone = String(req.body?.providerPhone || req.user?.phone || '');
    const result = await chargeProviderLead({ providerPhone, category: req.body?.category, skill: req.body?.skill, requestId: req.body?.requestId });
    res.status(result.success ? 200 : 402).json({ success: result.success, ...result });
  } catch (error) {
    res.status(400).json({ error: error instanceof Error ? error.message : 'Unable to charge provider lead.' });
  }
});

router.get('/agent-network/provider-leads/cost', authenticateUser, async (req: AuthRequest, res) => {
  res.json({ success: true, points: await getProviderLeadCost(String(req.query.category || ''), String(req.query.skill || '')) });
});

router.post('/admin/agent-network/:agentId/activate', authenticateAdmin, async (req: AuthRequest, res) => {
  try {
    await activateNetworkAgent(String(req.params.agentId));
    res.json({ success: true });
  } catch (error) {
    res.status(400).json({ error: error instanceof Error ? error.message : 'Unable to activate network agent.' });
  }
});

router.post('/admin/agent-network/points/topups/:topUpId/settle', authenticateAdmin, async (req: AuthRequest, res) => {
  try {
    const result = await settlePointsTopUp(String(req.params.topUpId), String(req.body?.externalReference || ''));
    res.json({ success: true, ...result });
  } catch (error) {
    res.status(400).json({ error: error instanceof Error ? error.message : 'Unable to settle Points top-up.' });
  }
});

router.get('/admin/agent-network/summary', authenticateAdmin, async (_req: AuthRequest, res) => {
  try { res.json({ success: true, ...(await getAgentNetworkSummary()) }); } catch (error) { res.status(500).json({ error: error instanceof Error ? error.message : 'Unable to load agent network summary.' }); }
});

export default router;

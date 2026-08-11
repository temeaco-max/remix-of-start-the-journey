/**
 * Pricing routes — extracted from index.ts (ChatGPT audit route batch).
 * Depends on existing pricingService; no parallel pricing store.
 */
import { Router } from 'express';
import { authenticateAdmin, AuthRequest } from '../middleware/auth.js';
import {
  getPricing,
  getAllPricing,
  updatePlan,
  createPlan,
  deletePlan,
} from '../services/pricingService.js';

const router = Router();

/** Public catalogue by country */
router.get('/:country', async (req, res) => {
  res.setHeader('Cache-Control', 'public, max-age=300, stale-while-revalidate=600');
  try {
    const plans = await getPricing(req.params.country);
    res.json(plans);
  } catch (e) {
    console.error('pricing fetch error:', e);
    res.status(500).json({ error: 'Failed to fetch pricing' });
  }
});

/** Admin list */
router.get('/admin/all', authenticateAdmin, async (_req: AuthRequest, res) => {
  try {
    const plans = await getAllPricing();
    res.json(plans);
  } catch (e) {
    res.status(500).json({ error: 'Failed to fetch admin pricing' });
  }
});

router.put('/admin/:country/:plan', authenticateAdmin, async (req: AuthRequest, res) => {
  try {
    const { country, plan } = req.params;
    const success = await updatePlan(country, plan, req.body);
    res.json({ success });
  } catch (e) {
    res.status(500).json({ error: 'Failed to update pricing plan' });
  }
});

router.post('/admin', authenticateAdmin, async (req: AuthRequest, res) => {
  try {
    const success = await createPlan(req.body);
    res.json({ success });
  } catch (e) {
    res.status(500).json({ error: 'Failed to create pricing plan' });
  }
});

router.delete('/admin/:country/:plan', authenticateAdmin, async (req: AuthRequest, res) => {
  try {
    const { country, plan } = req.params;
    const success = await deletePlan(country, plan);
    res.json({ success });
  } catch (e) {
    res.status(500).json({ error: 'Failed to delete pricing plan' });
  }
});

export default router;

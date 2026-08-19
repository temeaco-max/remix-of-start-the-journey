import { Router } from 'express';
import { authenticateAdmin, type AuthRequest } from '../middleware/auth.js';
import { getAdminPlatformOverview } from '../services/adminPlatformService.js';

const router = Router();

router.use(authenticateAdmin);

/**
 * One operator-facing projection for every Kurukoo client family.
 * This is deliberately read-only: canonical services remain the owners of
 * identity, conversation, requests, payments, notifications and fulfilment.
 */
router.get('/overview', async (_req: AuthRequest, res) => {
  try {
    res.json(await getAdminPlatformOverview());
  } catch (error) {
    console.error('[AdminPlatform] overview failed:', error);
    res.status(500).json({ success: false, error: 'Unable to load platform operations state.' });
  }
});

router.get('/surfaces', async (_req: AuthRequest, res) => {
  try {
    const overview = await getAdminPlatformOverview();
    res.json({ success: true, contractVersion: overview.contractVersion, generatedAt: overview.generatedAt, surfaces: overview.surfaces, clientContract: overview.clientContract });
  } catch (error) {
    console.error('[AdminPlatform] surfaces failed:', error);
    res.status(500).json({ success: false, error: 'Unable to load client surface state.' });
  }
});

export default router;

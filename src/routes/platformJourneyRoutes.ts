import { Router } from 'express';
import { authenticateUser, type AuthRequest } from '../middleware/auth.js';
import { listPlatformJourneyEvents } from '../services/platformJourneyWeaver.js';

const router = Router();

router.get('/journey', authenticateUser, async (req: AuthRequest, res) => {
  try {
    const phone = String(req.user?.phone || '').trim();
    const events = await listPlatformJourneyEvents({
      contextId: typeof req.query.contextId === 'string' ? req.query.contextId : undefined,
      economicRequestId: typeof req.query.requestId === 'string' ? req.query.requestId : undefined,
      phone,
      limit: Number(req.query.limit || 50),
    });
    res.json({ success: true, events });
  } catch (error) {
    res.status(500).json({ success: false, error: error instanceof Error ? error.message : 'Unable to load platform journey.' });
  }
});

export default router;

import { Router } from 'express';
import { authenticateUser } from '../middleware/auth.js';
import { getQuickReplies } from '../services/quickRepliesService.js';

const router = Router();

router.get('/quick-replies', authenticateUser, async (req, res) => {
  const phone = (req as any).user?.phone;
  if (!phone) return res.status(401).json({ error: 'Authenticated phone required' });
  try {
    const replies = await getQuickReplies(phone);
    res.json({ success: true, quickReplies: replies });
  } catch (error) {
    console.error('[QuickReplies] fetch failed:', error);
    res.status(500).json({ error: 'Unable to fetch quick replies' });
  }
});

export default router;
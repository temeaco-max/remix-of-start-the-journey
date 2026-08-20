import { Router } from 'express';
import { authenticateUser, type AuthRequest } from '../middleware/auth.js';
import { createServiceReview, getServiceReviewForLead } from '../services/serviceReviewService.js';
import { getDb } from '../database.js';

const router = Router();

router.post('/reviews/dispatch/:leadId', authenticateUser, async (req: AuthRequest, res) => {
  try {
    const reviewerPhone = String(req.user?.phone || '').trim();
    const leadId = String(req.params.leadId || '').trim();
    const db = await getDb();
    const rows = db.exec('SELECT request_id, provider_phone, status FROM economic_dispatch_leads WHERE id=? LIMIT 1', [leadId]);
    if (!rows[0]?.values?.length) return res.status(404).json({ success: false, error: 'Dispatch lead not found.' });
    const row = rows[0].values[0];
    const requestId = String(row[0]);
    const providerPhone = String(row[1]);
    if (String(row[2]) !== 'completed') return res.status(422).json({ success: false, error: 'The dispatch must be completed before it can be reviewed.' });
    const review = await createServiceReview({ requestId, reviewerPhone, providerPhone, rating: Number(req.body?.rating), feedback: req.body?.feedback });
    res.status(201).json({ success: true, review });
  } catch (error) {
    res.status(422).json({ success: false, error: error instanceof Error ? error.message : 'Unable to record service review.' });
  }
});

router.get('/reviews/dispatch/:leadId', authenticateUser, async (req: AuthRequest, res) => {
  try {
    const review = await getServiceReviewForLead(String(req.params.leadId || ''), String(req.user?.phone || ''));
    res.json({ success: true, review });
  } catch (error) {
    res.status(500).json({ success: false, error: error instanceof Error ? error.message : 'Unable to read service review.' });
  }
});

export default router;

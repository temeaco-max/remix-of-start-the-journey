/**
 * Money / Safety circle boundary — ChatGPT audit extraction.
 * Creator, joiner, and contributor phone always from JWT session.
 * MONEY_CIRCLE_LIVE remains gated in the service layer.
 */
import { Router } from 'express';
import { authenticateUser, AuthRequest } from '../middleware/auth.js';
import {
  createMoneyCircle,
  joinMoneyCircle,
  recordContribution,
  getCircleDetails,
  processBuyingCircleDiscount,
  broadcastSafetyCircleAlert,
} from '../services/moneyCircle.js';

const router = Router();

function sessionPhone(req: AuthRequest): string | null {
  return req.user?.phone ? String(req.user.phone) : null;
}

router.post('/circle/create', authenticateUser, async (req: AuthRequest, res) => {
  const phone = sessionPhone(req);
  if (!phone) return res.status(401).json({ error: 'Authentication required' });
  if (req.body?.creator_phone && String(req.body.creator_phone) !== phone) {
    return res.status(403).json({ error: 'Forbidden: creator_phone must match session' });
  }
  const name = req.body?.name;
  const target_amount = req.body?.target_amount;
  const mode = req.body?.mode || 'Standard';
  if (!name || target_amount === undefined || target_amount === null) {
    return res.status(400).json({ error: 'Missing required parameters (name, target_amount)' });
  }
  try {
    const circleId = await createMoneyCircle(String(name), phone, parseFloat(String(target_amount)), String(mode));
    res.json({ success: true, circleId, message: `Money Circle "${name}" created successfully.` });
  } catch {
    res.status(500).json({ error: 'Failed to create Money Circle' });
  }
});

router.post('/circle/join', authenticateUser, async (req: AuthRequest, res) => {
  const phone = sessionPhone(req);
  if (!phone) return res.status(401).json({ error: 'Authentication required' });
  if (req.body?.phone && String(req.body.phone) !== phone) {
    return res.status(403).json({ error: 'Forbidden: phone must match session' });
  }
  const circle_id = req.body?.circle_id;
  if (!circle_id) return res.status(400).json({ error: 'Missing required parameter (circle_id)' });
  try {
    const success = await joinMoneyCircle(parseInt(String(circle_id), 10), phone);
    if (success) res.json({ success: true, message: `Joined circle ${circle_id} successfully.` });
    else res.status(404).json({ error: 'Money Circle not found' });
  } catch {
    res.status(500).json({ error: 'Failed to join Money Circle' });
  }
});

router.post('/circle/contribute', authenticateUser, async (req: AuthRequest, res) => {
  const phone = sessionPhone(req);
  if (!phone) return res.status(401).json({ error: 'Authentication required' });
  if (req.body?.phone && String(req.body.phone) !== phone) {
    return res.status(403).json({ error: 'Forbidden: phone must match session' });
  }
  const circle_id = req.body?.circle_id;
  const amount = req.body?.amount;
  if (!circle_id || amount === undefined || amount === null) {
    return res.status(400).json({ error: 'Missing required parameters (circle_id, amount)' });
  }
  try {
    const success = await recordContribution(parseInt(String(circle_id), 10), phone, parseFloat(String(amount)));
    res.json({ success, message: `Recorded contribution of ${amount} for circle ${circle_id}.` });
  } catch {
    res.status(500).json({ error: 'Failed to record contribution' });
  }
});

router.get('/circle/:id', authenticateUser, async (req: AuthRequest, res) => {
  const circleId = parseInt(req.params.id, 10);
  if (isNaN(circleId)) return res.status(400).json({ error: 'Invalid circle ID' });
  try {
    const details = await getCircleDetails(circleId);
    if (!details) return res.status(404).json({ error: 'Money Circle not found' });
    res.json({ success: true, circle: details });
  } catch {
    res.status(500).json({ error: 'Failed to fetch Money Circle details' });
  }
});

router.post('/circle/:id/buying-discount', authenticateUser, async (req: AuthRequest, res) => {
  const circleId = parseInt(req.params.id, 10);
  if (isNaN(circleId)) return res.status(400).json({ error: 'Invalid circle ID' });
  try {
    const result = await processBuyingCircleDiscount(circleId);
    res.json(result);
  } catch {
    res.status(500).json({ error: 'Failed to process buying discount' });
  }
});

router.post('/circle/:id/safety-alert', authenticateUser, async (req: AuthRequest, res) => {
  const phone = sessionPhone(req);
  if (!phone) return res.status(401).json({ error: 'Authentication required' });
  if (req.body?.phone && String(req.body.phone) !== phone) {
    return res.status(403).json({ error: 'Forbidden: phone must match session' });
  }
  const circleId = parseInt(req.params.id, 10);
  if (isNaN(circleId)) return res.status(400).json({ error: 'Invalid circle ID' });
  const alertType = String(req.body?.alert_type || req.body?.type || 'general');
  try {
    const result = await broadcastSafetyCircleAlert(circleId, phone, alertType);
    res.json(result);
  } catch {
    res.status(500).json({ error: 'Failed to broadcast safety alert' });
  }
});

export default router;

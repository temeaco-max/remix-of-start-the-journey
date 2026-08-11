/**
 * Trust boundary: disputes, scam reports, escrow.
 * ChatGPT audit extraction — identity from JWT only; no client-trusted phone
 * for dispute ownership or escrow buyer. Resolve/escalate require admin.
 */
import { Router } from 'express';
import { authenticateUser, authenticateAdmin, AuthRequest } from '../middleware/auth.js';
import { getDb, saveDb } from '../database.js';
import {
  createDispute,
  getDisputeStatus,
  resolveDispute,
  escalateDispute,
} from '../services/disputeResolution.js';
import { createEscrow, releaseEscrow, refundEscrow } from '../services/escrow.js';

const router = Router();

function sessionPhone(req: AuthRequest): string | null {
  return req.user?.phone ? String(req.user.phone) : null;
}

/** Create dispute — phone from JWT only */
router.post('/dispute/create', authenticateUser, async (req: AuthRequest, res) => {
  const phone = sessionPhone(req);
  if (!phone) return res.status(401).json({ error: 'Authentication required' });
  if (req.body?.phone && String(req.body.phone) !== phone) {
    return res.status(403).json({ error: 'Forbidden: phone must match session' });
  }
  const order_id = req.body?.order_id || req.body?.orderId;
  const reason = req.body?.reason;
  if (!order_id || !reason) {
    return res.status(400).json({ error: 'Missing order_id or reason' });
  }
  try {
    const disputeId = await createDispute(phone, String(order_id), String(reason));
    res.json({ success: true, disputeId, message: 'Dispute submitted successfully.' });
  } catch {
    res.status(500).json({ error: 'Failed to create dispute' });
  }
});

/** Alias used by older clients */
router.post('/disputes', authenticateUser, async (req: AuthRequest, res) => {
  const phone = sessionPhone(req);
  if (!phone) return res.status(401).json({ error: 'Authentication required' });
  if (req.body?.phone && String(req.body.phone) !== phone) {
    return res.status(403).json({ error: 'Forbidden: phone must match session' });
  }
  const order_id = req.body?.order_id || req.body?.orderId;
  const reason = req.body?.reason;
  if (!order_id || !reason) {
    return res.status(400).json({ error: 'Missing order_id or reason' });
  }
  try {
    const disputeId = await createDispute(phone, String(order_id), String(reason));
    res.json({ success: true, disputeId, message: 'Dispute submitted successfully.' });
  } catch {
    res.status(500).json({ error: 'Failed to create dispute' });
  }
});

/** Scam report — reporter from JWT */
router.post('/scam_reports', authenticateUser, async (req: AuthRequest, res) => {
  const reporter = sessionPhone(req);
  if (!reporter) return res.status(401).json({ error: 'Authentication required' });
  if (req.body?.reporter_phone && String(req.body.reporter_phone) !== reporter) {
    return res.status(403).json({ error: 'Forbidden: reporter_phone must match session' });
  }
  const reported_phone = req.body?.reported_phone;
  const description = req.body?.description;
  if (!reported_phone || !description) {
    return res.status(400).json({ error: 'Missing reported_phone or description' });
  }
  try {
    const db = await getDb();
    db.run(
      `INSERT INTO scam_reports (reporter_phone, reported_phone, description, status) VALUES (?, ?, ?, 'pending')`,
      [reporter, String(reported_phone), String(description)]
    );
    saveDb();
    res.json({ success: true, message: 'Scam report submitted successfully.' });
  } catch (e) {
    console.error('Failed to submit scam report:', e);
    res.status(500).json({ error: 'Failed to submit scam report' });
  }
});

router.get('/dispute/:id', authenticateUser, async (req: AuthRequest, res) => {
  const disputeId = parseInt(req.params.id, 10);
  if (isNaN(disputeId)) return res.status(400).json({ error: 'Invalid dispute ID' });
  try {
    const status = await getDisputeStatus(disputeId);
    res.json({ success: true, disputeId, status });
  } catch {
    res.status(500).json({ error: 'Failed to fetch dispute status' });
  }
});

/** Admin-only resolution */
router.post('/dispute/:id/resolve', authenticateAdmin, async (req: AuthRequest, res) => {
  const disputeId = parseInt(req.params.id, 10);
  const resolution = req.body?.resolution;
  if (isNaN(disputeId) || !resolution) {
    return res.status(400).json({ error: 'Missing disputeId or resolution' });
  }
  try {
    await resolveDispute(disputeId, String(resolution));
    res.json({ success: true, message: 'Dispute resolved successfully.' });
  } catch {
    res.status(500).json({ error: 'Failed to resolve dispute' });
  }
});

router.post('/dispute/:id/escalate', authenticateUser, async (req: AuthRequest, res) => {
  const disputeId = parseInt(req.params.id, 10);
  if (isNaN(disputeId)) return res.status(400).json({ error: 'Invalid dispute ID' });
  try {
    await escalateDispute(disputeId);
    res.json({ success: true, message: 'Dispute escalated to admin review.' });
  } catch {
    res.status(500).json({ error: 'Failed to escalate dispute' });
  }
});

/**
 * Escrow create — buyer is always the authenticated session phone.
 * Client cannot set buyer_phone to another user.
 */
router.post('/escrow/create', authenticateUser, async (req: AuthRequest, res) => {
  const buyer = sessionPhone(req);
  if (!buyer) return res.status(401).json({ error: 'Authentication required' });
  if (req.body?.buyer_phone && String(req.body.buyer_phone) !== buyer) {
    return res.status(403).json({ error: 'Forbidden: buyer_phone must match session' });
  }
  const provider_phone = req.body?.provider_phone;
  const amount_minor = req.body?.amount_minor;
  const description = req.body?.description || '';
  const order_id = req.body?.order_id || `esc_${Date.now()}`;
  if (!provider_phone || amount_minor === undefined || amount_minor === null) {
    return res.status(400).json({ error: 'Missing required parameters' });
  }
  const amount = parseInt(String(amount_minor), 10);
  if (!Number.isInteger(amount) || amount <= 0) {
    return res.status(400).json({ error: 'amount_minor must be a positive integer' });
  }
  try {
    const escrowId = await createEscrow(String(order_id), buyer, String(provider_phone), amount, String(description));
    res.json({ success: true, escrowId, message: 'Escrow created and funds held.' });
  } catch {
    res.status(500).json({ error: 'Failed to create escrow' });
  }
});

/** Release — authenticated; service enforces status/cooling-off */
router.post('/escrow/release', authenticateUser, async (req: AuthRequest, res) => {
  const phone = sessionPhone(req);
  if (!phone) return res.status(401).json({ error: 'Authentication required' });
  const escrow_id = req.body?.escrow_id;
  if (!escrow_id) return res.status(400).json({ error: 'escrow_id is required' });
  try {
    const success = await releaseEscrow(parseInt(String(escrow_id), 10));
    res.json({ success, message: 'Escrow released to provider.' });
  } catch {
    res.status(500).json({ error: 'Failed to refund escrow' });
  }
});

router.post('/escrow/refund', authenticateUser, async (req: AuthRequest, res) => {
  const phone = sessionPhone(req);
  if (!phone) return res.status(401).json({ error: 'Authentication required' });
  const escrow_id = req.body?.escrow_id;
  if (!escrow_id) return res.status(400).json({ error: 'escrow_id is required' });
  try {
    const success = await refundEscrow(parseInt(String(escrow_id), 10));
    res.json({ success, message: 'Escrow refunded to buyer.' });
  } catch {
    res.status(500).json({ error: 'Failed to refund escrow' });
  }
});

export default router;

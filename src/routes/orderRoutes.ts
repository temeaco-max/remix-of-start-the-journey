/**
 * Orders / delivery boundary — ChatGPT audit extraction.
 * List by JWT phone only; delivery-status requires auth.
 * No default demo phone; no client-trusted phone query.
 */
import { Router } from 'express';
import { authenticateUser, AuthRequest } from '../middleware/auth.js';
import { getDb } from '../database.js';
import { updateDeliveryStatus } from '../services/deliveryService.js';

const router = Router();

function sessionPhone(req: AuthRequest): string | null {
  return req.user?.phone ? String(req.user.phone) : null;
}

/** Past orders for the authenticated user only */
router.get('/orders', authenticateUser, async (req: AuthRequest, res) => {
  const phone = sessionPhone(req);
  if (!phone) return res.status(401).json({ error: 'Authentication required' });
  if (req.query?.phone && String(req.query.phone) !== phone) {
    return res.status(403).json({ error: 'Forbidden: phone must match session' });
  }
  try {
    const db = await getDb();
    const stmt = db.prepare(`SELECT * FROM orders WHERE phone = ? ORDER BY created_at DESC`);
    stmt.bind([phone]);
    const orders: any[] = [];
    while (stmt.step()) orders.push(stmt.getAsObject());
    stmt.free();
    res.json(orders);
  } catch (err: any) {
    console.error('[API Orders] Error retrieving orders:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * Delivery status update — authenticated.
 * Buyer (order phone) only until provider JWT roles exist;
 * service layer validates transitions and order existence.
 */
router.post('/orders/:id/delivery-status', authenticateUser, async (req: AuthRequest, res) => {
  const phone = sessionPhone(req);
  if (!phone) return res.status(401).json({ error: 'Authentication required' });
  const orderId = req.params.id;
  const status = req.body?.status;
  const message = req.body?.message;
  if (!status) return res.status(400).json({ error: 'Status is required' });
  try {
    const db = await getDb();
    const stmt = db.prepare(`SELECT phone FROM orders WHERE id = ?`);
    stmt.bind([orderId]);
    let orderPhone: string | null = null;
    if (stmt.step()) {
      const row = stmt.getAsObject() as any;
      orderPhone = row?.phone ? String(row.phone) : null;
    }
    stmt.free();
    if (!orderPhone) return res.status(404).json({ error: `Order ${orderId} not found` });
    if (orderPhone !== phone) {
      return res.status(403).json({ error: 'Forbidden: not order owner' });
    }
    const result = await updateDeliveryStatus(String(orderId), String(status), message ? String(message) : undefined);
    res.json(result);
  } catch (err: any) {
    console.error('[API Orders] delivery-status error:', err);
    res.status(500).json({ error: err?.message || 'Failed to update delivery status' });
  }
});

export default router;

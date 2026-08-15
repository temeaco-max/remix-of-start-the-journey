import { Router } from 'express';
import crypto from 'node:crypto';
import { authenticateUser, AuthRequest } from '../middleware/auth.js';
import { getDb, saveDb } from '../database.js';
import { getEconomicOffer, startKnownOfferEconomicRequest } from '../services/economicParticipants.js';

const router = Router();

async function ensureCartTable() {
  const db = await getDb();
  db.run(`CREATE TABLE IF NOT EXISTS cart_items (
    id TEXT PRIMARY KEY,
    phone TEXT NOT NULL,
    offer_id TEXT NOT NULL,
    title TEXT NOT NULL,
    seller TEXT,
    quantity INTEGER NOT NULL DEFAULT 1,
    price_minor INTEGER,
    currency TEXT DEFAULT 'NGN',
    source TEXT,
    provenance TEXT,
    external_url TEXT,
    media_reference TEXT,
    request_id TEXT,
    status TEXT DEFAULT 'review',
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(phone, offer_id)
  )`);
  const columns = db.exec('PRAGMA table_info(cart_items)')[0]?.values || [];
  if (!columns.some((column: any[]) => String(column[1]) === 'request_id')) db.run('ALTER TABLE cart_items ADD COLUMN request_id TEXT');
  return db;
}

function phoneFrom(req: AuthRequest) { return req.user?.phone ? String(req.user.phone) : null; }

router.get('/cart', authenticateUser, async (req: AuthRequest, res) => {
  const phone = phoneFrom(req); if (!phone) return res.status(401).json({ error: 'Authenticated phone is required' });
  const db = await ensureCartTable(); const stmt = db.prepare('SELECT * FROM cart_items WHERE phone=? AND status=? ORDER BY created_at DESC'); stmt.bind([phone, 'review']);
  const items: any[] = []; while (stmt.step()) items.push(stmt.getAsObject()); stmt.free(); res.json({ items });
});

router.post('/cart/items', authenticateUser, async (req: AuthRequest, res) => {
  const phone = phoneFrom(req); if (!phone) return res.status(401).json({ error: 'Authenticated phone is required' });
  const offerId = String(req.body?.offerId || '').trim(); if (!offerId) return res.status(400).json({ error: 'offerId is required' });
  const offer = await getEconomicOffer(offerId).catch(() => null);
  if (!offer) return res.status(404).json({ error: 'Offer not found' });
  if (offer.status !== 'available') return res.status(409).json({ error: 'This offer is not currently available for review' });
  const db = await ensureCartTable();
  db.run(`INSERT INTO cart_items (id,phone,offer_id,title,seller,quantity,price_minor,currency,source,provenance,external_url,media_reference)
    VALUES (?,?,?,?,?,?,?,?,?,?,?,?) ON CONFLICT(phone,offer_id) DO UPDATE SET quantity=cart_items.quantity+excluded.quantity,status='review',request_id=NULL`, [
    crypto.randomUUID(), phone, offer.id, offer.description, offer.sellerPhone, Math.max(1, Number(req.body?.quantity) || 1), offer.priceMinor, offer.currency, offer.externalSource || offer.source, offer.provenance, offer.externalUrl, offer.mediaReference,
  ]);
  saveDb(); res.status(201).json({ success: true, message: 'Offer added to your review cart.', items: (await listItems(phone)) });
});

router.delete('/cart/items/:id', authenticateUser, async (req: AuthRequest, res) => {
  const phone = phoneFrom(req); if (!phone) return res.status(401).json({ error: 'Authenticated phone is required' });
  const db = await ensureCartTable(); db.run('DELETE FROM cart_items WHERE id=? AND phone=?', [String(req.params.id), phone]); saveDb(); res.json({ success: true, items: await listItems(phone) });
});

router.post('/cart/affiliate-click', authenticateUser, async (req: AuthRequest, res) => {
  const phone = phoneFrom(req); if (!phone) return res.status(401).json({ error: 'Authenticated phone is required' });
  const product = String(req.body?.product || '').trim(); if (!product) return res.status(400).json({ error: 'product is required' });
  const db = await getDb(); db.run('INSERT INTO affiliate_clicks (product) VALUES (?)', [`${phone}:${product}`]); saveDb(); res.json({ success: true });
});

router.post('/cart/checkout', authenticateUser, async (req: AuthRequest, res) => {
  const phone = phoneFrom(req); if (!phone) return res.status(401).json({ error: 'Authenticated phone is required' });
  const items = await listItems(phone); if (!items.length) return res.status(400).json({ error: 'Your review cart is empty' });
  const hasExternal = items.some((item: any) => item.external_url);
  if (hasExternal) return res.status(409).json({ success: false, affiliate_redirect_required: true, message: 'One or more items must be completed through the verified affiliate destination. No local payment has been taken.' });
  if (items.length !== 1) return res.status(409).json({ success: false, multi_item_review_required: true, message: 'Review one internal offer at a time so each request, quote, payment, and fulfilment state remains separately auditable.' });
  const item = items[0];
  const db = await ensureCartTable();
  if (item.request_id) return res.status(200).json({ success: true, economicRequestId: String(item.request_id), payment_required: true, payment_started: false, message: 'This offer is already connected to an Economic Request. A confirmed quote and verified payment reference are still required before fulfilment.' });
  try {
    const started = await startKnownOfferEconomicRequest({ buyerPhone: phone, offerId: String(item.offer_id), quantity: String(item.quantity || 1) });
    db.run('UPDATE cart_items SET request_id=? WHERE id=? AND phone=?', [started.request.id, item.id, phone]);
    saveDb();
    return res.status(201).json({ success: true, economicRequestId: started.request.id, payment_required: true, payment_started: false, message: 'Offer connected to a canonical Economic Request. Kurukoo has not taken payment; continue through quote review and the verified payment boundary.' });
  } catch (error) {
    return res.status(409).json({ success: false, error: error instanceof Error ? error.message : 'Unable to connect this offer to an Economic Request.' });
  }
});

async function listItems(phone: string) {
  const db = await ensureCartTable(); const stmt = db.prepare('SELECT * FROM cart_items WHERE phone=? AND status=? ORDER BY created_at DESC'); stmt.bind([phone, 'review']); const items: any[] = []; while (stmt.step()) items.push(stmt.getAsObject()); stmt.free(); return items;
}

export default router;
export { router as cartRoutes };

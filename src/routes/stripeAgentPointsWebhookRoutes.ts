/* Copyright (c) 2026 temeaco-max. All rights reserved. Proprietary and confidential. */
import { Router } from 'express';
import { getDb, saveDb } from '../database.js';
import { verifyStripeWebhook } from '../services/stripePayment.js';
import { settleCommercialEventByKey } from '../services/commercialSettlement.js';
import { settlePointsTopUp } from '../services/agentNetworkCommerce.js';

const router = Router();

router.post('/webhooks/stripe', async (req, res, next) => {
  const event = verifyStripeWebhook((req as any).rawBody as Buffer, req.header('stripe-signature'));
  if (!event) return next();
  const payment = event.data?.object;
  const economicRequestId = String(payment?.metadata?.economic_request_id || '');
  if (!economicRequestId.startsWith('agent_points_topup:')) return next();
  if (event.type !== 'payment_intent.succeeded' || payment?.status !== 'succeeded' || !payment?.id) return res.status(200).json({ received: true, ignored: true });
  const topUpId = economicRequestId.slice('agent_points_topup:'.length);
  const db = await getDb();
  db.run(`CREATE TABLE IF NOT EXISTS payment_webhook_events(provider TEXT NOT NULL,event_id TEXT NOT NULL,received_at TEXT DEFAULT CURRENT_TIMESTAMP,PRIMARY KEY(provider,event_id))`);
  const exists = db.prepare(`SELECT event_id FROM payment_webhook_events WHERE provider='stripe' AND event_id=?`);
  exists.bind([event.id]);
  const duplicate = exists.step();
  exists.free();
  if (duplicate) return res.status(200).json({ received: true, duplicate: true });
  db.run(`INSERT INTO payment_webhook_events(provider,event_id) VALUES ('stripe',?)`, [event.id]);
  saveDb();
  try {
    const topUpRows = db.exec('SELECT id,idempotency_key,status,fiat_amount_minor,currency FROM kurukoo_points_topups WHERE id=? LIMIT 1', [topUpId]);
    if (!topUpRows[0]?.values?.length) return res.status(404).json({ error: 'Points top-up not found.' });
    const row = topUpRows[0].values[0];
    const record = Object.fromEntries(topUpRows[0].columns.map((column: string, index: number) => [column, row[index]]));
    const amountMatches = Number(payment.amount || 0) === Number(record.fiat_amount_minor || 0);
    const currencyMatches = String(payment.currency || '').toLowerCase() === String(record.currency || '').toLowerCase();
    if (!amountMatches || !currencyMatches) return res.status(409).json({ error: 'Verified payment amount/currency does not match the Points top-up.' });
    const settled = await settleCommercialEventByKey(String(record.idempotency_key), String(payment.id), { stripeEventId: event.id, pointsTopUpId: topUpId });
    if (!settled) return res.status(200).json({ received: true, ignored: true });
    const result = await settlePointsTopUp(topUpId, String(payment.id));
    return res.status(200).json({ received: true, pointsCredited: result.points, commissionMinor: result.commissionMinor, stripePaymentIntentId: payment.id });
  } catch (error) {
    db.run(`DELETE FROM payment_webhook_events WHERE provider='stripe' AND event_id=?`, [event.id]);
    saveDb();
    return res.status(500).json({ error: error instanceof Error ? error.message : 'Agent Points payment reconciliation failed; retry is safe.' });
  }
});

export default router;

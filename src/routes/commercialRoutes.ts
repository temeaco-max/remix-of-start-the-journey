import { Router } from 'express';
import { authenticateAdmin, authenticateUser, type AuthRequest } from '../middleware/auth.js';
import { getDb } from '../database.js';
import { createStripePaymentIntent } from '../services/stripePayment.js';
import { ensureCommercialSchema, getCommercialRevenueSummary, recordCommercialEvent } from '../services/commercialLedger.js';

const router = Router();

router.get('/commercial/me', authenticateUser, async (req: AuthRequest, res) => {
  const phone = String(req.user?.phone || '');
  if (!phone) return res.status(401).json({ error: 'Authenticated owner is required.' });
  try { await ensureCommercialSchema(); const db = await getDb(); const stmt = db.prepare(`SELECT id,event_type,status,currency,gross_minor,platform_fee_minor,provider_amount_minor,processing_fee_minor,tax_minor,net_minor,payee,represented_party,agent_id,skill,economic_request_id,external_reference,created_at,settled_at FROM commercial_ledger WHERE payer=? OR represented_party=? ORDER BY id DESC LIMIT 100`); stmt.bind([phone,phone]); const rows:any[]=[]; while(stmt.step()) rows.push(stmt.getAsObject()); stmt.free(); res.json({ success:true, events:rows }); }
  catch (error) { res.status(500).json({ error: error instanceof Error ? error.message : 'Unable to load commercial activity.' }); }
});

router.post('/commercial/donations/intents', authenticateUser, async (req: AuthRequest, res) => {
  const phone = String(req.user?.phone || ''); const agentId = String(req.body?.agentId || '').trim(); const amountMinor = Math.floor(Number(req.body?.amountMinor || 0)); const currency = String(req.body?.currency || 'NGN').toUpperCase();
  if (!phone || !agentId || !Number.isSafeInteger(amountMinor) || amountMinor <= 0) return res.status(400).json({ error:'Authenticated owner, agentId and positive amountMinor are required.' });
  try {
    await ensureCommercialSchema(); const db=await getDb(); const stmt=db.prepare(`SELECT d.agent_id,d.owner_phone,d.skill,p.allow_donations,p.donation_recipient,d.status FROM agent_delegations d JOIN agent_permissions p ON p.delegation_id=d.id WHERE d.agent_id=? AND d.status='active'`); stmt.bind([agentId]);
    if(!stmt.step()){stmt.free();return res.status(404).json({error:'Donation-enabled agent not found.'});}
    const row=stmt.getAsObject() as any; stmt.free(); if(!Number(row.allow_donations)) return res.status(403).json({error:'This agent has not enabled donations/offering.'});
    const recipient=String(row.donation_recipient||'').trim(); if(!recipient) return res.status(409).json({error:'Donation recipient has not been canonically configured.'});
    const recipientStmt=db.prepare(`SELECT id FROM ai_agents WHERE id=? LIMIT 1`); recipientStmt.bind([recipient]); const knownAgent=recipientStmt.step(); recipientStmt.free(); if(recipient!==String(row.owner_phone) && !knownAgent) return res.status(409).json({error:'Donation recipient is not a canonical Kurukoo agent or represented owner.'});
    const idempotencyKey=`donation:${phone}:${agentId}:${Date.now()}`;
    const intent=await createStripePaymentIntent({ amountMinor, currency, economicRequestId:`commercial:${idempotencyKey}`, idempotencyKey:`kurukoo:${idempotencyKey}` });
    await recordCommercialEvent({ eventType:'donation',direction:'inbound',status:'authorized',currency,grossMinor:amountMinor,providerAmountMinor:amountMinor,payer:phone,payee:recipient,representedParty:recipient,agentId,skill:String(row.skill),externalReference:intent.id,idempotencyKey,metadata:{paymentIntentId:intent.id,recipient,allocation:'canonical-agent-recipient'} });
    res.json({ success:true, provider:'stripe', paymentIntentId:intent.id, clientSecret:intent.clientSecret, amountMinor:intent.amountMinor, currency:intent.currency, status:intent.status });
  } catch (error) { res.status(503).json({ error:error instanceof Error?error.message:'Donation payment provider unavailable.', payment_required:true }); }
});

router.get('/commercial/revenue/summary', authenticateAdmin, async (_req: AuthRequest, res) => {
  try { res.json({ success:true, ...(await getCommercialRevenueSummary()) }); }
  catch (error) { res.status(500).json({ error:error instanceof Error?error.message:'Unable to calculate revenue summary.' }); }
});

router.post('/commercial/affiliate/conversions', authenticateAdmin, async (req: AuthRequest, res) => {
  const partner=String(req.body?.partner||'').trim().slice(0,160); const conversionId=String(req.body?.conversionId||'').trim(); const commissionMinor=Math.floor(Number(req.body?.commissionMinor||0)); const currency=String(req.body?.currency||'NGN').toUpperCase(); const clickId=req.body?.clickId?String(req.body.clickId):null;
  if(!partner||!conversionId||!Number.isSafeInteger(commissionMinor)||commissionMinor<0) return res.status(400).json({error:'partner, conversionId and non-negative commissionMinor are required.'});
  try { await ensureCommercialSchema(); const db=await getDb(); db.run(`INSERT OR REPLACE INTO affiliate_conversions(id,partner,click_id,external_order_id,gross_minor,commission_minor,currency,status,settled_at) VALUES(?,?,?,?,?,?,?,?,?)`,[conversionId,partner,clickId,req.body?.externalOrderId?String(req.body.externalOrderId):null,Math.floor(Number(req.body?.grossMinor||0)),commissionMinor,currency,'settled',new Date().toISOString()]); await recordCommercialEvent({eventType:'affiliate_commission',direction:'inbound',status:'settled',currency,grossMinor:commissionMinor,platformFeeMinor:commissionMinor,payer:partner,payee:'KURUKOO',externalReference:conversionId,idempotencyKey:`affiliate:${partner}:${conversionId}`,metadata:{clickId,externalOrderId:req.body?.externalOrderId||null}}); res.status(201).json({success:true,conversionId,commissionMinor,currency}); }
  catch(error){res.status(500).json({error:error instanceof Error?error.message:'Unable to record affiliate conversion.'});}
});

export default router;

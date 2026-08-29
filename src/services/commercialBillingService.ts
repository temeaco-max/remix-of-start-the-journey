/* Copyright (c) 2026 temeaco-max. All rights reserved. Proprietary and confidential. */
import { getDb, saveDb } from '../database.js';
import { processDirectPayment } from './directWallet.js';
import { recordCommercialEvent, ensureCommercialSchema } from './commercialLedger.js';

export async function ensureCommercialBillingSchema(): Promise<void> {
  await ensureCommercialSchema(); const db=await getDb();
  db.run(`CREATE TABLE IF NOT EXISTS subscription_billing_state (owner_phone TEXT PRIMARY KEY, product_code TEXT NOT NULL, tier TEXT NOT NULL, price_minor INTEGER NOT NULL, currency TEXT NOT NULL, next_billing_date TEXT NOT NULL, status TEXT NOT NULL DEFAULT 'active', failure_count INTEGER NOT NULL DEFAULT 0, last_payment_reference TEXT, updated_at TEXT DEFAULT CURRENT_TIMESTAMP)`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_subscription_billing_due ON subscription_billing_state(status,next_billing_date)`);
  saveDb();
}

export async function upsertSubscriptionBilling(input:{ownerPhone:string;productCode:string;tier:string;priceMinor:number;currency:string;nextBillingDate:Date}):Promise<void>{await ensureCommercialBillingSchema();const db=await getDb();db.run(`INSERT INTO subscription_billing_state(owner_phone,product_code,tier,price_minor,currency,next_billing_date,status,failure_count,updated_at) VALUES(?,?,?,?,?,'${input.nextBillingDate.toISOString()}','active',0,CURRENT_TIMESTAMP) ON CONFLICT(owner_phone) DO UPDATE SET product_code=excluded.product_code,tier=excluded.tier,price_minor=excluded.price_minor,currency=excluded.currency,next_billing_date=excluded.next_billing_date,status='active',failure_count=0,updated_at=CURRENT_TIMESTAMP`,[input.ownerPhone,input.productCode,input.tier,input.priceMinor,input.currency]);saveDb();}

export async function runRecurringSubscriptionBillingPass():Promise<{attempted:number;renewed:number;failed:number}> {
  await ensureCommercialBillingSchema(); const db=await getDb(); const stmt=db.prepare(`SELECT owner_phone,product_code,tier,price_minor,currency,next_billing_date,failure_count FROM subscription_billing_state WHERE status='active' AND datetime(next_billing_date)<=datetime('now') ORDER BY next_billing_date ASC LIMIT 100`); const rows:any[]=[]; while(stmt.step()) rows.push(stmt.getAsObject()); stmt.free(); let attempted=0,renewed=0,failed=0;
  for(const row of rows){attempted++; const owner=String(row.owner_phone); const amount=Number(row.price_minor||0); const currency=String(row.currency||'NGN').toUpperCase(); if(amount<=0){renewed++; continue;} const paid=await processDirectPayment(owner,'SYSTEM',amount/100); if(paid){const next=new Date();next.setMonth(next.getMonth()+1);db.run(`UPDATE subscription_billing_state SET next_billing_date=?,status='active',failure_count=0,updated_at=CURRENT_TIMESTAMP WHERE owner_phone=?`,[next.toISOString(),owner]);await recordCommercialEvent({eventType:'subscription_charge',direction:'inbound',status:'settled',currency,grossMinor:amount,platformFeeMinor:amount,payer:owner,payee:'KURUKOO',representedParty:owner,externalReference:`renewal:${owner}:${next.toISOString()}`,idempotencyKey:`subscription:renewal:${owner}:${row.product_code}:${String(row.next_billing_date)}`,metadata:{tier:row.tier,productCode:row.product_code,billingPeriod:'monthly'}});renewed++;}else{const failures=Number(row.failure_count||0)+1;const status=failures>=3?'past_due':'active';db.run(`UPDATE subscription_billing_state SET status=?,failure_count=?,updated_at=CURRENT_TIMESTAMP WHERE owner_phone=?`,[status,failures,owner]);failed++;}}
  saveDb(); return {attempted,renewed,failed};
}

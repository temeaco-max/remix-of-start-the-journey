import { getDb, saveDb } from '../database.js';
import { ensureCommercialSchema } from './commercialLedger.js';

export async function settleCommercialEventByKey(idempotencyKey: string, externalReference: string, metadataPatch?: Record<string, unknown>): Promise<boolean> {
  await ensureCommercialSchema();
  const db = await getDb();
  const stmt = db.prepare(`SELECT id,status,metadata FROM commercial_ledger WHERE idempotency_key=? LIMIT 1`); stmt.bind([idempotencyKey]);
  if (!stmt.step()) { stmt.free(); return false; }
  const row = stmt.getAsObject() as any; stmt.free();
  if (['settled','refunded','reversed'].includes(String(row.status))) return true;
  let metadata: Record<string,unknown>={}; try { metadata=JSON.parse(String(row.metadata||'{}')); } catch {}
  metadata={...metadata,...(metadataPatch||{}),settlementVerified:true};
  db.run(`UPDATE commercial_ledger SET status='settled', external_reference=?, metadata=?, settled_at=CURRENT_TIMESTAMP WHERE id=?`, [externalReference, JSON.stringify(metadata), Number(row.id)]);
  saveDb(); return true;
}

export async function reverseCommercialEventByKey(idempotencyKey: string, reason: string): Promise<boolean> {
  await ensureCommercialSchema(); const db=await getDb(); const stmt=db.prepare(`SELECT id,status,metadata FROM commercial_ledger WHERE idempotency_key=? LIMIT 1`); stmt.bind([idempotencyKey]); if(!stmt.step()){stmt.free();return false;} const row=stmt.getAsObject() as any; stmt.free(); if(String(row.status)==='refunded')return true; let metadata:Record<string,unknown>={};try{metadata=JSON.parse(String(row.metadata||'{}'));}catch{} metadata={...metadata,reversalReason:String(reason).slice(0,500)}; db.run(`UPDATE commercial_ledger SET status='reversed',metadata=? WHERE id=?`,[JSON.stringify(metadata),Number(row.id)]);saveDb();return true;
}

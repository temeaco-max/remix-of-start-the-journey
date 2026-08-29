/* Copyright (c) 2026 temeaco-max. All rights reserved. Proprietary and confidential. */
import { getEconomicRequest, transitionEconomicRequest, type EconomicRequest } from './skillFlows.js';
import { getDb, saveDb } from '../database.js';

export interface CompoundLeg { id: string; skill: string; status: string; purpose: string; economicRequestId?: string; }

/**
 * Compound fulfilment keeps pickup/return/transfer/etc. attached to the same
 * user outcome. It creates durable child-leg records; each child still uses
 * the canonical provider/economic lifecycle rather than inventing a second
 * transaction system.
 */
export async function ensureCompoundFulfillmentSchema(): Promise<void> {
  const db = await getDb();
  db.run(`CREATE TABLE IF NOT EXISTS fulfillment_legs (
    id TEXT PRIMARY KEY,
    parent_request_id TEXT NOT NULL,
    skill TEXT NOT NULL,
    purpose TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending',
    requirements_json TEXT NOT NULL DEFAULT '{}',
    child_request_id TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(parent_request_id, skill, purpose)
  );`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_fulfillment_legs_parent ON fulfillment_legs(parent_request_id, status);`);
  saveDb();
}

export async function attachCompoundLeg(parentRequestId: string, skill: string, purpose: string, requirements: Record<string, unknown> = {}): Promise<CompoundLeg> {
  await ensureCompoundFulfillmentSchema();
  const parent = await getEconomicRequest(parentRequestId);
  if (!parent) throw new Error('Parent Economic Request not found');
  const db = await getDb();
  const id = `leg_${parentRequestId}_${skill}_${Date.now().toString(36)}`.replace(/[^a-zA-Z0-9_-]/g, '_');
  db.run(`INSERT OR IGNORE INTO fulfillment_legs(id,parent_request_id,skill,purpose,status,requirements_json) VALUES(?,?,?,?,?,?)`, [id,parentRequestId,skill,purpose,'pending',JSON.stringify(requirements)]);
  saveDb();
  return { id, skill, purpose, status: 'pending' };
}

export async function listCompoundLegs(parentRequestId: string): Promise<CompoundLeg[]> {
  await ensureCompoundFulfillmentSchema();
  const db = await getDb();
  const stmt = db.prepare(`SELECT id,skill,purpose,status,child_request_id FROM fulfillment_legs WHERE parent_request_id=? ORDER BY created_at`);
  stmt.bind([parentRequestId]); const rows: CompoundLeg[] = [];
  while (stmt.step()) { const row = stmt.getAsObject() as any; rows.push({ id:String(row.id), skill:String(row.skill), purpose:String(row.purpose), status:String(row.status), economicRequestId:row.child_request_id ? String(row.child_request_id) : undefined }); }
  stmt.free(); return rows;
}

export async function updateCompoundLegStatus(legId: string, status: 'pending'|'matched'|'reserved'|'in_fulfillment'|'fulfilled'|'failed'|'cancelled', childRequestId?: string): Promise<void> {
  await ensureCompoundFulfillmentSchema(); const db = await getDb();
  db.run(`UPDATE fulfillment_legs SET status=?, child_request_id=COALESCE(?,child_request_id), updated_at=CURRENT_TIMESTAMP WHERE id=?`, [status, childRequestId || null, legId]); saveDb();
}

export async function compoundOutcomeReady(parent: EconomicRequest): Promise<boolean> {
  const legs = await listCompoundLegs(parent.id);
  if (!legs.length) return true;
  return legs.every(leg => leg.status === 'fulfilled');
}

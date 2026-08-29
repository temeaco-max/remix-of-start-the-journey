/* Copyright (c) 2026 temeaco-max. All rights reserved. Proprietary and confidential. */
import { getDb, saveDb } from '../database.js';

export async function ensureAgentDonationPolicySchema(): Promise<void> {
  const db=await getDb();
  db.run(`CREATE TABLE IF NOT EXISTS agent_donation_policies(agent_id TEXT PRIMARY KEY,enabled INTEGER NOT NULL DEFAULT 0,recipient TEXT NOT NULL,recipient_type TEXT NOT NULL DEFAULT 'kurukoo',currency TEXT NOT NULL DEFAULT 'NGN',metadata TEXT NOT NULL DEFAULT '{}',updated_at TEXT DEFAULT CURRENT_TIMESTAMP)`);
  db.run(`INSERT OR IGNORE INTO agent_donation_policies(agent_id,enabled,recipient,recipient_type,currency,metadata) VALUES('agent_prayer_companion',1,'KURUKOO','kurukoo','NGN','{"purpose":"prayer_companion_support","firstClassProvider":true}')`);
  saveDb();
}

export async function getAgentDonationPolicy(agentId:string):Promise<any|null>{await ensureAgentDonationPolicySchema();const db=await getDb();const stmt=db.prepare(`SELECT agent_id,enabled,recipient,recipient_type,currency,metadata FROM agent_donation_policies WHERE agent_id=? LIMIT 1`);stmt.bind([agentId]);const row=stmt.step()?stmt.getAsObject():null;stmt.free();return row;}

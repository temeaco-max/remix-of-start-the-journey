import crypto from 'node:crypto';
import { getDb, saveDb } from '../database.js';
import { LEAD_CHARGES, deductPoints, getPointsBalance } from './pointsEngine.js';
import { ensureCommercialSchema, recordCommercialEvent } from './commercialLedger.js';

export type NetworkAgentType = 'pos' | 'sales' | 'referral' | 'field_support';

export interface NetworkAgent {
  id: string;
  phone: string;
  name: string;
  agentType: NetworkAgentType;
  country: string;
  region?: string;
  status: 'pending' | 'active' | 'suspended';
  commissionBps: number;
  canSellPoints: boolean;
  canAcceptTopUps: boolean;
  createdAt: string;
}

export interface PointsTopUpIntent {
  id: string;
  agentId?: string;
  customerPhone: string;
  points: number;
  fiatAmountMinor: number;
  currency: string;
  status: 'pending' | 'settled' | 'failed' | 'expired';
  idempotencyKey: string;
  createdAt: string;
}

function positiveInt(value: unknown): number {
  const n = Number(value);
  return Number.isSafeInteger(n) && n > 0 ? n : 0;
}

async function ensureSchema(): Promise<void> {
  const db = await getDb();
  db.run(`CREATE TABLE IF NOT EXISTS kurukoo_network_agents (
    id TEXT PRIMARY KEY,
    phone TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    agent_type TEXT NOT NULL,
    country TEXT NOT NULL DEFAULT 'ng',
    region TEXT NOT NULL DEFAULT '',
    status TEXT NOT NULL DEFAULT 'pending',
    commission_bps INTEGER NOT NULL DEFAULT 0,
    can_sell_points INTEGER NOT NULL DEFAULT 0,
    can_accept_topups INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  )`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_network_agents_status_type ON kurukoo_network_agents(status, agent_type)`);
  db.run(`CREATE TABLE IF NOT EXISTS kurukoo_points_topups (
    id TEXT PRIMARY KEY,
    agent_id TEXT,
    customer_phone TEXT NOT NULL,
    points INTEGER NOT NULL,
    fiat_amount_minor INTEGER NOT NULL,
    currency TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending',
    idempotency_key TEXT NOT NULL UNIQUE,
    external_reference TEXT,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  )`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_points_topups_customer ON kurukoo_points_topups(customer_phone, created_at DESC)`);
  saveDb();
}

export async function registerNetworkAgent(input: {
  phone: string;
  name: string;
  agentType?: NetworkAgentType;
  country?: string;
  region?: string;
  commissionBps?: number;
  canSellPoints?: boolean;
  canAcceptTopUps?: boolean;
}): Promise<NetworkAgent> {
  await ensureSchema();
  const phone = String(input.phone || '').trim();
  if (!phone || phone.startsWith('anon_')) throw new Error('Authenticated phone is required.');
  const name = String(input.name || '').trim().slice(0, 120) || 'Kurukoo Agent';
  const agentType = input.agentType || 'pos';
  const db = await getDb();
  const existing = db.prepare('SELECT * FROM kurukoo_network_agents WHERE phone=? LIMIT 1');
  existing.bind([phone]);
  const row = existing.step() ? existing.getAsObject() as any : null;
  existing.free();
  const id = row?.id ? String(row.id) : `ka_${crypto.randomUUID()}`;
  db.run(`INSERT INTO kurukoo_network_agents (id, phone, name, agent_type, country, region, status, commission_bps, can_sell_points, can_accept_topups, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
    ON CONFLICT(phone) DO UPDATE SET name=excluded.name, agent_type=excluded.agent_type, country=excluded.country, region=excluded.region, commission_bps=excluded.commission_bps, can_sell_points=excluded.can_sell_points, can_accept_topups=excluded.can_accept_topups, updated_at=CURRENT_TIMESTAMP`, [id, phone, name, agentType, String(input.country || 'ng').toLowerCase(), String(input.region || '').slice(0, 100), row ? String(row.status || 'pending') : 'pending', Math.max(0, Math.min(5000, Math.floor(Number(input.commissionBps || 0)))), input.canSellPoints === false ? 0 : 1, input.canAcceptTopUps === false ? 0 : 1]);
  saveDb();
  const current = db.exec('SELECT * FROM kurukoo_network_agents WHERE id=?', [id]);
  const columns = current[0]?.columns || [];
  const values = current[0]?.values?.[0] || [];
  const object = Object.fromEntries(columns.map((column: string, index: number) => [column, values[index]]));
  return {
    id,
    phone,
    name: String(object.name || name),
    agentType: String(object.agent_type || agentType) as NetworkAgentType,
    country: String(object.country || 'ng'),
    region: String(object.region || ''),
    status: String(object.status || 'pending') as NetworkAgent['status'],
    commissionBps: Number(object.commission_bps || 0),
    canSellPoints: Number(object.can_sell_points) === 1,
    canAcceptTopUps: Number(object.can_accept_topups) === 1,
    createdAt: String(object.created_at || new Date().toISOString()),
  };
}

export async function activateNetworkAgent(agentId: string): Promise<void> {
  await ensureSchema();
  const db = await getDb();
  db.run(`UPDATE kurukoo_network_agents SET status='active', updated_at=CURRENT_TIMESTAMP WHERE id=?`, [String(agentId)]);
  saveDb();
}

export async function getNetworkAgentByPhone(phone: string): Promise<NetworkAgent | null> {
  await ensureSchema();
  const db = await getDb();
  const rows = db.exec('SELECT * FROM kurukoo_network_agents WHERE phone=? LIMIT 1', [String(phone || '')]);
  if (!rows[0]?.values?.length) return null;
  const row = rows[0].values[0];
  const object = Object.fromEntries(rows[0].columns.map((column: string, index: number) => [column, row[index]]));
  return { id: String(object.id), phone: String(object.phone), name: String(object.name), agentType: String(object.agent_type) as NetworkAgentType, country: String(object.country), region: String(object.region || ''), status: String(object.status) as NetworkAgent['status'], commissionBps: Number(object.commission_bps || 0), canSellPoints: Number(object.can_sell_points) === 1, canAcceptTopUps: Number(object.can_accept_topups) === 1, createdAt: String(object.created_at) };
}

export async function createPointsTopUpIntent(input: { customerPhone: string; points: number; fiatAmountMinor: number; currency: string; agentId?: string; idempotencyKey?: string }): Promise<PointsTopUpIntent> {
  await ensureSchema();
  const points = positiveInt(input.points);
  const fiatAmountMinor = positiveInt(input.fiatAmountMinor);
  if (!input.customerPhone || !points || !fiatAmountMinor) throw new Error('Customer phone, points and a positive fiat amount are required.');
  const idempotencyKey = String(input.idempotencyKey || `points_topup:${input.customerPhone}:${points}:${Date.now()}`).slice(0, 220);
  const db = await getDb();
  const existing = db.exec('SELECT * FROM kurukoo_points_topups WHERE idempotency_key=? LIMIT 1', [idempotencyKey]);
  if (existing[0]?.values?.length) {
    const row = existing[0].values[0];
    const object = Object.fromEntries(existing[0].columns.map((column: string, index: number) => [column, row[index]]));
    return { id: String(object.id), agentId: object.agent_id ? String(object.agent_id) : undefined, customerPhone: String(object.customer_phone), points: Number(object.points), fiatAmountMinor: Number(object.fiat_amount_minor), currency: String(object.currency), status: String(object.status) as PointsTopUpIntent['status'], idempotencyKey: String(object.idempotency_key), createdAt: String(object.created_at) };
  }
  const id = `ptu_${crypto.randomUUID()}`;
  db.run(`INSERT INTO kurukoo_points_topups (id, agent_id, customer_phone, points, fiat_amount_minor, currency, status, idempotency_key) VALUES (?, ?, ?, ?, ?, ?, 'pending', ?)`, [id, input.agentId || null, input.customerPhone, points, fiatAmountMinor, String(input.currency || 'NGN').toUpperCase(), idempotencyKey]);
  await ensureCommercialSchema();
  await recordCommercialEvent({ eventType: 'points_purchase', direction: 'inbound', status: 'pending', currency: String(input.currency || 'NGN').toUpperCase(), grossMinor: fiatAmountMinor, platformFeeMinor: fiatAmountMinor, providerAmountMinor: 0, payer: input.customerPhone, payee: 'KURUKOO', representedParty: input.customerPhone, agentId: input.agentId, idempotencyKey, metadata: { points, agentId: input.agentId || null, topUpId: id } });
  saveDb();
  return { id, agentId: input.agentId, customerPhone: input.customerPhone, points, fiatAmountMinor, currency: String(input.currency || 'NGN').toUpperCase(), status: 'pending', idempotencyKey, createdAt: new Date().toISOString() };
}

export async function settlePointsTopUp(id: string, externalReference: string): Promise<{ success: boolean; points: number; commissionMinor: number }> {
  await ensureSchema();
  const db = await getDb();
  const rows = db.exec('SELECT * FROM kurukoo_points_topups WHERE id=? LIMIT 1', [String(id)]);
  if (!rows[0]?.values?.length) throw new Error('Points top-up not found.');
  const row = rows[0].values[0];
  const object = Object.fromEntries(rows[0].columns.map((column: string, index: number) => [column, row[index]]));
  if (String(object.status) === 'settled') return { success: true, points: Number(object.points), commissionMinor: 0 };
  const agentId = object.agent_id ? String(object.agent_id) : '';
  const agent = agentId ? await getNetworkAgentByPhone((db.exec('SELECT phone FROM kurukoo_network_agents WHERE id=? LIMIT 1', [agentId])[0]?.values?.[0]?.[0] as string) || '') : null;
  const commissionMinor = agent ? Math.floor(Number(object.fiat_amount_minor) * agent.commissionBps / 10000) : 0;
  await import('./pointsEngine.js').then(({ addPoints }) => addPoints(String(object.customer_phone), Number(object.points), `Points top-up${agent ? ` via ${agent.name}` : ''}`));
  db.run(`UPDATE kurukoo_points_topups SET status='settled', external_reference=?, updated_at=CURRENT_TIMESTAMP WHERE id=?`, [String(externalReference || '').slice(0, 220), id]);
  await recordCommercialEvent({ eventType: 'points_purchase', direction: 'inbound', status: 'settled', currency: String(object.currency), grossMinor: Number(object.fiat_amount_minor), platformFeeMinor: Number(object.fiat_amount_minor) - commissionMinor, providerAmountMinor: commissionMinor, payer: String(object.customer_phone), payee: agent?.phone || 'KURUKOO', representedParty: agent?.phone || String(object.customer_phone), agentId: agent?.id, externalReference: String(externalReference || ''), idempotencyKey: String(object.idempotency_key), metadata: { points: Number(object.points), topUpId: id, commissionMinor } });
  saveDb();
  return { success: true, points: Number(object.points), commissionMinor };
}

export async function chargeProviderLead(input: { providerPhone: string; category?: string; skill?: string; requestId?: string }): Promise<{ success: boolean; chargedPoints: number; remainingPoints: number; grace?: boolean }> {
  const category = String(input.category || '').trim().toLowerCase();
  const skill = String(input.skill || '').trim().toLowerCase();
  const chargedPoints = LEAD_CHARGES[category] ?? LEAD_CHARGES[skill] ?? LEAD_CHARGES.professional;
  const result = await deductPoints(input.providerPhone, chargedPoints, `Provider lead${input.requestId ? ` for ${input.requestId}` : ''} (${skill || category || 'professional'})`, true);
  return { success: result.success, chargedPoints: result.success ? chargedPoints : 0, remainingPoints: Number(result.remainingPoints || 0), grace: result.isGrace };
}

export async function getProviderLeadCost(category?: string, skill?: string): Promise<number> {
  const normalizedCategory = String(category || '').trim().toLowerCase();
  const normalizedSkill = String(skill || '').trim().toLowerCase();
  return LEAD_CHARGES[normalizedCategory] ?? LEAD_CHARGES[normalizedSkill] ?? LEAD_CHARGES.professional;
}

export async function getAgentNetworkSummary(): Promise<{ activePosAgents: number; totalAgents: number; pendingAgents: number }> {
  await ensureSchema();
  const db = await getDb();
  const rows = db.exec(`SELECT COUNT(*) AS total, SUM(CASE WHEN status='active' THEN 1 ELSE 0 END) AS active, SUM(CASE WHEN status='pending' THEN 1 ELSE 0 END) AS pending FROM kurukoo_network_agents`);
  const row = rows[0]?.values?.[0] || [0, 0, 0];
  return { totalAgents: Number(row[0] || 0), activePosAgents: Number(row[1] || 0), pendingAgents: Number(row[2] || 0) };
}

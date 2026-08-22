import crypto from 'node:crypto';
import { getDb, saveDb } from '../database.js';
import { normalizeProviderEntityType, type ProviderEntityType } from './providerEntity.js';

export type ProviderVerificationState = 'draft' | 'submitted' | 'review' | 'verified' | 'rejected' | 'suspended' | 'expired';

export interface ProviderVerificationRecord {
  providerPhone: string;
  entityType: ProviderEntityType;
  state: ProviderVerificationState;
  evidence: string[];
  reviewerId?: string;
  reviewedAt?: string;
  expiresAt?: string;
  reason?: string;
  createdAt: string;
  updatedAt: string;
}

async function ensureSchema() {
  const db = await getDb();
  db.run(`CREATE TABLE IF NOT EXISTS provider_verification (
    provider_phone TEXT PRIMARY KEY,
    entity_type TEXT NOT NULL DEFAULT 'human',
    state TEXT NOT NULL DEFAULT 'draft',
    evidence_json TEXT NOT NULL DEFAULT '[]',
    reviewer_id TEXT,
    reviewed_at TEXT,
    expires_at TEXT,
    reason TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP
  )`);
  db.run('CREATE INDEX IF NOT EXISTS idx_provider_verification_state ON provider_verification(state, updated_at DESC)');
  return db;
}

function parseEvidence(value: unknown): string[] {
  try { const parsed = JSON.parse(String(value || '[]')); return Array.isArray(parsed) ? parsed.map(String).slice(0, 50) : []; } catch { return []; }
}

function fromRow(row: any): ProviderVerificationRecord {
  return {
    providerPhone: String(row.provider_phone),
    entityType: normalizeProviderEntityType(row.entity_type),
    state: String(row.state) as ProviderVerificationState,
    evidence: parseEvidence(row.evidence_json),
    reviewerId: row.reviewer_id ? String(row.reviewer_id) : undefined,
    reviewedAt: row.reviewed_at ? String(row.reviewed_at) : undefined,
    expiresAt: row.expires_at ? String(row.expires_at) : undefined,
    reason: row.reason ? String(row.reason) : undefined,
    createdAt: String(row.created_at || ''),
    updatedAt: String(row.updated_at || ''),
  };
}

export async function ensureProviderVerification(providerPhone: string, entityType: unknown = 'human'): Promise<ProviderVerificationRecord> {
  const phone = String(providerPhone || '').trim();
  if (!phone) throw new Error('provider phone is required');
  const db = await ensureSchema();
  const normalizedType = normalizeProviderEntityType(entityType);
  db.run(`INSERT OR IGNORE INTO provider_verification(provider_phone, entity_type, state) VALUES(?, ?, 'draft')`, [phone, normalizedType]);
  db.run(`UPDATE provider_verification SET entity_type=?, updated_at=CURRENT_TIMESTAMP WHERE provider_phone=?`, [normalizedType, phone]);
  saveDb();
  const statement = db.prepare('SELECT * FROM provider_verification WHERE provider_phone=? LIMIT 1');
  statement.bind([phone]);
  const object = statement.step() ? statement.getAsObject() as any : null;
  statement.free();
  if (!object) throw new Error('Provider verification could not be loaded');
  return fromRow(object);
}

export async function submitProviderVerification(input: { providerPhone: string; entityType?: unknown; evidence: string[] }): Promise<ProviderVerificationRecord> {
  const current = await ensureProviderVerification(input.providerPhone, input.entityType);
  if (['verified', 'suspended'].includes(current.state)) return current;
  const evidence = Array.from(new Set((input.evidence || []).map(String).map(v => v.trim()).filter(Boolean))).slice(0, 50);
  const db = await ensureSchema();
  db.run(`UPDATE provider_verification SET state=?, evidence_json=?, reason=NULL, updated_at=CURRENT_TIMESTAMP WHERE provider_phone=?`, [evidence.length ? 'submitted' : 'draft', JSON.stringify(evidence), current.providerPhone]);
  saveDb();
  return (await getProviderVerification(current.providerPhone))!;
}

export async function reviewProviderVerification(input: { providerPhone: string; reviewerId: string; decision: 'verified' | 'rejected' | 'suspended'; reason?: string; expiresAt?: string }): Promise<ProviderVerificationRecord> {
  const current = await ensureProviderVerification(input.providerPhone);
  const reviewerId = String(input.reviewerId || '').trim();
  if (!reviewerId) throw new Error('reviewer identity is required');
  if (!['submitted', 'review', 'verified', 'rejected', 'suspended'].includes(current.state)) throw new Error(`provider verification cannot be reviewed from ${current.state}`);
  const db = await ensureSchema();
  const expiresAt = input.decision === 'verified' ? (input.expiresAt || new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString()) : null;
  db.run(`UPDATE provider_verification SET state=?, reviewer_id=?, reviewed_at=CURRENT_TIMESTAMP, expires_at=?, reason=?, updated_at=CURRENT_TIMESTAMP WHERE provider_phone=?`, [input.decision, reviewerId, expiresAt, input.reason ? String(input.reason).slice(0, 500) : null, current.providerPhone]);
  // Provider discovery is only allowed to use canonical verified_provider state.
  if (input.decision === 'verified') db.run(`UPDATE memory_profiles SET verified_provider=1, updated_at=CURRENT_TIMESTAMP WHERE phone=?`, [current.providerPhone]);
  else if (input.decision === 'suspended' || input.decision === 'rejected') db.run(`UPDATE memory_profiles SET verified_provider=0, updated_at=CURRENT_TIMESTAMP WHERE phone=?`, [current.providerPhone]);
  saveDb();
  return (await getProviderVerification(current.providerPhone))!;
}

export async function getProviderVerification(providerPhone: string): Promise<ProviderVerificationRecord | null> {
  const db = await ensureSchema();
  const stmt = db.prepare('SELECT * FROM provider_verification WHERE provider_phone=? LIMIT 1'); stmt.bind([String(providerPhone)]);
  const row = stmt.step() ? stmt.getAsObject() as any : null; stmt.free();
  return row ? fromRow(row) : null;
}

export async function listProviderVerifications(state?: ProviderVerificationState, limit = 50): Promise<ProviderVerificationRecord[]> {
  const db = await ensureSchema();
  const safeLimit = Math.max(1, Math.min(200, Math.floor(Number(limit) || 50)));
  const stmt = state ? db.prepare('SELECT * FROM provider_verification WHERE state=? ORDER BY updated_at DESC LIMIT ?') : db.prepare('SELECT * FROM provider_verification ORDER BY updated_at DESC LIMIT ?');
  stmt.bind(state ? [state, safeLimit] : [safeLimit]);
  const rows: ProviderVerificationRecord[] = [];
  while (stmt.step()) rows.push(fromRow(stmt.getAsObject()));
  stmt.free();
  return rows;
}

export async function expireProviderVerifications(now = new Date()): Promise<number> {
  const db = await ensureSchema();
  db.run(`UPDATE provider_verification SET state='expired', updated_at=CURRENT_TIMESTAMP WHERE state='verified' AND expires_at IS NOT NULL AND expires_at <= ?`, [now.toISOString()]);
  const count = db.getRowsModified();
  if (count) db.run(`UPDATE memory_profiles SET verified_provider=0, updated_at=CURRENT_TIMESTAMP WHERE phone IN (SELECT provider_phone FROM provider_verification WHERE state='expired')`);
  if (count) saveDb();
  return count;
}

export function createProviderVerificationEvidenceToken(providerPhone: string): string {
  return crypto.createHash('sha256').update(`${providerPhone}:${process.env.KURUKOO_DATASET_VERSION || 'kurukoo-core-v1'}`).digest('hex').slice(0, 32);
}

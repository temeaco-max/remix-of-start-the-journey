import crypto from 'node:crypto';
import { getDb, saveDb } from '../database.js';

export interface FcmDevice {
  id: number;
  phone: string;
  deviceId: string;
  token: string;
  platform: string;
  credentialType: string;
  label?: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
  lastAcceptedAt?: string;
  lastError?: string;
}

async function ensureTable() {
  const db = await getDb();
  db.run(`CREATE TABLE IF NOT EXISTS fcm_devices (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    phone TEXT NOT NULL,
    device_id TEXT NOT NULL,
    token TEXT NOT NULL,
    platform TEXT NOT NULL DEFAULT 'unknown',
    credential_type TEXT NOT NULL DEFAULT 'fcm',
    label TEXT,
    active INTEGER NOT NULL DEFAULT 1,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    last_accepted_at TEXT,
    last_error TEXT,
    UNIQUE(phone, device_id)
  )`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_fcm_devices_phone_active ON fcm_devices(phone, active, updated_at)`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_fcm_devices_token ON fcm_devices(token)`);
  return db;
}

function fallbackDeviceId(token: string): string {
  return `token-${crypto.createHash('sha256').update(token).digest('hex').slice(0, 32)}`;
}

function parseStoredTokens(value: unknown): string[] {
  const raw = String(value || '').trim();
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) return parsed.map(item => String(item || '').trim()).filter(Boolean);
  } catch {
    // Legacy single-token format.
  }
  return [raw];
}

async function syncLegacyProfileToken(db: any, phone: string): Promise<void> {
  const rows = db.exec(`SELECT token FROM fcm_devices WHERE phone=? AND active=1 ORDER BY updated_at DESC`, [phone])[0]?.values || [];
  const tokens = rows.map((row: any[]) => String(row[0] || '').trim()).filter(Boolean).slice(0, 20);
  const serialized = tokens.length === 0 ? null : tokens.length === 1 ? tokens[0] : JSON.stringify(tokens);
  db.run(`UPDATE memory_profiles SET fcm_token=?, updated_at=CURRENT_TIMESTAMP WHERE phone=?`, [serialized, phone]);
}

export async function registerFcmDevice(input: {
  phone: string;
  token: string;
  deviceId?: string;
  platform?: string;
  credentialType?: string;
  label?: string;
}): Promise<{ deviceId: string; activeDevices: number }> {
  const db = await ensureTable();
  const phone = String(input.phone || '').trim();
  const token = String(input.token || '').trim();
  const deviceId = String(input.deviceId || fallbackDeviceId(token)).trim().slice(0, 160);
  if (!phone || !token) throw new Error('phone and token are required');
  db.run(`INSERT INTO fcm_devices (phone, device_id, token, platform, credential_type, label, active, updated_at, last_error)
    VALUES (?, ?, ?, ?, ?, ?, 1, CURRENT_TIMESTAMP, NULL)
    ON CONFLICT(phone, device_id) DO UPDATE SET token=excluded.token, platform=excluded.platform, credential_type=excluded.credential_type, label=excluded.label, active=1, updated_at=CURRENT_TIMESTAMP, last_error=NULL`, [
    phone, deviceId, token, String(input.platform || 'unknown').slice(0, 40), String(input.credentialType || 'fcm').slice(0, 60), input.label ? String(input.label).slice(0, 160) : null,
  ]);
  await syncLegacyProfileToken(db, phone);
  saveDb();
  const count = db.exec(`SELECT COUNT(*) FROM fcm_devices WHERE phone = ? AND active = 1`, [phone])[0]?.values?.[0]?.[0];
  return { deviceId, activeDevices: Number(count || 0) };
}

export async function listFcmDevices(phone: string): Promise<FcmDevice[]> {
  const db = await ensureTable();
  const stmt = db.prepare(`SELECT id, phone, device_id, token, platform, credential_type, label, active, created_at, updated_at, last_accepted_at, last_error FROM fcm_devices WHERE phone = ? AND active = 1 ORDER BY updated_at DESC`);
  stmt.bind([phone]);
  const rows: FcmDevice[] = [];
  while (stmt.step()) {
    const row = stmt.getAsObject() as any;
    rows.push({ id: Number(row.id), phone: String(row.phone), deviceId: String(row.device_id), token: String(row.token), platform: String(row.platform), credentialType: String(row.credential_type), label: row.label ? String(row.label) : undefined, active: Number(row.active) === 1, createdAt: String(row.created_at), updatedAt: String(row.updated_at), lastAcceptedAt: row.last_accepted_at ? String(row.last_accepted_at) : undefined, lastError: row.last_error ? String(row.last_error) : undefined });
  }
  stmt.free();
  return rows;
}

export async function markFcmDeviceAccepted(phone: string, deviceId: string): Promise<void> {
  const db = await ensureTable();
  db.run(`UPDATE fcm_devices SET last_accepted_at=CURRENT_TIMESTAMP, last_error=NULL, updated_at=CURRENT_TIMESTAMP WHERE phone=? AND device_id=?`, [phone, deviceId]);
  if (db.getRowsModified() > 0) saveDb();
}

export async function markFcmDeviceFailure(phone: string, deviceId: string, error: string, deactivate = false): Promise<void> {
  const db = await ensureTable();
  db.run(`UPDATE fcm_devices SET last_error=?, active=CASE WHEN ?=1 THEN 0 ELSE active END, updated_at=CURRENT_TIMESTAMP WHERE phone=? AND device_id=?`, [String(error || 'fcm_failure').slice(0, 240), deactivate ? 1 : 0, phone, deviceId]);
  await syncLegacyProfileToken(db, phone);
  if (db.getRowsModified() > 0) saveDb();
}

export async function deactivateFcmToken(token: string, error = 'device_token_unregistered'): Promise<number> {
  const db = await ensureTable();
  const phones = db.exec(`SELECT DISTINCT phone FROM fcm_devices WHERE token=? AND active=1`, [token])[0]?.values?.map((row: any[]) => String(row[0] || '').trim()).filter(Boolean) || [];
  db.run(`UPDATE fcm_devices SET active=0, last_error=?, updated_at=CURRENT_TIMESTAMP WHERE token=? AND active=1`, [String(error).slice(0, 240), token]);
  for (const phone of phones) await syncLegacyProfileToken(db, phone);
  if (phones.length || db.getRowsModified() > 0) saveDb();
  return phones.length;
}

export function parseFcmTokenCollection(value: unknown): string[] {
  return parseStoredTokens(value).slice(0, 20);
}

export async function countFcmDevices(): Promise<number> {
  const db = await ensureTable();
  return Number(db.exec(`SELECT COUNT(*) FROM fcm_devices WHERE active=1`)[0]?.values?.[0]?.[0] || 0);
}

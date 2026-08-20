import crypto from 'node:crypto';
import { getDb, saveDb } from '../database.js';
import { generateProxyNumber, getProxyForPhone, releaseProxyNumber, getPrivacyBridgeStatus } from './privacyBridge.js';
import { createWebRTCRoom, destroyWebRTCRoom, getWebRTCStatus } from './webrtcSignalling.js';

export type ProviderCommunicationState = 'created' | 'ringing' | 'connected' | 'provider_en_route' | 'arrived' | 'in_progress' | 'completed' | 'ended' | 'failed';
export type ProviderCommunicationMode = 'masked_call' | 'webrtc_tracking' | 'both';

export interface ProviderCommunicationSession {
  id: string;
  economicRequestId?: string;
  customerPhone: string;
  providerPhone: string;
  proxyPhone?: string;
  mode: ProviderCommunicationMode;
  state: ProviderCommunicationState;
  roomId?: string;
  lastLatitude?: number;
  lastLongitude?: number;
  lastLocationAt?: string;
  createdAt: string;
  updatedAt: string;
}

async function ensureSchema(): Promise<void> {
  const db = await getDb();
  db.run(`CREATE TABLE IF NOT EXISTS provider_communication_sessions (
    id TEXT PRIMARY KEY,
    economic_request_id TEXT,
    customer_phone TEXT NOT NULL,
    provider_phone TEXT NOT NULL,
    proxy_phone TEXT,
    mode TEXT NOT NULL,
    state TEXT NOT NULL DEFAULT 'created',
    room_id TEXT,
    last_latitude REAL,
    last_longitude REAL,
    last_location_at TEXT,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  )`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_provider_communication_request ON provider_communication_sessions(economic_request_id, updated_at DESC)`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_provider_communication_parties ON provider_communication_sessions(customer_phone, provider_phone, state)`);
  saveDb();
}

function rowToSession(row: Record<string, unknown>): ProviderCommunicationSession {
  return {
    id: String(row.id),
    economicRequestId: row.economic_request_id ? String(row.economic_request_id) : undefined,
    customerPhone: String(row.customer_phone),
    providerPhone: String(row.provider_phone),
    proxyPhone: row.proxy_phone ? String(row.proxy_phone) : undefined,
    mode: String(row.mode) as ProviderCommunicationMode,
    state: String(row.state) as ProviderCommunicationState,
    roomId: row.room_id ? String(row.room_id) : undefined,
    lastLatitude: row.last_latitude !== null && row.last_latitude !== undefined ? Number(row.last_latitude) : undefined,
    lastLongitude: row.last_longitude !== null && row.last_longitude !== undefined ? Number(row.last_longitude) : undefined,
    lastLocationAt: row.last_location_at ? String(row.last_location_at) : undefined,
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at),
  };
}

export async function createProviderCommunicationSession(input: {
  customerPhone: string;
  providerPhone: string;
  economicRequestId?: string;
  mode?: ProviderCommunicationMode;
}): Promise<ProviderCommunicationSession> {
  await ensureSchema();
  const customerPhone = String(input.customerPhone || '').trim();
  const providerPhone = String(input.providerPhone || '').trim();
  if (!customerPhone || !providerPhone || customerPhone.startsWith('anon_')) throw new Error('Authenticated customer and provider phones are required.');
  const mode = input.mode || 'both';
  const id = `pcs_${crypto.randomUUID()}`;
  let proxyPhone: string | undefined;
  let roomId: string | undefined;
  if (mode === 'masked_call' || mode === 'both') proxyPhone = await generateProxyNumber(providerPhone, `provider:${input.economicRequestId || id}`);
  if (mode === 'webrtc_tracking' || mode === 'both') {
    if (getWebRTCStatus().enabled) {
      roomId = `provider-session:${id}`;
      createWebRTCRoom(roomId, customerPhone);
    }
  }
  const db = await getDb();
  db.run(`INSERT INTO provider_communication_sessions (id, economic_request_id, customer_phone, provider_phone, proxy_phone, mode, state, room_id) VALUES (?, ?, ?, ?, ?, ?, 'created', ?)`, [id, input.economicRequestId || null, customerPhone, providerPhone, proxyPhone || null, mode, roomId || null]);
  saveDb();
  return { id, economicRequestId: input.economicRequestId, customerPhone, providerPhone, proxyPhone, mode, state: 'created', roomId, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
}

export async function getProviderCommunicationSession(id: string): Promise<ProviderCommunicationSession | null> {
  await ensureSchema();
  const db = await getDb();
  const rows = db.exec('SELECT * FROM provider_communication_sessions WHERE id=? LIMIT 1', [String(id || '')]);
  if (!rows[0]?.values?.length) return null;
  return rowToSession(Object.fromEntries(rows[0].columns.map((column: string, index: number) => [column, rows[0].values[0][index]])));
}

export async function updateProviderCommunicationState(id: string, state: ProviderCommunicationState): Promise<ProviderCommunicationSession> {
  await ensureSchema();
  const allowed = new Set<ProviderCommunicationState>(['created', 'ringing', 'connected', 'provider_en_route', 'arrived', 'in_progress', 'completed', 'ended', 'failed']);
  if (!allowed.has(state)) throw new Error('Unsupported provider communication state.');
  const db = await getDb();
  db.run('UPDATE provider_communication_sessions SET state=?,updated_at=CURRENT_TIMESTAMP WHERE id=?', [state, id]);
  saveDb();
  const session = await getProviderCommunicationSession(id);
  if (!session) throw new Error('Provider communication session not found.');
  return session;
}

export async function recordProviderLocation(id: string, latitude: number, longitude: number): Promise<ProviderCommunicationSession> {
  await ensureSchema();
  if (!Number.isFinite(latitude) || latitude < -90 || latitude > 90 || !Number.isFinite(longitude) || longitude < -180 || longitude > 180) throw new Error('Valid coordinates are required.');
  const db = await getDb();
  db.run('UPDATE provider_communication_sessions SET last_latitude=?,last_longitude=?,last_location_at=CURRENT_TIMESTAMP,updated_at=CURRENT_TIMESTAMP,state=CASE WHEN state IN (\'created\',\'ringing\',\'connected\',\'provider_en_route\') THEN \'provider_en_route\' ELSE state END WHERE id=?', [latitude, longitude, id]);
  saveDb();
  const session = await getProviderCommunicationSession(id);
  if (!session) throw new Error('Provider communication session not found.');
  return session;
}

export async function endProviderCommunicationSession(id: string): Promise<ProviderCommunicationSession> {
  await ensureSchema();
  const session = await getProviderCommunicationSession(id);
  if (!session) throw new Error('Provider communication session not found.');
  if (session.roomId) destroyWebRTCRoom(session.roomId);
  if (session.proxyPhone) await releaseProxyNumber(session.proxyPhone).catch(() => false);
  return updateProviderCommunicationState(id, 'ended');
}

export function getProviderCommunicationStatus(): { maskedCall: ReturnType<typeof getPrivacyBridgeStatus>; webrtc: ReturnType<typeof getWebRTCStatus> } {
  return { maskedCall: getPrivacyBridgeStatus(), webrtc: getWebRTCStatus() };
}

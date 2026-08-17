import crypto from 'node:crypto';
import { getDb, saveDb } from '../database.js';
import { sendMqttCommand } from './iotBridge.js';

export type ConnectedResourceKind = 'phone' | 'tv' | 'cctv' | 'camera' | 'laptop' | 'desktop' | 'tablet' | 'vehicle' | 'iot' | 'other';
export type ConnectedResourceProtocol = 'mqtt' | 'stream' | 'webrtc' | 'http' | 'custom';

export interface ConnectedResource {
  id: string;
  phone: string;
  kind: ConnectedResourceKind;
  label: string;
  vendor?: string;
  protocol: ConnectedResourceProtocol;
  capabilities: string[];
  metadata: Record<string, unknown>;
  viewUrl?: string;
  streamUrl?: string;
  status: 'active' | 'pending' | 'revoked';
  createdAt: string;
  lastSeenAt: string;
}

export interface ConnectedResourceChallenge { id: string; resourceId: string; code: string; expiresAt: string; }

async function ensureSchema(): Promise<void> {
  const db = await getDb();
  db.run(`
    CREATE TABLE IF NOT EXISTS connected_resources (
      id TEXT PRIMARY KEY,
      phone TEXT NOT NULL,
      kind TEXT NOT NULL,
      label TEXT NOT NULL,
      vendor TEXT,
      protocol TEXT NOT NULL,
      capabilities_json TEXT NOT NULL DEFAULT '[]',
      metadata_json TEXT NOT NULL DEFAULT '{}',
      view_url TEXT,
      stream_url TEXT,
      status TEXT NOT NULL DEFAULT 'pending',
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      last_seen_at TEXT DEFAULT CURRENT_TIMESTAMP,
      revoked_at TEXT
    );
    CREATE INDEX IF NOT EXISTS idx_connected_resources_phone_status ON connected_resources(phone, status, last_seen_at);
    CREATE INDEX IF NOT EXISTS idx_connected_resources_phone_label ON connected_resources(phone, label, status);
    CREATE TABLE IF NOT EXISTS connected_resource_challenges (
      id TEXT PRIMARY KEY,
      resource_id TEXT NOT NULL,
      phone TEXT NOT NULL,
      code_hash TEXT NOT NULL,
      expires_at TEXT NOT NULL,
      consumed_at TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );
    CREATE INDEX IF NOT EXISTS idx_connected_resource_challenges_resource ON connected_resource_challenges(resource_id, phone, consumed_at, expires_at);
  `);
}

function safeJson(value: unknown, fallback: unknown): unknown {
  try { return typeof value === 'string' ? JSON.parse(value) : value ?? fallback; } catch { return fallback; }
}

function rowToResource(row: any[]): ConnectedResource {
  const parsedCapabilities = safeJson(row[6], []);
  const parsedMetadata = safeJson(row[7], {});
  return {
    id: String(row[0]), phone: String(row[1]), kind: String(row[2]) as ConnectedResourceKind,
    label: String(row[3]), vendor: row[4] ? String(row[4]) : undefined,
    protocol: String(row[5]) as ConnectedResourceProtocol,
    capabilities: Array.isArray(parsedCapabilities) ? (parsedCapabilities as unknown[]).map(String) : [],
    metadata: parsedMetadata && typeof parsedMetadata === 'object' ? parsedMetadata as Record<string, unknown> : {},
    viewUrl: row[8] ? String(row[8]) : undefined,
    streamUrl: row[9] ? String(row[9]) : undefined,
    status: String(row[10] || 'pending') as ConnectedResource['status'],
    createdAt: String(row[11] || ''), lastSeenAt: String(row[12] || ''),
  };
}

function hashChallenge(code: string): string {
  return crypto.createHash('sha256').update(code).digest('hex');
}

function makePairingCode(): string {
  return String(crypto.randomInt(100000, 999999));
}

export async function registerConnectedResource(input: {
  phone: string;
  kind: ConnectedResourceKind;
  label: string;
  vendor?: string;
  protocol?: ConnectedResourceProtocol;
  capabilities?: string[];
  metadata?: Record<string, unknown>;
  viewUrl?: string;
  streamUrl?: string;
}): Promise<{ resource: ConnectedResource; challenge: ConnectedResourceChallenge }> {
  await ensureSchema();
  const db = await getDb();
  const phone = String(input.phone || '').trim();
  const id = `conn_${crypto.randomUUID()}`;
  const capabilities = [...new Set((input.capabilities || []).map(item => String(item).trim()).filter(Boolean))].slice(0, 64);
  const metadata = input.metadata || {};
  db.run(`INSERT INTO connected_resources(id, phone, kind, label, vendor, protocol, capabilities_json, metadata_json, view_url, stream_url, status)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending')`, [
    id, phone, input.kind, String(input.label || '').slice(0, 160), String(input.vendor || '').slice(0, 120) || null,
    input.protocol || 'custom', JSON.stringify(capabilities), JSON.stringify(metadata),
    String(input.viewUrl || '').slice(0, 2048) || null, String(input.streamUrl || '').slice(0, 2048) || null,
  ]);
  saveDb();
  const challenge = await issueConnectedResourceChallenge(phone, id);
  const resource = await getConnectedResource(phone, id);
  if (!resource) throw new Error('Connected resource could not be persisted.');
  return { resource, challenge };
}

export async function issueConnectedResourceChallenge(phone: string, resourceId: string, ttlSeconds = 600): Promise<ConnectedResourceChallenge> {
  await ensureSchema();
  const resource = await getConnectedResource(phone, resourceId);
  if (!resource || resource.status === 'revoked') throw new Error('Connected resource not found.');
  const id = `crch_${crypto.randomUUID()}`;
  const code = makePairingCode();
  const expiresAt = new Date(Date.now() + Math.max(60, Math.min(ttlSeconds, 1800)) * 1000).toISOString();
  const db = await getDb();
  db.run('UPDATE connected_resource_challenges SET consumed_at = CURRENT_TIMESTAMP WHERE resource_id = ? AND phone = ? AND consumed_at IS NULL', [resourceId, String(phone || '').trim()]);
  db.run('INSERT INTO connected_resource_challenges(id, resource_id, phone, code_hash, expires_at) VALUES(?,?,?,?,?)', [id, resourceId, String(phone || '').trim(), hashChallenge(code), expiresAt]);
  saveDb();
  return { id, resourceId, code, expiresAt };
}

export async function activateConnectedResource(phone: string, resourceId: string, code: string): Promise<ConnectedResource | null> {
  await ensureSchema();
  const normalizedPhone = String(phone || '').trim();
  const normalizedCode = String(code || '').trim();
  const resource = await getConnectedResource(normalizedPhone, resourceId);
  if (!resource || resource.status === 'revoked') return null;
  const db = await getDb();
  const row = db.exec(`SELECT id, expires_at FROM connected_resource_challenges WHERE resource_id = ? AND phone = ? AND code_hash = ? AND consumed_at IS NULL ORDER BY created_at DESC LIMIT 1`, [resourceId, normalizedPhone, hashChallenge(normalizedCode)])[0]?.values?.[0] as any[] | undefined;
  if (!row || new Date(String(row[1])).getTime() <= Date.now()) return null;
  db.run('UPDATE connected_resource_challenges SET consumed_at = CURRENT_TIMESTAMP WHERE id = ?', [String(row[0])]);
  db.run(`UPDATE connected_resources SET status = 'active', last_seen_at = CURRENT_TIMESTAMP WHERE id = ? AND phone = ? AND status = 'pending'`, [resourceId, normalizedPhone]);
  saveDb();
  return getConnectedResource(normalizedPhone, resourceId);
}

export async function listConnectedResources(phone: string): Promise<ConnectedResource[]> {
  await ensureSchema();
  const db = await getDb();
  const rows = db.exec(`SELECT id, phone, kind, label, vendor, protocol, capabilities_json, metadata_json, view_url, stream_url, status, created_at, last_seen_at
    FROM connected_resources WHERE phone = ? AND status != 'revoked' ORDER BY last_seen_at DESC`, [String(phone || '').trim()])[0]?.values || [];
  return rows.map((row: any[]) => rowToResource(row));
}

export async function getConnectedResource(phone: string, id: string): Promise<ConnectedResource | null> {
  await ensureSchema();
  const db = await getDb();
  const row = db.exec(`SELECT id, phone, kind, label, vendor, protocol, capabilities_json, metadata_json, view_url, stream_url, status, created_at, last_seen_at
    FROM connected_resources WHERE id = ? AND phone = ? LIMIT 1`, [id, String(phone || '').trim()])[0]?.values?.[0] as any[] | undefined;
  return row ? rowToResource(row) : null;
}

export async function resolveConnectedResource(input: { phone: string; id?: string; label?: string; kind?: ConnectedResourceKind }): Promise<{ resource: ConnectedResource } | { ambiguous: ConnectedResource[] } | null> {
  await ensureSchema();
  if (input.id) { const resource = await getConnectedResource(input.phone, input.id); return resource?.status === 'active' ? { resource } : null; }
  const label = String(input.label || '').trim().toLowerCase();
  if (!label) return null;
  const resources = (await listConnectedResources(input.phone)).filter(resource => resource.status === 'active');
  const exact = resources.filter(resource => resource.label.toLowerCase() === label && (!input.kind || resource.kind === input.kind));
  if (exact.length === 1) return { resource: exact[0] };
  if (exact.length > 1) return { ambiguous: exact };
  const partial = resources.filter(resource => resource.label.toLowerCase().includes(label) && (!input.kind || resource.kind === input.kind));
  if (partial.length === 1) return { resource: partial[0] };
  if (partial.length > 1) return { ambiguous: partial.slice(0, 5) };
  return null;
}

export async function buildConnectedResourceContext(phone?: string): Promise<string> {
  if (!phone || phone.startsWith('anon_')) return '';
  const resources = (await listConnectedResources(phone)).filter(resource => resource.status === 'active');
  if (!resources.length) return '';
  return resources.slice(0, 24).map(resource => {
    const caps = resource.capabilities.length ? resource.capabilities.join(', ') : 'no controls declared';
    const views = resource.viewUrl || resource.streamUrl ? 'live/view media available' : 'no view media exposed';
    return `- ${resource.label} (${resource.kind}${resource.vendor ? `, ${resource.vendor}` : ''}, internal_id=${resource.id}): ${caps}; ${views}`;
  }).join('\n');
}

export async function markConnectedResourceSeen(phone: string, id: string): Promise<void> {
  await ensureSchema();
  const db = await getDb();
  db.run(`UPDATE connected_resources SET last_seen_at = CURRENT_TIMESTAMP WHERE id = ? AND phone = ? AND status = 'active'`, [id, String(phone || '').trim()]);
  saveDb();
}

export async function revokeConnectedResource(phone: string, id: string): Promise<boolean> {
  await ensureSchema();
  const db = await getDb();
  db.run(`UPDATE connected_resources SET status = 'revoked', revoked_at = CURRENT_TIMESTAMP WHERE id = ? AND phone = ? AND status != 'revoked'`, [id, String(phone || '').trim()]);
  const changed = db.getRowsModified() > 0;
  if (changed) saveDb();
  return changed;
}

export async function viewConnectedResource(phone: string, id: string): Promise<{ resource: ConnectedResource; media: Array<{ kind: 'image' | 'video' | 'stream'; url: string }> } | null> {
  const resource = await getConnectedResource(phone, id);
  if (!resource || resource.status !== 'active') return null;
  await markConnectedResourceSeen(phone, id);
  const media: Array<{ kind: 'image' | 'video' | 'stream'; url: string }> = [];
  if (resource.viewUrl) media.push({ kind: 'image', url: resource.viewUrl });
  if (resource.streamUrl) media.push({ kind: 'stream', url: resource.streamUrl });
  return { resource, media };
}

export async function controlConnectedResource(input: { phone: string; id: string; command: string; payload?: string }): Promise<{ resource: ConnectedResource; accepted: boolean; state: string; reason?: string }> {
  const resource = await getConnectedResource(input.phone, input.id);
  if (!resource) throw new Error('Connected resource not found for this user.');
  if (resource.status !== 'active') return { resource, accepted: false, state: 'activation_required', reason: 'This connected resource is not activated for control yet.' };
  if (!resource.capabilities.includes('control') && !resource.capabilities.includes(input.command)) return { resource, accepted: false, state: 'blocked', reason: 'This connected resource has not exposed that control capability.' };
  if (resource.protocol !== 'mqtt') return { resource, accepted: false, state: 'activation_required', reason: `The ${resource.protocol} control adapter is not activated in this deployment.` };
  const baseTopic = String(resource.metadata.baseTopic || '').trim();
  if (!baseTopic) return { resource, accepted: false, state: 'not_configured', reason: 'This resource has no authorized MQTT base topic.' };
  const result = sendMqttCommand(`${baseTopic.replace(/\/$/, '')}/${input.command}`, String(input.payload ?? ''));
  await markConnectedResourceSeen(input.phone, input.id);
  return { resource, accepted: result.accepted, state: result.state, reason: result.reason };
}

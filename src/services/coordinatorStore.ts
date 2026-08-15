import { getDb, saveDb } from '../database.js';
import type { CoordinatorEventEnvelope, CoordinatorRun } from './coordinatorTypes.js';

let schemaReady: Promise<void> | null = null;

export function ensureCoordinatorSchema(): Promise<void> {
  if (schemaReady) return schemaReady;
  schemaReady = (async () => {
    const db = await getDb();
    db.run(`CREATE TABLE IF NOT EXISTS coordinator_events (
      id TEXT PRIMARY KEY,
      type TEXT NOT NULL,
      producer TEXT NOT NULL DEFAULT 'unknown',
      correlation_id TEXT NOT NULL,
      causation_id TEXT,
      owner_phone TEXT,
      economic_request_id TEXT,
      agent_goal_id TEXT,
      payload_json TEXT NOT NULL,
      provenance_json TEXT NOT NULL,
      policy_json TEXT NOT NULL,
      occurred_at TEXT NOT NULL,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    )`);
    db.run(`CREATE TABLE IF NOT EXISTS coordinator_runs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      event_id TEXT NOT NULL,
      capability TEXT,
      state TEXT NOT NULL,
      provider TEXT NOT NULL,
      model TEXT NOT NULL,
      latency_ms INTEGER NOT NULL DEFAULT 0,
      failure_reason TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    )`);
    const eventColumns = db.exec('PRAGMA table_info(coordinator_events)')[0]?.values?.map((row: any[]) => String(row[1])) || [];
    if (!eventColumns.includes('producer')) { try { db.run("ALTER TABLE coordinator_events ADD COLUMN producer TEXT NOT NULL DEFAULT 'unknown'"); } catch {} }
    db.run(`CREATE TABLE IF NOT EXISTS coordinator_learning_artifacts (
      id TEXT PRIMARY KEY,
      type TEXT NOT NULL,
      source_event_id TEXT,
      content_json TEXT NOT NULL,
      provenance_json TEXT NOT NULL,
      approval_status TEXT NOT NULL DEFAULT 'candidate',
      evaluation_score REAL,
      policy_version TEXT NOT NULL,
      expires_at TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    )`);
    db.run('CREATE INDEX IF NOT EXISTS idx_coordinator_events_correlation ON coordinator_events(correlation_id, created_at DESC)');
    db.run('CREATE INDEX IF NOT EXISTS idx_coordinator_runs_event ON coordinator_runs(event_id, created_at DESC)');
    saveDb();
  })().catch(error => {
    schemaReady = null;
    throw error;
  });
  return schemaReady;
}

function boundedJson(value: unknown, max = 6000): string {
  const serialized = JSON.stringify(value ?? {});
  return serialized.length > max ? `${serialized.slice(0, max)}...` : serialized;
}

export async function persistCoordinatorEvent(event: CoordinatorEventEnvelope): Promise<void> {
  await ensureCoordinatorSchema();
  const db = await getDb();
  db.run(`INSERT OR IGNORE INTO coordinator_events
    (id, type, producer, correlation_id, causation_id, owner_phone, economic_request_id, agent_goal_id, payload_json, provenance_json, policy_json, occurred_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`, [
    event.id,
    event.type,
    event.producer,
    event.correlationId,
    event.causationId || null,
    event.ownerPhone || null,
    event.economicRequestId || null,
    event.agentGoalId || null,
    boundedJson(event.payload),
    boundedJson(event.provenance),
    boundedJson(event.policy),
    event.occurredAt,
  ]);
  saveDb();
}

export async function persistCoordinatorRun(input: Omit<CoordinatorRun, 'id' | 'createdAt'>): Promise<void> {
  await ensureCoordinatorSchema();
  const db = await getDb();
  db.run(`INSERT INTO coordinator_runs (event_id, capability, state, provider, model, latency_ms, failure_reason)
    VALUES (?, ?, ?, ?, ?, ?, ?)`, [
    input.eventId,
    input.capability || null,
    input.state,
    input.provider,
    input.model,
    Math.max(0, Math.min(600000, Math.round(input.latencyMs))),
    input.failureReason || null,
  ]);
  saveDb();
}

export async function persistLearningArtifact(input: { id: string; type: string; sourceEventId?: string; content: unknown; provenance: unknown; policyVersion: string; expiresAt?: string }): Promise<void> {
  await ensureCoordinatorSchema();
  const db = await getDb();
  db.run(`INSERT OR IGNORE INTO coordinator_learning_artifacts (id, type, source_event_id, content_json, provenance_json, policy_version, expires_at) VALUES (?, ?, ?, ?, ?, ?, ?)`, [input.id, input.type, input.sourceEventId || null, boundedJson(input.content), boundedJson(input.provenance), input.policyVersion, input.expiresAt || null]);
  saveDb();
}

export async function listLearningArtifacts(limit = 20): Promise<Array<{ id: string; type: string; approvalStatus: string; policyVersion: string; createdAt: string }>> {
  await ensureCoordinatorSchema();
  const db = await getDb();
  const stmt = db.prepare('SELECT id, type, approval_status, policy_version, created_at FROM coordinator_learning_artifacts ORDER BY created_at DESC LIMIT ?');
  stmt.bind([Math.max(1, Math.min(100, Math.floor(limit)))]);
  const artifacts: Array<{ id: string; type: string; approvalStatus: string; policyVersion: string; createdAt: string }> = [];
  while (stmt.step()) { const row = stmt.getAsObject() as any; artifacts.push({ id: String(row.id), type: String(row.type), approvalStatus: String(row.approval_status), policyVersion: String(row.policy_version), createdAt: String(row.created_at || '') }); }
  stmt.free();
  return artifacts;
}

export async function listCoordinatorRuns(limit = 20): Promise<CoordinatorRun[]> {
  await ensureCoordinatorSchema();
  const db = await getDb();
  const stmt = db.prepare('SELECT * FROM coordinator_runs ORDER BY id DESC LIMIT ?');
  stmt.bind([Math.max(1, Math.min(100, Math.floor(limit)))]);
  const runs: CoordinatorRun[] = [];
  while (stmt.step()) {
    const row = stmt.getAsObject() as any;
    runs.push({
      id: Number(row.id),
      eventId: String(row.event_id),
      capability: row.capability ? String(row.capability) as CoordinatorRun['capability'] : undefined,
      state: String(row.state) as CoordinatorRun['state'],
      provider: String(row.provider) as CoordinatorRun['provider'],
      model: String(row.model),
      latencyMs: Number(row.latency_ms || 0),
      failureReason: row.failure_reason ? String(row.failure_reason) : undefined,
      createdAt: String(row.created_at || ''),
    });
  }
  stmt.free();
  return runs;
}

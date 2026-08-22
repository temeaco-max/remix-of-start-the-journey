import { getDb, saveDb } from '../database.js';

export interface PlatformJourneyEvent {
  id: string;
  eventKey: string;
  contextId?: string;
  eventType: string;
  actorPhone?: string;
  customerPhone?: string;
  providerPhone?: string;
  economicRequestId?: string;
  objectType?: string;
  objectId?: string;
  points?: number;
  metadata?: Record<string, unknown>;
  occurredAt: string;
}

async function ensureSchema(): Promise<void> {
  const db = await getDb();
  db.run(`CREATE TABLE IF NOT EXISTS platform_journey_events (
    id TEXT PRIMARY KEY,
    event_key TEXT NOT NULL UNIQUE,
    context_id TEXT,
    event_type TEXT NOT NULL,
    actor_phone TEXT,
    customer_phone TEXT,
    provider_phone TEXT,
    economic_request_id TEXT,
    object_type TEXT,
    object_id TEXT,
    points INTEGER,
    metadata_json TEXT NOT NULL DEFAULT '{}',
    occurred_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  )`);
  db.run('CREATE INDEX IF NOT EXISTS idx_platform_journey_request ON platform_journey_events(economic_request_id, occurred_at DESC)');
}

export async function recordPlatformJourneyEvent(input: Omit<PlatformJourneyEvent, 'id' | 'occurredAt'> & { occurredAt?: string }): Promise<PlatformJourneyEvent> {
  await ensureSchema();
  const db = await getDb();
  const eventKey = String(input.eventKey || '').trim();
  if (!eventKey) throw new Error('Platform journey eventKey is required.');
  const existing = db.exec('SELECT * FROM platform_journey_events WHERE event_key=? LIMIT 1', [eventKey]);
  if (existing[0]?.values?.length) return rowToEvent(existing[0].columns, existing[0].values[0]);
  const id = `pje_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
  db.run(`INSERT INTO platform_journey_events (id,event_key,context_id,event_type,actor_phone,customer_phone,provider_phone,economic_request_id,object_type,object_id,points,metadata_json,occurred_at)
    VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)`, [id, eventKey, input.contextId || null, input.eventType, input.actorPhone || null, input.customerPhone || null, input.providerPhone || null, input.economicRequestId || null, input.objectType || null, input.objectId || null, input.points ?? null, JSON.stringify(input.metadata || {}), input.occurredAt || new Date().toISOString()]);
  saveDb();
  return { ...input, id, eventKey, occurredAt: input.occurredAt || new Date().toISOString() };
}

function rowToEvent(columns: string[], row: unknown[]): PlatformJourneyEvent {
  const object = Object.fromEntries(columns.map((column, index) => [column, row[index]]));
  let metadata: Record<string, unknown> = {};
  try { metadata = JSON.parse(String(object.metadata_json || '{}')); } catch { metadata = {}; }
  return { id: String(object.id), eventKey: String(object.event_key), contextId: object.context_id ? String(object.context_id) : undefined, eventType: String(object.event_type), actorPhone: object.actor_phone ? String(object.actor_phone) : undefined, customerPhone: object.customer_phone ? String(object.customer_phone) : undefined, providerPhone: object.provider_phone ? String(object.provider_phone) : undefined, economicRequestId: object.economic_request_id ? String(object.economic_request_id) : undefined, objectType: object.object_type ? String(object.object_type) : undefined, objectId: object.object_id ? String(object.object_id) : undefined, points: object.points == null ? undefined : Number(object.points), metadata, occurredAt: String(object.occurred_at) };
}

export async function listPlatformJourneyEvents(input: { economicRequestId?: string; phone?: string; limit?: number } = {}): Promise<PlatformJourneyEvent[]> {
  await ensureSchema();
  const db = await getDb();
  const conditions: string[] = [];
  const params: unknown[] = [];
  if (input.economicRequestId) { conditions.push('economic_request_id=?'); params.push(input.economicRequestId); }
  if (input.phone) { conditions.push('(actor_phone=? OR customer_phone=? OR provider_phone=?)'); params.push(input.phone, input.phone, input.phone); }
  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
  const result = db.exec(`SELECT * FROM platform_journey_events ${where} ORDER BY occurred_at DESC LIMIT ?`, [...params, Math.max(1, Math.min(100, Math.floor(Number(input.limit || 50))))]);
  return (result[0]?.values || []).map(row => rowToEvent(result[0].columns, row));
}

export async function reconcileEconomicJourney(economicRequestId: string): Promise<number> {
  await ensureSchema();
  const db = await getDb();
  let created = 0;
  const emit = async (event: Omit<PlatformJourneyEvent, 'id' | 'occurredAt'>) => {
    const existing = db.exec('SELECT id FROM platform_journey_events WHERE event_key=? LIMIT 1', [event.eventKey]);
    if (existing[0]?.values?.length) return;
    await recordPlatformJourneyEvent(event);
    created += 1;
  };
  try {
    const leads = db.exec('SELECT * FROM economic_dispatch_leads WHERE request_id=? ORDER BY created_at ASC', [economicRequestId]);
    for (const row of leads[0]?.values || []) {
      const o = Object.fromEntries(leads[0].columns.map((c: string, i: number) => [c, row[i]]));
      const base = { economicRequestId, contextId: `economic:${economicRequestId}`, providerPhone: String(o.provider_phone), objectType: 'dispatch_lead', objectId: String(o.id), points: Number(o.lead_points || 0) || undefined };
      await emit({ ...base, eventKey: `dispatch:${o.id}:offered`, eventType: 'dispatch_offered' });
      if (['accepted', 'arrived', 'completed'].includes(String(o.status))) await emit({ ...base, eventKey: `dispatch:${o.id}:accepted`, eventType: 'dispatch_accepted' });
      if (['arrived', 'completed'].includes(String(o.status))) await emit({ ...base, eventKey: `dispatch:${o.id}:arrived`, eventType: 'dispatch_arrived' });
      if (String(o.status) === 'completed') await emit({ ...base, eventKey: `dispatch:${o.id}:completed`, eventType: 'dispatch_completed' });
    }
  } catch {}
  try {
    const reviews = db.exec('SELECT * FROM service_reviews WHERE request_id=? ORDER BY created_at ASC', [economicRequestId]);
    for (const row of reviews[0]?.values || []) {
      const o = Object.fromEntries(reviews[0].columns.map((c: string, i: number) => [c, row[i]]));
      await emit({ eventKey: `review:${o.id}`, eventType: 'service_reviewed', contextId: `economic:${economicRequestId}`, economicRequestId, customerPhone: String(o.reviewer_phone), providerPhone: String(o.provider_phone), objectType: 'service_review', objectId: String(o.id), metadata: { rating: Number(o.rating || 0), feedbackPresent: Boolean(o.feedback) } });
    }
  } catch {}
  return created;
}

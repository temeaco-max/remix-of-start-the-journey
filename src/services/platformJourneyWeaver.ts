import { getDb, saveDb } from '../database.js';

export type PlatformJourneyEventType =
  | 'dispatch_offered'
  | 'dispatch_accepted'
  | 'dispatch_arrived'
  | 'dispatch_completed'
  | 'service_reviewed'
  | 'points_topup_pending'
  | 'points_topup_settled'
  | 'catalogue_source_registered'
  | 'catalogue_product_published'
  | 'discover_action';

export interface PlatformJourneyEvent {
  id: string;
  eventKey: string;
  contextId?: string;
  eventType: PlatformJourneyEventType;
  actorPhone?: string;
  customerPhone?: string;
  providerPhone?: string;
  agentId?: string;
  economicRequestId?: string;
  leadId?: string;
  communicationSessionId?: string;
  objectType?: string;
  objectId?: string;
  skill?: string;
  category?: string;
  channel?: string;
  points?: number;
  fiatMinor?: number;
  currency?: string;
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
    agent_id TEXT,
    economic_request_id TEXT,
    lead_id TEXT,
    communication_session_id TEXT,
    object_type TEXT,
    object_id TEXT,
    skill TEXT,
    category TEXT,
    channel TEXT,
    points INTEGER,
    fiat_minor INTEGER,
    currency TEXT,
    metadata_json TEXT NOT NULL DEFAULT '{}',
    occurred_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  )`);
  db.run('CREATE INDEX IF NOT EXISTS idx_platform_journey_context ON platform_journey_events(context_id, occurred_at DESC)');
  db.run('CREATE INDEX IF NOT EXISTS idx_platform_journey_request ON platform_journey_events(economic_request_id, occurred_at DESC)');
  db.run('CREATE INDEX IF NOT EXISTS idx_platform_journey_actor ON platform_journey_events(actor_phone, occurred_at DESC)');
}

export async function recordPlatformJourneyEvent(input: Omit<PlatformJourneyEvent, 'id' | 'occurredAt'> & { occurredAt?: string }): Promise<PlatformJourneyEvent> {
  await ensureSchema();
  const db = await getDb();
  const eventKey = String(input.eventKey || '').trim();
  if (!eventKey) throw new Error('Platform journey eventKey is required.');
  const existing = db.exec('SELECT * FROM platform_journey_events WHERE event_key=? LIMIT 1', [eventKey]);
  if (existing[0]?.values?.length) return rowToEvent(existing[0].columns, existing[0].values[0]);
  const id = `pje_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
  db.run(`INSERT INTO platform_journey_events (id,event_key,context_id,event_type,actor_phone,customer_phone,provider_phone,agent_id,economic_request_id,lead_id,communication_session_id,object_type,object_id,skill,category,channel,points,fiat_minor,currency,metadata_json,occurred_at)
    VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`, [id,eventKey,input.contextId||null,input.eventType,input.actorPhone||null,input.customerPhone||null,input.providerPhone||null,input.agentId||null,input.economicRequestId||null,input.leadId||null,input.communicationSessionId||null,input.objectType||null,input.objectId||null,input.skill||null,input.category||null,input.channel||null,input.points ?? null,input.fiatMinor ?? null,input.currency||null,JSON.stringify(input.metadata||{}),input.occurredAt || new Date().toISOString()]);
  saveDb();
  return { ...input, id, eventKey, occurredAt: input.occurredAt || new Date().toISOString() };
}

function rowToEvent(columns: string[], row: unknown[]): PlatformJourneyEvent {
  const object = Object.fromEntries(columns.map((column, index) => [column, row[index]]));
  let metadata: Record<string, unknown> = {};
  try { metadata = JSON.parse(String(object.metadata_json || '{}')); } catch { metadata = {}; }
  return {
    id: String(object.id), eventKey: String(object.event_key), contextId: object.context_id ? String(object.context_id) : undefined,
    eventType: String(object.event_type) as PlatformJourneyEventType, actorPhone: object.actor_phone ? String(object.actor_phone) : undefined,
    customerPhone: object.customer_phone ? String(object.customer_phone) : undefined, providerPhone: object.provider_phone ? String(object.provider_phone) : undefined,
    agentId: object.agent_id ? String(object.agent_id) : undefined, economicRequestId: object.economic_request_id ? String(object.economic_request_id) : undefined,
    leadId: object.lead_id ? String(object.lead_id) : undefined, communicationSessionId: object.communication_session_id ? String(object.communication_session_id) : undefined,
    objectType: object.object_type ? String(object.object_type) : undefined, objectId: object.object_id ? String(object.object_id) : undefined,
    skill: object.skill ? String(object.skill) : undefined, category: object.category ? String(object.category) : undefined,
    channel: object.channel ? String(object.channel) : undefined, points: object.points == null ? undefined : Number(object.points),
    fiatMinor: object.fiat_minor == null ? undefined : Number(object.fiat_minor), currency: object.currency ? String(object.currency) : undefined,
    metadata, occurredAt: String(object.occurred_at),
  };
}

export async function listPlatformJourneyEvents(input: { contextId?: string; economicRequestId?: string; phone?: string; limit?: number } = {}): Promise<PlatformJourneyEvent[]> {
  await ensureSchema();
  const db = await getDb();
  const conditions: string[] = [];
  const params: unknown[] = [];
  if (input.contextId) { conditions.push('context_id=?'); params.push(input.contextId); }
  if (input.economicRequestId) { conditions.push('economic_request_id=?'); params.push(input.economicRequestId); }
  if (input.phone) { conditions.push('(actor_phone=? OR customer_phone=? OR provider_phone=?)'); params.push(input.phone, input.phone, input.phone); }
  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
  const result = db.exec(`SELECT * FROM platform_journey_events ${where} ORDER BY occurred_at DESC LIMIT ?`, [...params, Math.max(1, Math.min(250, Math.floor(Number(input.limit || 50))))]);
  return (result[0]?.values || []).map(row => rowToEvent(result[0].columns, row));
}

export async function reconcilePlatformJourneyProjections(maxRows = 200): Promise<{ scanned: number; created: number }> {
  await ensureSchema();
  const db = await getDb();
  let scanned = 0; let created = 0;
  const emit = async (event: Omit<PlatformJourneyEvent, 'id' | 'occurredAt'>) => { scanned += 1; const existing = db.exec('SELECT id FROM platform_journey_events WHERE event_key=? LIMIT 1', [event.eventKey]); if (existing[0]?.values?.length) return; await recordPlatformJourneyEvent(event); created += 1; };
  const tables = [
    { table: 'economic_dispatch_leads', rows: () => db.exec(`SELECT * FROM economic_dispatch_leads ORDER BY COALESCE(completed_at,accepted_at,arrived_at,created_at) DESC LIMIT ?`, [maxRows]) },
    { table: 'service_reviews', rows: () => db.exec(`SELECT * FROM service_reviews ORDER BY created_at DESC LIMIT ?`, [maxRows]) },
    { table: 'kurukoo_points_topups', rows: () => db.exec(`SELECT * FROM kurukoo_points_topups ORDER BY updated_at DESC LIMIT ?`, [maxRows]) },
    { table: 'catalogue_sources', rows: () => db.exec(`SELECT * FROM catalogue_sources ORDER BY created_at DESC LIMIT ?`, [maxRows]) },
    { table: 'catalogue_products', rows: () => db.exec(`SELECT * FROM catalogue_products ORDER BY updated_at DESC LIMIT ?`, [maxRows]) },
  ];
  for (const source of tables) {
    let result: any;
    try { result = source.rows(); } catch { continue; }
    for (const row of result[0]?.values || []) {
      const object = Object.fromEntries(result[0].columns.map((column: string, index: number) => [column, row[index]]));
      if (source.table === 'economic_dispatch_leads') {
        const status = String(object.status);
        const base = { economicRequestId: String(object.request_id), leadId: String(object.id), providerPhone: String(object.provider_phone), skill: String(object.skill), points: Number(object.lead_points || 0) || undefined, objectType: 'dispatch_lead', objectId: String(object.id), contextId: `request:${String(object.request_id)}` };
        if (['offered','accepted','arrived','completed'].includes(status)) await emit({ ...base, eventKey: `dispatch:${object.id}:offered`, eventType: 'dispatch_offered' });
        if (['accepted','arrived','completed'].includes(status)) await emit({ ...base, eventKey: `dispatch:${object.id}:accepted`, eventType: 'dispatch_accepted' });
        if (['arrived','completed'].includes(status)) await emit({ ...base, eventKey: `dispatch:${object.id}:arrived`, eventType: 'dispatch_arrived' });
        if (status === 'completed') await emit({ ...base, eventKey: `dispatch:${object.id}:completed`, eventType: 'dispatch_completed' });
      } else if (source.table === 'service_reviews') {
        await emit({ eventKey: `review:${object.id}`, eventType: 'service_reviewed', customerPhone: String(object.reviewer_phone), providerPhone: String(object.provider_phone), economicRequestId: String(object.request_id), objectType: 'service_review', objectId: String(object.id), contextId: `request:${String(object.request_id)}`, metadata: { rating: Number(object.rating), feedbackPresent: Boolean(object.feedback) } });
      } else if (source.table === 'kurukoo_points_topups') {
        const settled = String(object.status) === 'settled';
        await emit({ eventKey: `points-topup:${object.id}:${settled ? 'settled' : 'pending'}`, eventType: settled ? 'points_topup_settled' : 'points_topup_pending', actorPhone: String(object.customer_phone), agentId: object.agent_id ? String(object.agent_id) : undefined, objectType: 'points_topup', objectId: String(object.id), points: Number(object.points || 0), fiatMinor: Number(object.fiat_amount_minor || 0), currency: String(object.currency || ''), metadata: { status: String(object.status) } });
      } else if (source.table === 'catalogue_sources') {
        await emit({ eventKey: `catalogue-source:${object.id}`, eventType: 'catalogue_source_registered', actorPhone: object.provider_phone ? String(object.provider_phone) : undefined, objectType: 'catalogue_source', objectId: String(object.id), metadata: { sourceType: String(object.source_type), connected: Number(object.connected) === 1, verified: Number(object.verified) === 1 } });
      } else if (source.table === 'catalogue_products') {
        await emit({ eventKey: `catalogue-product:${object.id}`, eventType: 'catalogue_product_published', actorPhone: object.provider_phone ? String(object.provider_phone) : undefined, objectType: 'catalogue_product', objectId: String(object.id), metadata: { title: String(object.title), sourceId: String(object.source_id), verified: Number(object.verified) === 1, available: Number(object.available) === 1 } });
      }
    }
  }
  return { scanned, created };
}

import { getDb, saveDb } from '../database.js';
import { getEconomicRequest } from './skillFlows.js';

export const ECONOMIC_PARTICIPANT_ROLES = [
  'seller',
  'delivery_provider',
  'external_platform',
  'agent',
] as const;

export type EconomicParticipantRole = typeof ECONOMIC_PARTICIPANT_ROLES[number];

export const ECONOMIC_PARTICIPANT_STATUSES = [
  'invited',
  'offered',
  'selected',
  'confirmed',
  'handover_pending',
  'handed_over',
  'collected',
  'in_progress',
  'delivered',
  'declined',
  'withdrawn',
] as const;

export type EconomicParticipantStatus = typeof ECONOMIC_PARTICIPANT_STATUSES[number];

export interface EconomicOffer {
  id: string;
  requestId: string;
  sellerPhone: string;
  description: string;
  priceMinor: number | null;
  currency: string;
  source: string;
  availabilityNote: string | null;
  externalSource: string | null;
  createdAt: string | null;
}

export interface EconomicParticipant {
  id: number;
  requestId: string;
  role: EconomicParticipantRole;
  providerPhone: string;
  capability: string;
  status: EconomicParticipantStatus;
  evidence: Record<string, unknown>;
  addedAt: string | null;
}

const ROLE_SET = new Set<string>(ECONOMIC_PARTICIPANT_ROLES);
const STATUS_SET = new Set<string>(ECONOMIC_PARTICIPANT_STATUSES);

function cleanText(value: unknown, field: string, maxLength = 1000): string {
  if (typeof value !== 'string' || !value.trim()) throw new Error(`${field} is required`);
  const text = value.trim();
  if (text.length > maxLength) throw new Error(`${field} is too long`);
  return text;
}

function cleanOptionalText(value: unknown, field: string, maxLength = 2000): string | null {
  if (value === undefined || value === null || value === '') return null;
  return cleanText(value, field, maxLength);
}

function cleanEvidence(value: unknown): Record<string, unknown> {
  if (value === undefined || value === null) return {};
  if (typeof value !== 'object' || Array.isArray(value)) throw new Error('Evidence must be an object');
  return value as Record<string, unknown>;
}

function parseEvidence(value: unknown): Record<string, unknown> {
  if (!value) return {};
  try {
    const parsed = JSON.parse(String(value));
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed as Record<string, unknown> : {};
  } catch {
    return {};
  }
}

function normalizeRole(value: unknown): EconomicParticipantRole {
  const role = cleanText(value, 'Participant role', 64);
  if (!ROLE_SET.has(role)) throw new Error('Unsupported participant role');
  return role as EconomicParticipantRole;
}

function normalizeStatus(value: unknown): EconomicParticipantStatus {
  const status = cleanText(value, 'Participant status', 64);
  if (!STATUS_SET.has(status)) throw new Error('Unsupported participant status');
  return status as EconomicParticipantStatus;
}

function offerFromRow(row: any): EconomicOffer {
  return {
    id: String(row.id),
    requestId: String(row.request_id),
    sellerPhone: String(row.seller_phone),
    description: String(row.description),
    priceMinor: row.price_minor === null || row.price_minor === undefined ? null : Number(row.price_minor),
    currency: String(row.currency || 'NGN'),
    source: String(row.source),
    availabilityNote: row.availability_note ? String(row.availability_note) : null,
    externalSource: row.external_source ? String(row.external_source) : null,
    createdAt: row.created_at ? String(row.created_at) : null,
  };
}

function participantFromRow(row: any): EconomicParticipant {
  return {
    id: Number(row.id),
    requestId: String(row.request_id),
    role: String(row.role) as EconomicParticipantRole,
    providerPhone: String(row.provider_phone),
    capability: String(row.capability),
    status: String(row.status) as EconomicParticipantStatus,
    evidence: parseEvidence(row.evidence_json),
    addedAt: row.added_at ? String(row.added_at) : null,
  };
}

async function requireRequestOwner(requestId: string, ownerPhone: string): Promise<void> {
  const request = await getEconomicRequest(requestId);
  if (!request) throw new Error('Economic request not found');
  if (request.phone !== ownerPhone) throw new Error('Economic request ownership is required');
}

async function requireVerifiedProvider(phone: string): Promise<void> {
  const db = await getDb();
  const stmt = db.prepare('SELECT verified_provider FROM memory_profiles WHERE phone=? LIMIT 1');
  stmt.bind([phone]);
  const verified = stmt.step() ? Number(stmt.getAsObject().verified_provider) === 1 : false;
  stmt.free();
  if (!verified) throw new Error('A verified provider is required for this participant role');
}

async function requireRegisteredAgent(agentId: string): Promise<void> {
  const db = await getDb();
  const stmt = db.prepare('SELECT id FROM ai_agents WHERE id=? LIMIT 1');
  stmt.bind([agentId]);
  const exists = stmt.step();
  stmt.free();
  if (!exists) throw new Error('A registered AI agent is required for the agent participant role');
}

/**
 * Attach an informational seller offer to one canonical Economic Request.
 * Its item price never replaces the request quote or changes escrow settlement.
 */
export async function attachEconomicOffer(input: {
  requestId: string;
  ownerPhone: string;
  id: string;
  sellerPhone: string;
  description: string;
  priceMinor?: number | null;
  currency?: string;
  source: string;
  availabilityNote?: string | null;
  externalSource?: string | null;
}): Promise<EconomicOffer> {
  await requireRequestOwner(cleanText(input.requestId, 'Request id', 128), cleanText(input.ownerPhone, 'Owner phone', 128));
  const sellerPhone = cleanText(input.sellerPhone, 'Seller phone', 128);
  await requireVerifiedProvider(sellerPhone);
  const priceMinor = input.priceMinor === undefined || input.priceMinor === null ? null : input.priceMinor;
  if (priceMinor !== null && (!Number.isInteger(priceMinor) || priceMinor < 0)) throw new Error('Offer price must be a non-negative integer amount in minor units');
  const db = await getDb();
  db.run(
    `INSERT INTO economic_offers (id,request_id,seller_phone,description,price_minor,currency,source,availability_note,external_source)
     VALUES (?,?,?,?,?,?,?,?,?)
     ON CONFLICT(request_id) DO UPDATE SET
       id=excluded.id,
       seller_phone=excluded.seller_phone,
       description=excluded.description,
       price_minor=excluded.price_minor,
       currency=excluded.currency,
       source=excluded.source,
       availability_note=excluded.availability_note,
       external_source=excluded.external_source`,
    [
      cleanText(input.id, 'Offer id', 128),
      input.requestId,
      sellerPhone,
      cleanText(input.description, 'Offer description', 2000),
      priceMinor,
      cleanOptionalText(input.currency ?? 'NGN', 'Offer currency', 16) || 'NGN',
      cleanText(input.source, 'Offer source', 128),
      cleanOptionalText(input.availabilityNote, 'Availability note'),
      cleanOptionalText(input.externalSource, 'External source'),
    ],
  );
  saveDb();
  return (await getEconomicOffer(input.requestId))!;
}

/**
 * Add or update a named provider participant. Verification is required for
 * seller, delivery-provider, and external-platform roles; an AI agent remains
 * representable for orchestration but receives no fulfillment or payment rights.
 */
export async function addEconomicParticipant(input: {
  requestId: string;
  ownerPhone: string;
  role: EconomicParticipantRole;
  providerPhone: string;
  capability: string;
  status?: EconomicParticipantStatus;
  evidence?: Record<string, unknown>;
}): Promise<EconomicParticipant> {
  const requestId = cleanText(input.requestId, 'Request id', 128);
  await requireRequestOwner(requestId, cleanText(input.ownerPhone, 'Owner phone', 128));
  const role = normalizeRole(input.role);
  const providerPhone = cleanText(input.providerPhone, 'Provider phone', 128);
  if (role === 'agent') await requireRegisteredAgent(providerPhone);
  else await requireVerifiedProvider(providerPhone);
  const status = input.status === undefined ? 'invited' : normalizeStatus(input.status);
  const db = await getDb();
  db.run(
    `INSERT INTO economic_participants (request_id,role,provider_phone,capability,status,evidence_json)
     VALUES (?,?,?,?,?,?)
     ON CONFLICT(request_id,role,provider_phone) DO UPDATE SET
       capability=excluded.capability,
       status=excluded.status,
       evidence_json=excluded.evidence_json`,
    [requestId, role, providerPhone, cleanText(input.capability, 'Participant capability', 500), status, JSON.stringify(cleanEvidence(input.evidence))],
  );
  saveDb();
  return (await getEconomicParticipants(requestId)).find((participant) => participant.role === role && participant.providerPhone === providerPhone)!;
}

export async function getEconomicOffer(requestId: string): Promise<EconomicOffer | null> {
  const db = await getDb();
  const stmt = db.prepare('SELECT * FROM economic_offers WHERE request_id=? LIMIT 1');
  stmt.bind([requestId]);
  const row = stmt.step() ? stmt.getAsObject() : null;
  stmt.free();
  return row ? offerFromRow(row) : null;
}

export async function getEconomicParticipants(requestId: string): Promise<EconomicParticipant[]> {
  const db = await getDb();
  const stmt = db.prepare('SELECT * FROM economic_participants WHERE request_id=? ORDER BY added_at ASC, id ASC');
  stmt.bind([requestId]);
  const participants: EconomicParticipant[] = [];
  while (stmt.step()) participants.push(participantFromRow(stmt.getAsObject()));
  stmt.free();
  return participants;
}

/**
 * Store role-specific evidence and coordination status without mutating the
 * canonical request lifecycle, escrow recipient, payment state, or quote.
 */
export async function updateEconomicParticipant(input: {
  requestId: string;
  ownerPhone: string;
  role: EconomicParticipantRole;
  providerPhone: string;
  status?: EconomicParticipantStatus;
  evidence?: Record<string, unknown>;
}): Promise<EconomicParticipant> {
  const requestId = cleanText(input.requestId, 'Request id', 128);
  await requireRequestOwner(requestId, cleanText(input.ownerPhone, 'Owner phone', 128));
  const role = normalizeRole(input.role);
  const providerPhone = cleanText(input.providerPhone, 'Provider phone', 128);
  const db = await getDb();
  const existing = db.prepare('SELECT * FROM economic_participants WHERE request_id=? AND role=? AND provider_phone=? LIMIT 1');
  existing.bind([requestId, role, providerPhone]);
  const row = existing.step() ? existing.getAsObject() : null;
  existing.free();
  if (!row) throw new Error('Economic participant not found');
  const status = input.status === undefined ? String(row.status) as EconomicParticipantStatus : normalizeStatus(input.status);
  const evidence = { ...parseEvidence(row.evidence_json), ...cleanEvidence(input.evidence) };
  db.run(
    'UPDATE economic_participants SET status=?, evidence_json=? WHERE id=?',
    [status, JSON.stringify(evidence), Number(row.id)],
  );
  saveDb();
  return (await getEconomicParticipants(requestId)).find((participant) => participant.id === Number(row.id))!;
}

export async function getEconomicRequestCoordination(requestId: string): Promise<{ offer: EconomicOffer | null; participants: EconomicParticipant[] }> {
  const [offer, participants] = await Promise.all([getEconomicOffer(requestId), getEconomicParticipants(requestId)]);
  return { offer, participants };
}

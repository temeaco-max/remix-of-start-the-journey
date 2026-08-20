import { getDb, saveDb } from '../database.js';

export interface BinDaySchedule {
  postcode?: string;
  address?: string;
  council?: string;
  wasteType?: string;
  nextCollectionAt: string;
  recurrence?: string;
  sourceUrl?: string;
  sourceName: string;
  sourceCheckedAt: string;
  sourceExpiresAt?: string;
  evidence: 'authoritative_source';
}

export interface BinDayResolutionInput {
  postcode?: string;
  address?: string;
  council?: string;
  wasteType?: string;
}

function clean(value: unknown): string | undefined {
  const text = typeof value === 'string' ? value.trim() : '';
  return text ? text.slice(0, 200) : undefined;
}

/**
 * Canonical bin-day source seam. The schedule table is deliberately local and
 * provenance-bearing: runtime must never invent a collection date. An external
 * council connector can upsert authoritative schedules into this table later.
 */
export async function resolveBinDaySchedule(input: BinDayResolutionInput): Promise<BinDaySchedule | null> {
  const postcode = clean(input.postcode)?.toLowerCase();
  const address = clean(input.address)?.toLowerCase();
  const council = clean(input.council)?.toLowerCase();
  const wasteType = clean(input.wasteType)?.toLowerCase();
  if (!postcode && !address && !council) return null;

  const db = await getDb();
  db.run(`CREATE TABLE IF NOT EXISTS authoritative_bin_schedules (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    postcode TEXT,
    address TEXT,
    council TEXT,
    waste_type TEXT,
    next_collection_at TEXT NOT NULL,
    recurrence TEXT,
    source_url TEXT,
    source_name TEXT NOT NULL,
    source_checked_at TEXT NOT NULL,
    source_expires_at TEXT,
    evidence TEXT NOT NULL DEFAULT 'authoritative_source'
  );`);
  const clauses: string[] = [];
  const params: string[] = [];
  if (postcode) { clauses.push('lower(COALESCE(postcode,\'\'))=?'); params.push(postcode); }
  if (address) { clauses.push('lower(COALESCE(address,\'\'))=?'); params.push(address); }
  if (council) { clauses.push('lower(COALESCE(council,\'\'))=?'); params.push(council); }
  if (wasteType) { clauses.push('lower(COALESCE(waste_type,\'\'))=?'); params.push(wasteType); }
  const stmt = db.prepare(`SELECT * FROM authoritative_bin_schedules WHERE ${clauses.join(' AND ')} ORDER BY source_checked_at DESC LIMIT 1`);
  stmt.bind(params);
  const row = stmt.step() ? stmt.getAsObject() as Record<string, unknown> : null;
  stmt.free();
  if (!row) return null;
  const nextCollectionAt = String(row.next_collection_at || '');
  if (!nextCollectionAt || Number.isNaN(Date.parse(nextCollectionAt))) return null;
  const expiresAt = row.source_expires_at ? String(row.source_expires_at) : undefined;
  if (expiresAt && Date.parse(expiresAt) <= Date.now()) return null;
  saveDb();
  return {
    postcode: row.postcode ? String(row.postcode) : undefined,
    address: row.address ? String(row.address) : undefined,
    council: row.council ? String(row.council) : undefined,
    wasteType: row.waste_type ? String(row.waste_type) : undefined,
    nextCollectionAt,
    recurrence: row.recurrence ? String(row.recurrence) : undefined,
    sourceUrl: row.source_url ? String(row.source_url) : undefined,
    sourceName: String(row.source_name || 'Authoritative council source'),
    sourceCheckedAt: String(row.source_checked_at),
    sourceExpiresAt: expiresAt,
    evidence: 'authoritative_source',
  };
}

export async function upsertAuthoritativeBinDaySchedule(schedule: Omit<BinDaySchedule, 'evidence'>): Promise<void> {
  if (!schedule.nextCollectionAt || Number.isNaN(Date.parse(schedule.nextCollectionAt))) throw new Error('A valid next collection date is required');
  const db = await getDb();
  db.run(`CREATE TABLE IF NOT EXISTS authoritative_bin_schedules (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    postcode TEXT,
    address TEXT,
    council TEXT,
    waste_type TEXT,
    next_collection_at TEXT NOT NULL,
    recurrence TEXT,
    source_url TEXT,
    source_name TEXT NOT NULL,
    source_checked_at TEXT NOT NULL,
    source_expires_at TEXT,
    evidence TEXT NOT NULL DEFAULT 'authoritative_source'
  );`);
  db.run(`INSERT INTO authoritative_bin_schedules
    (postcode,address,council,waste_type,next_collection_at,recurrence,source_url,source_name,source_checked_at,source_expires_at,evidence)
    VALUES (?,?,?,?,?,?,?,?,?,?,?)`, [
      clean(schedule.postcode), clean(schedule.address), clean(schedule.council), clean(schedule.wasteType),
      schedule.nextCollectionAt, clean(schedule.recurrence), clean(schedule.sourceUrl), clean(schedule.sourceName) || 'Authoritative council source',
      schedule.sourceCheckedAt || new Date().toISOString(), clean(schedule.sourceExpiresAt), 'authoritative_source',
    ]);
  saveDb();
}

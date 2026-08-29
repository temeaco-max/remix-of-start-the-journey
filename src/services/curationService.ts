/* Copyright (c) 2026 temeaco-max. All rights reserved. Proprietary and confidential. */
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { getDb, saveDb } from '../database.js';

export type ReviewStatus = 'pending' | 'accepted' | 'rejected' | 'needs_rewrite' | 'needs_second_review';
export type ReviewDecision = 'accept' | 'reject' | 'rewrite' | 'second_review';

const STATUSES = new Set<ReviewStatus>(['pending', 'accepted', 'rejected', 'needs_rewrite', 'needs_second_review']);
const DATASET_PATH = path.join(process.cwd(), 'ml', 'datasets', 'kurukoo-teacher-candidates.jsonl');

function json(value: unknown): string { return JSON.stringify(value ?? null); }
function parse(value: unknown): any { try { return value ? JSON.parse(String(value)) : null; } catch { return null; } }
function hash(value: unknown): string { return crypto.createHash('sha256').update(typeof value === 'string' ? value : json(value)).digest('hex'); }

export async function ensureCurationSchema(): Promise<void> {
  const db = await getDb();
  db.run(`CREATE TABLE IF NOT EXISTS training_curation_candidates (
    example_id TEXT PRIMARY KEY,
    trajectory_json TEXT NOT NULL,
    skill TEXT,
    family TEXT,
    actor TEXT,
    market TEXT,
    locale TEXT,
    channel TEXT,
    lifecycle TEXT,
    scenario_variant TEXT,
    teacher_provider TEXT,
    teacher_model TEXT,
    candidate_score REAL,
    review_scores_json TEXT,
    failure_dimensions_json TEXT,
    provenance_json TEXT,
    review_status TEXT NOT NULL DEFAULT 'pending',
    reviewed INTEGER NOT NULL DEFAULT 0,
    accepted INTEGER NOT NULL DEFAULT 0,
    reviewer_id TEXT,
    reviewer_notes TEXT,
    rejection_reason TEXT,
    version INTEGER NOT NULL DEFAULT 1,
    scenario_id TEXT,
    original_id TEXT,
    rewrite_of TEXT,
    content_hash TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  )`);
  db.run(`CREATE TABLE IF NOT EXISTS training_curation_audit (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    example_id TEXT NOT NULL,
    reviewer_id TEXT NOT NULL,
    decision TEXT NOT NULL,
    reason TEXT,
    notes TEXT,
    candidate_version INTEGER NOT NULL,
    dataset_version TEXT,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  )`);
  const columns = db.exec('PRAGMA table_info(training_curation_candidates)')[0]?.values?.map((row: any[]) => String(row[1])) || [];
  if (!columns.includes('scenario_id')) { try { db.run('ALTER TABLE training_curation_candidates ADD COLUMN scenario_id TEXT'); } catch {} }
  if (!columns.includes('review_scores_json')) { try { db.run('ALTER TABLE training_curation_candidates ADD COLUMN review_scores_json TEXT'); } catch {} }
  db.run('CREATE INDEX IF NOT EXISTS idx_curation_status_priority ON training_curation_candidates(review_status, candidate_score DESC)');
  db.run('CREATE INDEX IF NOT EXISTS idx_curation_rewrite_of ON training_curation_candidates(rewrite_of)');
  saveDb();
}

function rowToCandidate(row: any): any {
  return {
    exampleId: String(row.example_id), trajectory: parse(row.trajectory_json), skill: row.skill, family: row.family,
    actor: row.actor, market: row.market, locale: row.locale, channel: row.channel, lifecycle: row.lifecycle,
    scenarioId: row.scenario_id, scenarioVariant: row.scenario_variant, teacher: { provider: row.teacher_provider, model: row.teacher_model },
    candidateScore: row.candidate_score === null ? null : Number(row.candidate_score), reviewScores: parse(row.review_scores_json) || null,
    failureDimensions: parse(row.failure_dimensions_json) || [], provenance: parse(row.provenance_json) || {},
    reviewStatus: row.review_status, reviewed: Boolean(row.reviewed), accepted: Boolean(row.accepted),
    reviewerId: row.reviewer_id, reviewerNotes: row.reviewer_notes, rejectionReason: row.rejection_reason,
    version: Number(row.version), originalId: row.original_id, rewriteOf: row.rewrite_of,
    contentHash: row.content_hash, createdAt: row.created_at, updatedAt: row.updated_at,
  };
}

function candidateFromSource(source: any): any {
  const metadata = source.metadata || source.context || {};
  const quality = source.quality || {};
  const provenance = source.provenance || source.source || {};
  const trajectory = source.trajectory || source;
  const exampleId = String(source.exampleId || source.example_id || hash(trajectory).slice(0, 24));
  return {
    exampleId, trajectory, scenarioId: source.scenarioId || source.scenario_id || metadata.scenarioId || null,
    skill: source.skill || source.labels?.skill || metadata.skill || trajectory?.labels?.skill || null,
    family: source.family || source.labels?.family || metadata.family || trajectory?.labels?.family || null,
    actor: source.actor || source.labels?.actor || metadata.actor || trajectory?.labels?.actor || null,
    market: source.market || source.labels?.market || metadata.market || trajectory?.labels?.market || null,
    locale: source.locale || source.labels?.locale || metadata.locale || trajectory?.labels?.locale || null,
    channel: source.channel || source.labels?.channel || metadata.channel || trajectory?.labels?.channel || null,
    lifecycle: source.lifecycle || source.labels?.lifecycle || metadata.lifecycle || trajectory?.labels?.lifecycle || null,
    scenarioVariant: source.scenarioVariant || source.lifecycleVariant || source.labels?.variant || metadata.scenarioVariant || null,
    teacherProvider: source.teacherProvider || provenance.teacherProvider || provenance.provider || source.teacher?.provider || null,
    teacherModel: source.teacherModel || provenance.teacherModel || provenance.model || source.teacher?.model || null,
    candidateScore: Number.isFinite(Number(source.candidateScore ?? source.score ?? quality.score)) ? Number(source.candidateScore ?? source.score ?? quality.score) : null,
    failureDimensions: source.failureDimensions || quality.failureDimensions || quality.failures || [], provenance,
  };
}

export async function importTeacherCandidates(): Promise<{ imported: number; source: string }> {
  await ensureCurationSchema();
  if (!fs.existsSync(DATASET_PATH)) return { imported: 0, source: DATASET_PATH };
  const db = await getDb();
  let imported = 0;
  for (const line of fs.readFileSync(DATASET_PATH, 'utf8').split(/\r?\n/)) {
    if (!line.trim()) continue;
    try {
      const c = candidateFromSource(JSON.parse(line));
      db.run(`INSERT OR IGNORE INTO training_curation_candidates
        (example_id,trajectory_json,skill,family,actor,market,locale,channel,lifecycle,scenario_variant,teacher_provider,teacher_model,candidate_score,failure_dimensions_json,provenance_json,content_hash,scenario_id)
        VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`, [c.exampleId, json(c.trajectory), c.skill, c.family, c.actor, c.market, c.locale, c.channel, c.lifecycle, c.scenarioVariant, c.teacherProvider, c.teacherModel, c.candidateScore, json(c.failureDimensions), json(c.provenance), hash(c.trajectory), c.scenarioId || null]);
      db.run(`UPDATE training_curation_candidates SET skill=COALESCE(skill,?), family=COALESCE(family,?), actor=COALESCE(actor,?), market=COALESCE(market,?), locale=COALESCE(locale,?), channel=COALESCE(channel,?), lifecycle=COALESCE(lifecycle,?), scenario_variant=COALESCE(scenario_variant,?), teacher_provider=COALESCE(teacher_provider,?), teacher_model=COALESCE(teacher_model,?), scenario_id=COALESCE(scenario_id,?) WHERE example_id=? AND review_status='pending'`, [c.skill, c.family, c.actor, c.market, c.locale, c.channel, c.lifecycle, c.scenarioVariant, c.teacherProvider, c.teacherModel, c.scenarioId || null, c.exampleId]);
      imported += 1;
    } catch { /* malformed candidate remains outside the trusted queue */ }
  }
  saveDb();
  return { imported, source: DATASET_PATH };
}

function priority(row: any): number {
  const failures = parse(row.failure_dimensions_json) || [];
  const difficult = failures.length * 20;
  const disagreement = Array.isArray(row.provenance_json) ? 0 : 5;
  const missingMetadata = ['skill', 'family', 'actor', 'market', 'locale', 'channel'].filter(k => !row[k]).length * 3;
  return difficult + disagreement + (100 - Number(row.candidate_score || 0)) + missingMetadata;
}

export async function listCurationCandidates(options: { status?: string; limit?: number; offset?: number; import?: boolean } = {}): Promise<any> {
  if (options.import !== false) await importTeacherCandidates();
  const db = await getDb();
  const limit = Math.min(Math.max(Number(options.limit || 50), 1), 200);
  const offset = Math.max(Number(options.offset || 0), 0);
  const status = options.status && STATUSES.has(options.status as ReviewStatus) ? options.status : null;
  const rows = db.exec(`SELECT * FROM training_curation_candidates ${status ? "WHERE review_status = '" + status + "'" : ''} ORDER BY candidate_score IS NULL ASC, candidate_score ASC, updated_at ASC LIMIT ${limit} OFFSET ${offset}`)[0]?.values || [];
  const columns = db.exec(`PRAGMA table_info(training_curation_candidates)`)[0]?.values?.map((r: any[]) => r[1]) || [];
  const candidates = rows.map((values: any[]) => rowToCandidate(Object.fromEntries(columns.map((c: string, i: number) => [c, values[i]]))));
  const count = Number(db.exec(`SELECT COUNT(*) FROM training_curation_candidates ${status ? "WHERE review_status = '" + status + "'" : ''}`)[0]?.values?.[0]?.[0] || 0);
  return { candidates: candidates.sort((a: any, b: any) => priority(b) - priority(a)), count, limit, offset, statuses: await getCurationStats() };
}

export async function getCurationCandidate(exampleId: string): Promise<any | null> {
  await ensureCurationSchema();
  const db = await getDb();
  const stmt = db.prepare('SELECT * FROM training_curation_candidates WHERE example_id = ? LIMIT 1'); stmt.bind([exampleId]);
  const row = stmt.step() ? stmt.getAsObject() : null; stmt.free(); return row ? rowToCandidate(row) : null;
}

export async function reviewCurationCandidate(input: { exampleId: string; decision: ReviewDecision; reviewerId: string; notes?: string; reason?: string; datasetVersion?: string; reviewScores?: Record<string, number> }): Promise<any> {
  await ensureCurationSchema();
  const current = await getCurationCandidate(input.exampleId);
  if (!current) return { ok: false, status: 'missing' };
  const map: Record<ReviewDecision, ReviewStatus> = { accept: 'accepted', reject: 'rejected', rewrite: 'needs_rewrite', second_review: 'needs_second_review' };
  const next = map[input.decision];
  if (!next) return { ok: false, status: 'invalid_decision' };
  const db = await getDb();
  const accepted = next === 'accepted' ? 1 : 0;
  db.run(`UPDATE training_curation_candidates SET review_status=?, reviewed=1, accepted=?, reviewer_id=?, reviewer_notes=?, rejection_reason=?, review_scores_json=?, updated_at=CURRENT_TIMESTAMP WHERE example_id=?`, [next, accepted, input.reviewerId, input.notes || null, input.reason || null, input.reviewScores ? json(input.reviewScores) : null, input.exampleId]);
  db.run(`INSERT INTO training_curation_audit(example_id,reviewer_id,decision,reason,notes,candidate_version,dataset_version) VALUES(?,?,?,?,?,?,?)`, [input.exampleId, input.reviewerId, input.decision, input.reason || null, input.notes || null, current.version, input.datasetVersion || null]);
  saveDb();
  return { ok: true, candidate: await getCurationCandidate(input.exampleId) };
}

export async function rewriteCurationCandidate(input: { exampleId: string; trajectory: unknown; reviewerId: string; notes?: string; reason?: string }): Promise<any> {
  await ensureCurationSchema();
  const original = await getCurationCandidate(input.exampleId);
  if (!original) return { ok: false, status: 'missing' };
  const rewriteId = `${original.exampleId}:rewrite:${original.version + 1}:${hash(input.trajectory).slice(0, 12)}`;
  const db = await getDb();
  db.run(`INSERT OR IGNORE INTO training_curation_candidates(example_id,trajectory_json,skill,family,actor,market,locale,channel,lifecycle,scenario_variant,teacher_provider,teacher_model,candidate_score,review_scores_json,failure_dimensions_json,provenance_json,review_status,reviewed,accepted,reviewer_id,reviewer_notes,rejection_reason,version,scenario_id,original_id,rewrite_of,content_hash) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`, [rewriteId, json(input.trajectory), original.skill, original.family, original.actor, original.market, original.locale, original.channel, original.lifecycle, original.scenarioVariant, original.teacher.provider, original.teacher.model, null, null, json([]), json({ ...original.provenance, rewrittenFrom: original.exampleId }), 'pending', 0, 0, null, null, input.reason || null, original.version + 1, original.scenarioId || null, original.originalId || original.exampleId, original.exampleId, hash(input.trajectory)]);
  db.run(`UPDATE training_curation_candidates SET review_status='needs_rewrite', reviewed=1, reviewer_id=?, reviewer_notes=?, rejection_reason=?, updated_at=CURRENT_TIMESTAMP WHERE example_id=?`, [input.reviewerId, input.notes || null, input.reason || null, input.exampleId]);
  db.run(`INSERT INTO training_curation_audit(example_id,reviewer_id,decision,reason,notes,candidate_version) VALUES(?,?,?,?,?,?)`, [input.exampleId, input.reviewerId, 'rewrite', input.reason || null, input.notes || null, original.version]);
  saveDb();
  return { ok: true, originalId: original.exampleId, rewriteId, candidate: await getCurationCandidate(rewriteId) };
}

export async function getCurationStats(): Promise<any> {
  await ensureCurationSchema();
  const db = await getDb();
  const counts: Record<string, number> = {};
  for (const row of db.exec('SELECT review_status, COUNT(*) FROM training_curation_candidates GROUP BY review_status')[0]?.values || []) counts[String(row[0])] = Number(row[1]);
  const coverage: Record<string, Record<string, number>> = {};
  for (const dimension of ['skill', 'family', 'actor', 'market', 'locale', 'channel', 'lifecycle']) {
    coverage[dimension] = {};
    for (const row of db.exec(`SELECT COALESCE(${dimension}, 'unknown'), COUNT(*) FROM training_curation_candidates WHERE accepted=1 GROUP BY ${dimension}`)[0]?.values || []) coverage[dimension][String(row[0])] = Number(row[1]);
  }
  return { counts, total: Object.values(counts).reduce((a, b) => a + b, 0), acceptedCoverage: coverage };
}

export async function getAcceptedCorpusGate(requirements: Record<string, number> = {}): Promise<any> {
  const stats = await getCurationStats();
  const accepted = stats.counts.accepted || 0;
  const failures: Record<string, { required: number; actual: number }> = {};
  for (const [dimension, required] of Object.entries(requirements)) {
    const actual = Object.keys(stats.acceptedCoverage[dimension] || {}).filter(k => k !== 'unknown').length;
    if (actual < Number(required)) failures[dimension] = { required: Number(required), actual };
  }
  return { permitted: accepted > 0 && Object.keys(failures).length === 0, accepted, failures, coverage: stats.acceptedCoverage };
}

export async function getCurationAudit(exampleId?: string): Promise<any[]> {
  await ensureCurationSchema();
  const db = await getDb();
  const stmt = db.prepare(`SELECT * FROM training_curation_audit ${exampleId ? 'WHERE example_id=?' : ''} ORDER BY created_at DESC`); if (exampleId) stmt.bind([exampleId]);
  const rows: any[] = []; while (stmt.step()) rows.push(stmt.getAsObject()); stmt.free(); return rows;
}

export function acceptedCorpusHash(candidates: any[]): string { return hash(candidates.map(c => ({ exampleId: c.exampleId, trajectory: c.trajectory, version: c.version })).sort((a, b) => a.exampleId.localeCompare(b.exampleId))); }

export const CURATION_DATASET_PATH = DATASET_PATH;

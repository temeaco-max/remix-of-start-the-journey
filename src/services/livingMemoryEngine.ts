/* Copyright (c) 2026 temeaco-max. All rights reserved. Proprietary and confidential. */
/**
 * Living Memory Engine — Blueprint §4.3
 * Selective retrieval + consolidation lifecycle.
 * AI never sees full history; only a bounded, diverse working context.
 */
import { getDb, saveDb } from '../database.js';
import { persistCoordinatorEvent } from './coordinatorStore.js';
import { getProfile, getMemoryFacts } from './memoryProfile.js';
import { getIntentions } from './deferredRequestService.js';

export type MemoryTier = 'stable' | 'episodic' | 'open_intention' | 'recent_tail';
export type MemoryStatus = 'active' | 'dormant' | 'pruned';

export interface MemoryItem {
  id: string;
  tier: MemoryTier;
  text: string;
  source: string;
  createdAt: string;
  relevance: number;
  mmrScore?: number;
  accessCount?: number;
}

export interface WorkingContextResult {
  context: string;
  selected: MemoryItem[];
  available: MemoryItem[];
  tokenEstimate: number;
  intentClass?: string;
  intentConfidence?: number;
}

const MAX_PER_TIER = 3;
const DEFAULT_K = 8;
const MMR_LAMBDA = 0.7;
const FASTTEXT_TOKEN_BUDGET = 1024;
const GROQ_TOKEN_BUDGET = 2048;

// ── Schema ──────────────────────────────────────────────────────────────

export async function ensureLivingMemorySchema(): Promise<void> {
  const db = await getDb();

  db.run(`CREATE TABLE IF NOT EXISTS ai_audit_log (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    thread_id TEXT,
    user_phone TEXT NOT NULL,
    request_text TEXT NOT NULL,
    intent_class TEXT,
    intent_confidence REAL,
    working_context TEXT,
    available_memory TEXT,
    selected_memory TEXT,
    selection_scores TEXT,
    llm_response TEXT,
    token_count INTEGER,
    cost_pence INTEGER DEFAULT 0,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
  )`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_ai_audit_log_user ON ai_audit_log(user_phone, created_at)`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_ai_audit_log_thread ON ai_audit_log(thread_id, created_at)`);

  // memory_profiles lifecycle columns
  const mpCols = (db.exec('PRAGMA table_info(memory_profiles)')[0]?.values || []).map((r: any[]) => r[1]);
  const mpAdd: Record<string, string> = {
    open_intentions: "TEXT DEFAULT '[]'",
    memory_last_consolidated_at: 'TEXT',
    memory_health_score: 'REAL DEFAULT 1.0',
  };
  for (const [name, type] of Object.entries(mpAdd)) {
    if (!mpCols.includes(name)) {
      try { db.run(`ALTER TABLE memory_profiles ADD COLUMN ${name} ${type}`); } catch { /* exists */ }
    }
  }

  // messages memory lifecycle columns
  const msgCols = (db.exec('PRAGMA table_info(messages)')[0]?.values || []).map((r: any[]) => r[1]);
  const msgAdd: Record<string, string> = {
    memory_tier: "TEXT DEFAULT 'episodic'",
    access_count: 'INTEGER DEFAULT 0',
    relevance_score: 'REAL DEFAULT 0.5',
    last_accessed_at: 'TEXT',
    memory_status: "TEXT DEFAULT 'active'",
    thread_id: 'TEXT',
  };
  for (const [name, type] of Object.entries(msgAdd)) {
    if (!msgCols.includes(name)) {
      try { db.run(`ALTER TABLE messages ADD COLUMN ${name} ${type}`); } catch { /* exists */ }
    }
  }
  db.run(`CREATE INDEX IF NOT EXISTS idx_messages_memory_tier ON messages(memory_tier, phone, created_at)`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_messages_memory_status ON messages(memory_status, last_accessed_at)`);

  saveDb();
}

// ── Token estimate (rough) ──────────────────────────────────────────────

function estimateTokens(text: string): number {
  return Math.max(1, Math.ceil(String(text || '').length / 4));
}

// ── Keyword relevance (no embedding dependency at launch) ───────────────

function tokenize(text: string): Set<string> {
  return new Set(
    String(text || '')
      .toLowerCase()
      .replace(/[^a-z0-9\s+]/g, ' ')
      .split(/\s+/)
      .filter((t) => t.length > 2)
  );
}

function keywordRelevance(query: string, candidate: string): number {
  const q = tokenize(query);
  const c = tokenize(candidate);
  if (q.size === 0 || c.size === 0) return 0.05;
  let overlap = 0;
  for (const t of q) if (c.has(t)) overlap++;
  const union = new Set([...q, ...c]).size;
  const jaccard = overlap / union;
  // Boost if query terms appear early / densely
  const density = overlap / Math.max(1, q.size);
  return Math.min(1, jaccard * 0.6 + density * 0.4 + 0.05);
}

function textSimilarity(a: string, b: string): number {
  return keywordRelevance(a, b);
}

// ── Candidate collection ────────────────────────────────────────────────

async function collectStable(phone: string): Promise<MemoryItem[]> {
  const profile = await getProfile(phone, 'living_memory');
  const facts = await getMemoryFacts(phone, ['name', 'location']);
  const items: MemoryItem[] = [];
  if (!profile) return items;

  const nameFact = facts.find((fact) => fact.field === 'name');
  if (nameFact) {
    items.push({
      id: `stable:fact:${nameFact.id}`,
      tier: 'stable',
      text: `User name: ${nameFact.value}`,
      source: `memory_facts.name:${nameFact.provenance}`,
      createdAt: nameFact.observedAt,
      relevance: 0.3,
    });
  }
  const locationFact = facts.find((fact) => fact.field === 'location');
  if (locationFact) {
    items.push({
      id: `stable:fact:${locationFact.id}`,
      tier: 'stable',
      text: `Primary location: ${locationFact.value}`,
      source: `memory_facts.location:${locationFact.provenance}`,
      createdAt: locationFact.observedAt,
      relevance: 0.4,
    });
  }
  if (profile.inferred_roles) {
    try {
      const roles = typeof profile.inferred_roles === 'string' ? JSON.parse(profile.inferred_roles) : profile.inferred_roles;
      const list = Array.isArray(roles) ? roles : Object.keys(roles || {});
      if (list.length) {
        items.push({
          id: `stable:roles`,
          tier: 'stable',
          text: `Inferred roles/skills: ${list.slice(0, 8).join(', ')}`,
          source: 'memory_profiles.inferred_roles:inferred',
          createdAt: profile.updated_at || new Date().toISOString(),
          relevance: 0.45,
        });
      }
    } catch { /* ignore */ }
  }
  if (profile.subscription_tier) {
    items.push({
      id: `stable:tier`,
      tier: 'stable',
      text: `Subscription: ${profile.subscription_tier}; Points: ${profile.points_balance ?? profile.wallet_balance_minor ?? 0}`,
      source: 'memory_profiles.subscription:system_state',
      createdAt: profile.updated_at || new Date().toISOString(),
      relevance: 0.25,
    });
  }
  return items;
}

async function collectEpisodic(phone: string, limit = 40): Promise<MemoryItem[]> {
  await ensureLivingMemorySchema();
  const db = await getDb();
  const stmt = db.prepare(`
    SELECT id, content, sender, created_at, memory_tier, access_count, relevance_score, memory_status
    FROM messages
    WHERE phone = ?
      AND COALESCE(memory_status, 'active') = 'active'
      AND COALESCE(memory_tier, 'episodic') IN ('episodic', 'stable')
    ORDER BY id DESC
    LIMIT ?
  `);
  stmt.bind([phone, limit]);
  const items: MemoryItem[] = [];
  while (stmt.step()) {
    const r = stmt.getAsObject() as any;
    const content = String(r.content || '').trim();
    if (!content || content.length < 3) continue;
    items.push({
      id: `msg:${r.id}`,
      tier: (r.memory_tier === 'stable' ? 'stable' : 'episodic') as MemoryTier,
      text: `${r.sender}: ${content.slice(0, 400)}`,
      source: 'messages',
      createdAt: String(r.created_at || ''),
      relevance: Number(r.relevance_score ?? 0.5),
      accessCount: Number(r.access_count ?? 0),
    });
  }
  stmt.free();
  return items;
}

async function collectOpenIntentions(phone: string): Promise<MemoryItem[]> {
  const intentions = await getIntentions(phone);
  return intentions
    .filter((i: any) => ['requested', 'awaiting_match', 'partially_matched', 'open'].includes(String(i.status)))
    .slice(0, 5)
    .map((i: any) => ({
      id: `intention:${i.id}`,
      tier: 'open_intention' as MemoryTier,
      text: `Open intention: ${i.intent}${i.skill ? ` (skill: ${i.skill})` : ''}${i.location ? ` @ ${i.location}` : ''}. Context: ${String(i.context || '').slice(0, 200)}`,
      source: 'open_intentions',
      createdAt: String(i.created_at || ''),
      relevance: 0.7,
    }));
}

async function collectRecentTail(phone: string, limit = 10): Promise<MemoryItem[]> {
  await ensureLivingMemorySchema();
  const db = await getDb();
  const stmt = db.prepare(`
    SELECT id, content, sender, created_at
    FROM messages
    WHERE phone = ?
    ORDER BY id DESC
    LIMIT ?
  `);
  stmt.bind([phone, limit]);
  const items: MemoryItem[] = [];
  while (stmt.step()) {
    const r = stmt.getAsObject() as any;
    const content = String(r.content || '').trim();
    if (!content) continue;
    items.push({
      id: `tail:${r.id}`,
      tier: 'recent_tail',
      text: `${r.sender}: ${content.slice(0, 300)}`,
      source: 'messages.recent',
      createdAt: String(r.created_at || ''),
      relevance: 0.6,
    });
  }
  stmt.free();
  return items.reverse();
}

// ── MMR retrieval ───────────────────────────────────────────────────────

export function mmrSelect(query: string, candidates: MemoryItem[], k = DEFAULT_K): MemoryItem[] {
  if (candidates.length === 0) return [];

  const scored = candidates.map((item) => ({
    ...item,
    relevance: Math.max(item.relevance || 0, keywordRelevance(query, item.text)),
  }));

  const remaining = [...scored].sort((a, b) => b.relevance - a.relevance);
  const selected: MemoryItem[] = [];
  const tierCounts = new Map<string, number>();

  while (selected.length < k && remaining.length > 0) {
    // Re-score remaining by MMR
    for (const item of remaining) {
      const maxSim = selected.reduce((max, s) => Math.max(max, textSimilarity(item.text, s.text)), 0);
      item.mmrScore = item.relevance - MMR_LAMBDA * maxSim;
    }
    remaining.sort((a, b) => (b.mmrScore ?? 0) - (a.mmrScore ?? 0));

    const next = remaining.shift()!;
    const count = tierCounts.get(next.tier) || 0;
    if (count >= MAX_PER_TIER) continue;
    tierCounts.set(next.tier, count + 1);
    selected.push(next);
  }

  return selected;
}

export function assembleContext(selected: MemoryItem[], maxTokens: number): { context: string; tokenEstimate: number } {
  const parts: string[] = [];
  const seen = new Set<string>();
  let tokens = 0;
  for (const item of selected) {
    const line = `[${item.tier}] ${item.text}`;
    const dedupeKey = line.trim().replace(/\s+/g, ' ').toLocaleLowerCase();
    if (seen.has(dedupeKey)) continue;
    const t = estimateTokens(line);
    if (tokens + t > maxTokens) break;
    seen.add(dedupeKey);
    parts.push(line);
    tokens += t;
  }
  return { context: parts.join('\n'), tokenEstimate: tokens };
}

async function touchSelected(selected: MemoryItem[]): Promise<void> {
  const db = await getDb();
  const now = new Date().toISOString();
  for (const item of selected) {
    if (!item.id.startsWith('msg:') && !item.id.startsWith('tail:')) continue;
    const msgId = Number(item.id.split(':')[1]);
    if (!Number.isFinite(msgId)) continue;
    db.run(
      `UPDATE messages SET access_count = COALESCE(access_count, 0) + 1, last_accessed_at = ?, relevance_score = MIN(1.0, COALESCE(relevance_score, 0.5) + 0.05) WHERE id = ?`,
      [now, msgId]
    );
  }
  saveDb();
}

// ── Public API ──────────────────────────────────────────────────────────

export async function buildWorkingContext(
  phone: string,
  query: string,
  options: { intentClass?: string; intentConfidence?: number; route?: 'fasttext' | 'groq' | 'smollm2' | string; threadId?: string } = {}
): Promise<WorkingContextResult> {
  await ensureLivingMemorySchema();

  const [stable, episodic, intentions, recent] = await Promise.all([
    collectStable(phone),
    collectEpisodic(phone),
    collectOpenIntentions(phone),
    collectRecentTail(phone),
  ]);

  const available = [...stable, ...episodic, ...intentions, ...recent];
  const selected = mmrSelect(query, available, DEFAULT_K);
  const budget = options.route === 'fasttext' || options.route === 'smollm2' ? FASTTEXT_TOKEN_BUDGET : GROQ_TOKEN_BUDGET;
  const { context, tokenEstimate } = assembleContext(selected, budget);

  await touchSelected(selected);
  await persistCoordinatorEvent({
    id: `memory-retrieval:${phone}:${options.threadId || 'default'}:${Date.now()}`,
    type: 'memory.context.retrieved',
    occurredAt: new Date().toISOString(),
    producer: 'livingMemoryEngine',
    correlationId: `conversation:${options.threadId || 'default'}`,
    ownerPhone: phone.startsWith('anon_') ? undefined : phone,
    payload: {
      threadId: options.threadId,
      route: options.route,
      intentClass: options.intentClass,
      intentConfidence: options.intentConfidence,
      selectedCount: selected.length,
      availableCount: available.length,
      tokenEstimate,
      selectedTiers: Array.from(new Set(selected.map((item) => item.tier))),
      selectedSources: Array.from(new Set(selected.map((item) => item.source))),
    },
    sensitivity: phone.startsWith('anon_') ? 'public' : 'personal',
    provenance: { source: 'canonical_service', sourceId: options.threadId || phone, evidenceLevel: 'persisted_state' },
    policy: { autonomousAllowed: false, confirmationRequired: 'none' },
    schemaVersion: 1,
  });

  return {
    context,
    selected,
    available,
    tokenEstimate,
    intentClass: options.intentClass,
    intentConfidence: options.intentConfidence,
  };
}

export async function logAiAudit(entry: {
  phone: string;
  requestText: string;
  threadId?: string;
  intentClass?: string;
  intentConfidence?: number;
  workingContext: string;
  available: MemoryItem[];
  selected: MemoryItem[];
  llmResponse?: string;
  tokenCount?: number;
  costPence?: number;
}): Promise<void> {
  await ensureLivingMemorySchema();
  const db = await getDb();
  db.run(
    `INSERT INTO ai_audit_log (thread_id, user_phone, request_text, intent_class, intent_confidence, working_context, available_memory, selected_memory, selection_scores, llm_response, token_count, cost_pence)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      entry.threadId || null,
      entry.phone,
      entry.requestText.slice(0, 4000),
      entry.intentClass || null,
      entry.intentConfidence ?? null,
      entry.workingContext.slice(0, 8000),
      JSON.stringify(entry.available.slice(0, 30).map((m) => ({ id: m.id, tier: m.tier, relevance: m.relevance, text: m.text.slice(0, 200) }))),
      JSON.stringify(entry.selected.map((m) => ({ id: m.id, tier: m.tier, mmr: m.mmrScore, relevance: m.relevance, text: m.text.slice(0, 200) }))),
      JSON.stringify(entry.selected.map((m) => ({ id: m.id, relevance: m.relevance, mmr: m.mmrScore }))),
      entry.llmResponse ? entry.llmResponse.slice(0, 4000) : null,
      entry.tokenCount ?? null,
      entry.costPence ?? 0,
    ]
  );
  saveDb();
}

/** Enrich a system prompt with living memory working context. */
export async function withMemoryContext(
  phone: string | undefined,
  userPrompt: string,
  baseSystemPrompt?: string,
  meta?: { intentClass?: string; intentConfidence?: number; route?: string; threadId?: string }
): Promise<{ systemPrompt: string; working?: WorkingContextResult }> {
  if (!phone) return { systemPrompt: baseSystemPrompt || '' };

  try {
    const working = await buildWorkingContext(phone, userPrompt, meta);
    const memoryBlock = working.context
      ? `\n\n--- Living Memory (selective, not full history) ---\n${working.context}\n---`
      : '';
    const systemPrompt = `${baseSystemPrompt || 'You are Kurukoo, a trusted everyday utility assistant for Nigeria and the diaspora.'}${memoryBlock}`;

    // Fire-and-forget audit (don't block response path on write)
    logAiAudit({
      phone,
      requestText: userPrompt,
      threadId: meta?.threadId,
      intentClass: meta?.intentClass || working.intentClass,
      intentConfidence: meta?.intentConfidence ?? working.intentConfidence,
      workingContext: working.context,
      available: working.available,
      selected: working.selected,
      tokenCount: working.tokenEstimate,
    }).catch(() => {});

    return { systemPrompt, working };
  } catch (e) {
    console.error('[LivingMemory] context build failed:', e);
    return { systemPrompt: baseSystemPrompt || '' };
  }
}

// ── Lifecycle jobs ──────────────────────────────────────────────────────

/** Daily decay: reduce relevance for inactive memories. */
export async function runDailyMemoryDecay(): Promise<{ updated: number }> {
  await ensureLivingMemorySchema();
  const db = await getDb();
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
  db.run(`
    UPDATE messages
    SET relevance_score = MAX(0.05, COALESCE(relevance_score, 0.5) * 0.9),
        memory_status = CASE
          WHEN COALESCE(relevance_score, 0.5) * 0.9 < 0.1 THEN 'dormant'
          ELSE COALESCE(memory_status, 'active')
        END
    WHERE (last_accessed_at IS NULL OR last_accessed_at < ?)
      AND COALESCE(memory_status, 'active') = 'active'
      AND COALESCE(memory_tier, 'episodic') = 'episodic'
  `, [thirtyDaysAgo]);
  const updated = db.getRowsModified();
  saveDb();
  return { updated };
}

/** Weekly prune: remove long-dormant episodic messages. */
export async function runWeeklyMemoryPrune(): Promise<{ deleted: number }> {
  await ensureLivingMemorySchema();
  const db = await getDb();
  const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString();
  db.run(`
    DELETE FROM messages
    WHERE COALESCE(memory_tier, 'episodic') = 'episodic'
      AND COALESCE(memory_status, 'active') = 'dormant'
      AND created_at < ?
  `, [ninetyDaysAgo]);
  const deleted = db.getRowsModified();
  saveDb();
  return { deleted };
}

/** Crystallize repeated behavior into explicit skills. */
export async function runMemoryCrystallize(): Promise<{ promoted: number }> {
  await ensureLivingMemorySchema();
  const db = await getDb();
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
  const stmt = db.prepare(`
    SELECT phone, key, COUNT(*) AS observation_count
    FROM user_behavior_signals
    WHERE created_at > ?
      AND signal_type IN ('skill_interest', 'skill_use', 'accept', 'complete')
    GROUP BY phone, key
    HAVING observation_count >= 5
  `);
  stmt.bind([thirtyDaysAgo]);
  let promoted = 0;
  while (stmt.step()) {
    const row = stmt.getAsObject() as any;
    const phone = String(row.phone);
    const skill = String(row.key || '').trim().toLowerCase();
    if (!skill) continue;
    const existing = db.prepare(`SELECT id FROM skills WHERE phone = ? AND lower(skill) = ? LIMIT 1`);
    existing.bind([phone, skill]);
    if (existing.step()) {
      db.run(`UPDATE skills SET source = 'explicit', confidence = 1.0 WHERE phone = ? AND lower(skill) = ?`, [phone, skill]);
    } else {
      db.run(
        `INSERT INTO skills (phone, skill, source, confidence, is_available) VALUES (?, ?, 'crystallized', 0.9, 1)`,
        [phone, skill]
      );
    }
    existing.free();
    promoted++;
  }
  stmt.free();

  // Update memory health scores
  db.run(`
    UPDATE memory_profiles
    SET memory_last_consolidated_at = CURRENT_TIMESTAMP,
        memory_health_score = COALESCE((
          SELECT AVG(COALESCE(relevance_score, 0.5)) FROM messages WHERE messages.phone = memory_profiles.phone AND COALESCE(memory_status, 'active') = 'active'
        ), 1.0)
  `);
  saveDb();
  return { promoted };
}

/** Tag a newly saved message with a memory tier. */
export async function classifyMessageTier(messageId: number, tier: MemoryTier = 'episodic'): Promise<void> {
  await ensureLivingMemorySchema();
  const db = await getDb();
  db.run(`UPDATE messages SET memory_tier = ?, memory_status = 'active', relevance_score = COALESCE(relevance_score, 0.5) WHERE id = ?`, [tier, messageId]);
  saveDb();
}

export async function getWorkingContextInspector(phone: string, requestId?: number): Promise<any> {
  await ensureLivingMemorySchema();
  const db = await getDb();
  if (requestId) {
    const stmt = db.prepare(`SELECT * FROM ai_audit_log WHERE id = ? AND user_phone = ?`);
    stmt.bind([requestId, phone]);
    const row = stmt.step() ? stmt.getAsObject() : null;
    stmt.free();
    return row;
  }
  const stmt = db.prepare(`SELECT * FROM ai_audit_log WHERE user_phone = ? ORDER BY id DESC LIMIT 20`);
  stmt.bind([phone]);
  const rows: any[] = [];
  while (stmt.step()) rows.push(stmt.getAsObject());
  stmt.free();
  return rows;
}

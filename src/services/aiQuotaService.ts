/**
 * Hard AI quotas — cost discipline for free cascade.
 * Per-user daily request + estimated token budgets; global soft ceiling.
 */
import { getDb, saveDb } from '../database.js';

export type QuotaKind = 'simple' | 'complex' | 'embedding';

const DEFAULTS = {
  // Per user per UTC day
  maxSimpleRequests: Number(process.env.AI_QUOTA_SIMPLE_PER_DAY || 80),
  maxComplexRequests: Number(process.env.AI_QUOTA_COMPLEX_PER_DAY || 25),
  maxTokensPerDay: Number(process.env.AI_QUOTA_TOKENS_PER_DAY || 80_000),
  // Global (all users) soft ceiling — only logged / optional hard block
  globalComplexPerMinute: Number(process.env.AI_QUOTA_GLOBAL_COMPLEX_PER_MIN || 120),
  hardBlockWhenExceeded: process.env.AI_QUOTA_HARD_BLOCK !== 'false',
};

async function ensureQuotaTables(): Promise<void> {
  const db = await getDb();
  db.run(`CREATE TABLE IF NOT EXISTS ai_usage_daily (
    phone TEXT NOT NULL,
    day TEXT NOT NULL,
    simple_requests INTEGER DEFAULT 0,
    complex_requests INTEGER DEFAULT 0,
    tokens_est INTEGER DEFAULT 0,
    PRIMARY KEY (phone, day)
  )`);
  db.run(`CREATE TABLE IF NOT EXISTS ai_usage_minute (
    bucket TEXT PRIMARY KEY,
    complex_count INTEGER DEFAULT 0
  )`);
  saveDb();
}

function utcDay(): string {
  return new Date().toISOString().slice(0, 10);
}

function minuteBucket(): string {
  const d = new Date();
  return `${d.toISOString().slice(0, 16)}`; // YYYY-MM-DDTHH:MM
}

export interface QuotaDecision {
  allowed: boolean;
  reason?: string;
  remaining: {
    simple: number;
    complex: number;
    tokens: number;
  };
  downgradeToTemplate?: boolean;
}

export async function checkAiQuota(
  phone: string | undefined,
  kind: QuotaKind,
  estimatedTokens = 500
): Promise<QuotaDecision> {
  if (!phone) {
    return {
      allowed: true,
      remaining: {
        simple: DEFAULTS.maxSimpleRequests,
        complex: DEFAULTS.maxComplexRequests,
        tokens: DEFAULTS.maxTokensPerDay,
      },
    };
  }

  await ensureQuotaTables();
  const db = await getDb();
  const day = utcDay();
  const stmt = db.prepare(`SELECT simple_requests, complex_requests, tokens_est FROM ai_usage_daily WHERE phone = ? AND day = ?`);
  stmt.bind([phone, day]);
  let simple = 0;
  let complex = 0;
  let tokens = 0;
  if (stmt.step()) {
    const row = stmt.getAsObject() as any;
    simple = Number(row.simple_requests || 0);
    complex = Number(row.complex_requests || 0);
    tokens = Number(row.tokens_est || 0);
  }
  stmt.free();

  const remaining = {
    simple: Math.max(0, DEFAULTS.maxSimpleRequests - simple),
    complex: Math.max(0, DEFAULTS.maxComplexRequests - complex),
    tokens: Math.max(0, DEFAULTS.maxTokensPerDay - tokens),
  };

  if (tokens + estimatedTokens > DEFAULTS.maxTokensPerDay) {
    return {
      allowed: !DEFAULTS.hardBlockWhenExceeded,
      reason: 'Daily AI token budget reached',
      remaining,
      downgradeToTemplate: true,
    };
  }

  if (kind === 'simple' && simple >= DEFAULTS.maxSimpleRequests) {
    return {
      allowed: !DEFAULTS.hardBlockWhenExceeded,
      reason: 'Daily simple AI request quota reached',
      remaining,
      downgradeToTemplate: true,
    };
  }

  if (kind === 'complex' && complex >= DEFAULTS.maxComplexRequests) {
    return {
      allowed: !DEFAULTS.hardBlockWhenExceeded,
      reason: 'Daily complex AI request quota reached',
      remaining,
      downgradeToTemplate: true,
    };
  }

  // Global complex rate soft check
  if (kind === 'complex') {
    const bucket = minuteBucket();
    const g = db.prepare(`SELECT complex_count FROM ai_usage_minute WHERE bucket = ?`);
    g.bind([bucket]);
    let gCount = 0;
    if (g.step()) gCount = Number(g.getAsObject().complex_count || 0);
    g.free();
    if (gCount >= DEFAULTS.globalComplexPerMinute) {
      return {
        allowed: false,
        reason: 'Platform AI rate limit — try again shortly',
        remaining,
        downgradeToTemplate: true,
      };
    }
  }

  return { allowed: true, remaining };
}

export async function recordAiUsage(
  phone: string | undefined,
  kind: QuotaKind,
  estimatedTokens = 500
): Promise<void> {
  if (!phone) return;
  await ensureQuotaTables();
  const db = await getDb();
  const day = utcDay();
  db.run(
    `INSERT INTO ai_usage_daily (phone, day, simple_requests, complex_requests, tokens_est)
     VALUES (?, ?, ?, ?, ?)
     ON CONFLICT(phone, day) DO UPDATE SET
       simple_requests = simple_requests + excluded.simple_requests,
       complex_requests = complex_requests + excluded.complex_requests,
       tokens_est = tokens_est + excluded.tokens_est`,
    [
      phone,
      day,
      kind === 'simple' ? 1 : 0,
      kind === 'complex' ? 1 : 0,
      Math.max(0, Math.round(estimatedTokens)),
    ]
  );

  if (kind === 'complex') {
    const bucket = minuteBucket();
    db.run(
      `INSERT INTO ai_usage_minute (bucket, complex_count) VALUES (?, 1)
       ON CONFLICT(bucket) DO UPDATE SET complex_count = complex_count + 1`,
      [bucket]
    );
  }
  saveDb();
}

export async function getAiQuotaStatus(phone: string): Promise<QuotaDecision['remaining'] & { day: string }> {
  const decision = await checkAiQuota(phone, 'simple', 0);
  return { ...decision.remaining, day: utcDay() };
}

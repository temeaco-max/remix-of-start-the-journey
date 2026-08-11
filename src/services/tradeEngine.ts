/**
 * Transaction Orchestration Engine — Blueprint §33.1.3
 *
 * Drives economic_requests through the skillFlows state machine and
 * coordinates matching → quote → confirmation → escrow → fulfillment → release.
 * Never performs arbitrage or synthetic value creation.
 */
import { getDb, saveDb } from '../database.js';
import { addPoints } from './pointsEngine.js';
import { ensureEscrowSchema, createEscrow, releaseEscrow } from './escrow.js';
import { find_worker } from './find-worker.js';
import {
  getEconomicRequest,
  transitionEconomicRequest,
  type EconomicRequest,
  type EconomicRequestStatus,
} from './skillFlows.js';

const MATCH_BATCH = 25;
const QUOTE_DEFAULT_MINOR = 500; // fallback quote when provider has no rate

export interface OrchestrationResult {
  scanned: number;
  matched: number;
  quoted: number;
  escrowed: number;
  released: number;
  failed: number;
  errors: string[];
}

async function listEconomicByStatus(statuses: EconomicRequestStatus[], limit = MATCH_BATCH): Promise<EconomicRequest[]> {
  const db = await getDb();
  db.run(`CREATE TABLE IF NOT EXISTS economic_requests (
    id TEXT PRIMARY KEY, phone TEXT NOT NULL, skill TEXT NOT NULL, category TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'requested', requirements_json TEXT NOT NULL DEFAULT '{}',
    capabilities_json TEXT NOT NULL DEFAULT '[]', provider_phone TEXT, quote_json TEXT,
    fulfillment_json TEXT, created_at TEXT DEFAULT CURRENT_TIMESTAMP, updated_at TEXT DEFAULT CURRENT_TIMESTAMP
  )`);
  const placeholders = statuses.map(() => '?').join(',');
  const stmt = db.prepare(
    `SELECT id FROM economic_requests WHERE status IN (${placeholders}) ORDER BY updated_at ASC LIMIT ?`
  );
  stmt.bind([...statuses, limit]);
  const ids: string[] = [];
  while (stmt.step()) ids.push(String(stmt.getAsObject().id));
  stmt.free();

  const out: EconomicRequest[] = [];
  for (const id of ids) {
    const req = await getEconomicRequest(id);
    if (req) out.push(req);
  }
  return out;
}

/** Step: requested / awaiting_match → matched (or partially_matched / abandoned). */
async function orchestrateMatching(req: EconomicRequest): Promise<'matched' | 'partial' | 'none'> {
  const location =
    typeof req.requirements?.location === 'string'
      ? req.requirements.location
      : typeof req.requirements?.origin === 'string'
        ? String(req.requirements.origin)
        : undefined;

  const result = await find_worker({ skill: req.skill, location, max: 5 });
  if (result.count === 0) {
    if (req.status === 'requested') {
      await transitionEconomicRequest(req.id, 'awaiting_match');
    }
    return 'none';
  }

  const top = result.providers[0];
  if (result.count === 1) {
    await transitionEconomicRequest(req.id, 'matched', { providerPhone: top.phone });
    return 'matched';
  }

  // Multiple candidates: mark partially matched with top candidate reserved for quote
  await transitionEconomicRequest(req.id, 'partially_matched', {
    providerPhone: top.phone,
    fulfillment: {
      candidates: result.providers.map((p) => ({
        phone: p.phone,
        name: p.name,
        rating: p.rating,
        hourly_rate: p.hourly_rate,
      })),
    },
  });
  // Advance strongest candidate to matched for quote path
  await transitionEconomicRequest(req.id, 'matched', { providerPhone: top.phone });
  return 'matched';
}

/** Step: matched → quoting → quoted. */
async function orchestrateQuote(req: EconomicRequest): Promise<boolean> {
  const amountFromReq =
    typeof req.requirements?.amount_minor === 'number'
      ? Number(req.requirements.amount_minor)
      : typeof req.requirements?.amount === 'number'
        ? Number(req.requirements.amount)
        : null;

  let amountMinor = amountFromReq && amountFromReq > 0 ? Math.round(amountFromReq) : QUOTE_DEFAULT_MINOR;

  if (req.providerPhone) {
    const db = await getDb();
    const stmt = db.prepare(`SELECT hourly_rate FROM skills WHERE phone = ? AND lower(skill) = lower(?) LIMIT 1`);
    stmt.bind([req.providerPhone, req.skill]);
    if (stmt.step()) {
      const rate = Number(stmt.getAsObject().hourly_rate || 0);
      if (rate > 0) amountMinor = Math.round(rate);
    }
    stmt.free();
  }

  await transitionEconomicRequest(req.id, 'quoting');
  await transitionEconomicRequest(req.id, 'quoted', {
    quote: {
      amount_minor: amountMinor,
      currency: 'NGN',
      skill: req.skill,
      provider_phone: req.providerPhone,
      generated_at: new Date().toISOString(),
      valid_for_hours: 24,
    },
  });
  return true;
}

/** Step: paid / in_fulfillment path — create order + escrow when payment confirmed externally. */
export async function lockEscrowForEconomicRequest(
  requestId: string,
  amountMinor?: number
): Promise<{ success: boolean; orderId?: string; escrowId?: number; message: string }> {
  const req = await getEconomicRequest(requestId);
  if (!req) return { success: false, message: 'Economic request not found' };
  if (!req.providerPhone) return { success: false, message: 'No provider matched yet' };

  const allowed: EconomicRequestStatus[] = ['quoted', 'awaiting_confirmation', 'reserved', 'payment_pending', 'paid'];
  if (!allowed.includes(req.status)) {
    return { success: false, message: `Cannot lock escrow from status ${req.status}` };
  }

  const quoteAmount =
    amountMinor ??
    (req.quote && typeof (req.quote as any).amount_minor === 'number'
      ? Number((req.quote as any).amount_minor)
      : QUOTE_DEFAULT_MINOR);

  if (!Number.isInteger(quoteAmount) || quoteAmount <= 0) {
    return { success: false, message: 'Invalid escrow amount' };
  }

  const orderId = `eco_${requestId.slice(0, 8)}_${Date.now()}`;
  const db = await getDb();
  db.run(
    `INSERT OR IGNORE INTO orders (id, phone, order_type, provider_phone, amount, status, idempotency_key) VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [orderId, req.phone, req.skill, req.providerPhone, quoteAmount, 'escrow_held', `eco:${requestId}`]
  );

  const escrowId = await createEscrow(
    orderId,
    req.phone,
    req.providerPhone,
    quoteAmount,
    `Escrow for economic request ${requestId} (${req.skill})`
  );

  // Advance request toward fulfillment
  if (req.status === 'quoted' || req.status === 'awaiting_confirmation') {
    try { await transitionEconomicRequest(requestId, 'reserved'); } catch { /* may already be past */ }
  }
  if (['reserved', 'payment_pending'].includes(req.status) || req.status === 'quoted') {
    try { await transitionEconomicRequest(requestId, 'payment_pending'); } catch { /* */ }
  }
  try {
    await transitionEconomicRequest(requestId, 'paid', {
      fulfillment: { order_id: orderId, escrow_id: escrowId, locked_at: new Date().toISOString() },
    });
    await transitionEconomicRequest(requestId, 'in_fulfillment');
  } catch (e) {
    // Status may already be advanced; still succeed if escrow exists
  }

  saveDb();
  return { success: true, orderId, escrowId, message: 'Escrow locked and request moved to fulfillment' };
}

/** Step: mark fulfillment complete → completed (after delivery confirmation). */
export async function completeEconomicRequest(
  requestId: string,
  evidence?: Record<string, unknown>
): Promise<{ success: boolean; message: string }> {
  const req = await getEconomicRequest(requestId);
  if (!req) return { success: false, message: 'Economic request not found' };

  try {
    if (req.status === 'in_fulfillment' || req.status === 'paid') {
      await transitionEconomicRequest(requestId, 'fulfilled', {
        fulfillment: { ...(req.fulfillment || {}), ...(evidence || {}), fulfilled_at: new Date().toISOString() },
      });
    }
    await transitionEconomicRequest(requestId, 'completed');
  } catch (e) {
    return { success: false, message: e instanceof Error ? e.message : 'Transition failed' };
  }

  // Mark linked order delivered so escrow pass can release after cooling-off
  const orderId = (req.fulfillment as any)?.order_id;
  if (orderId) {
    const db = await getDb();
    db.run(`UPDATE orders SET status = 'delivered' WHERE id = ? AND status IN ('escrow_held','paid','in_fulfillment','delivered')`, [
      orderId,
    ]);
    saveDb();
  }

  return { success: true, message: 'Economic request completed; escrow release scheduled after cooling-off' };
}

/**
 * Escrow release worker (held + delivered/completed + cooling-off elapsed).
 * Idempotent: will not double-award points.
 */
export async function runEscrowPass(): Promise<number> {
  const db = await getDb();
  await ensureEscrowSchema(db);
  let released = 0;

  const stmt = db.prepare(`
    SELECT o.id AS order_id,
           o.status AS order_status,
           e.id AS escrow_id,
           e.provider_phone,
           e.amount_minor,
           e.status AS escrow_status,
           e.cooling_off_until
    FROM orders o
    JOIN escrow e ON o.id = e.order_id
    WHERE o.status IN ('delivered', 'completed')
      AND e.status = 'held'
      AND (e.cooling_off_until IS NULL OR datetime(e.cooling_off_until) <= datetime('now'))
  `);

  while (stmt.step()) {
    const row = stmt.getAsObject() as any;
    const escrowId = Number(row.escrow_id);
    const orderId = String(row.order_id);
    try {
      const ok = await releaseEscrow(escrowId);
      if (!ok) continue;

      const marker = `escrow_release:${escrowId}`;
      const tx = db.prepare(`SELECT id FROM credit_transactions WHERE description = ? LIMIT 1`);
      tx.bind([marker]);
      const alreadyRewarded = tx.step();
      tx.free();
      if (!alreadyRewarded) {
        await addPoints(String(row.provider_phone), Number(row.amount_minor), marker);
      }

      db.run(`UPDATE orders SET status = 'completed' WHERE id = ? AND status IN ('delivered','completed')`, [orderId]);
      db.run(`UPDATE escrow SET completed_at = COALESCE(completed_at, CURRENT_TIMESTAMP) WHERE id = ?`, [escrowId]);
      released++;
    } catch (error) {
      console.error(`[Transaction Engine] Failed escrow ${escrowId} for order ${orderId}:`, error);
    }
  }
  stmt.free();
  saveDb();
  return released;
}

/**
 * Full orchestration pass:
 * 1) Match open economic requests
 * 2) Quote matched requests
 * 3) Release eligible escrow
 */
export async function runOrchestrationPass(): Promise<OrchestrationResult> {
  const result: OrchestrationResult = {
    scanned: 0,
    matched: 0,
    quoted: 0,
    escrowed: 0,
    released: 0,
    failed: 0,
    errors: [],
  };

  // 1. Matching
  try {
    const toMatch = await listEconomicByStatus(['requested', 'awaiting_match', 'partially_matched']);
    result.scanned += toMatch.length;
    for (const req of toMatch) {
      try {
        const outcome = await orchestrateMatching(req);
        if (outcome === 'matched') result.matched++;
      } catch (e) {
        result.failed++;
        result.errors.push(`match:${req.id}:${e instanceof Error ? e.message : String(e)}`);
      }
    }
  } catch (e) {
    result.errors.push(`match_batch:${e instanceof Error ? e.message : String(e)}`);
  }

  // 2. Quoting
  try {
    const toQuote = await listEconomicByStatus(['matched']);
    result.scanned += toQuote.length;
    for (const req of toQuote) {
      try {
        const ok = await orchestrateQuote(req);
        if (ok) result.quoted++;
      } catch (e) {
        result.failed++;
        result.errors.push(`quote:${req.id}:${e instanceof Error ? e.message : String(e)}`);
      }
    }
  } catch (e) {
    result.errors.push(`quote_batch:${e instanceof Error ? e.message : String(e)}`);
  }

  // 3. Escrow release
  try {
    result.released = await runEscrowPass();
  } catch (e) {
    result.errors.push(`escrow:${e instanceof Error ? e.message : String(e)}`);
  }

  return result;
}

/** Backward-compatible alias used by existing cron / index hooks. */
export async function runEscrowPassLegacy(): Promise<void> {
  await runOrchestrationPass();
}

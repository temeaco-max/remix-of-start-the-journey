import { getDb, saveDb } from '../database.js';
import { addPoints } from './pointsEngine.js';
import { releaseEscrow } from './escrow.js';

/**
 * Blueprint §33.1.3: transaction orchestration is an escrow lifecycle worker.
 * It never performs arbitrage, creates synthetic value, or releases disputed funds.
 * Release is idempotent and only occurs after the escrow cooling-off period.
 */
export async function runEscrowPass(): Promise<void> {
    const db = await getDb();
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
            const released = await releaseEscrow(escrowId);
            if (!released) continue;

            // Provider reward is recorded only after the escrow state transition.
            // A credit transaction marker makes retries safe across worker restarts.
            const marker = `escrow_release:${escrowId}`;
            const tx = db.prepare(`SELECT id FROM credit_transactions WHERE description = ? LIMIT 1`);
            tx.bind([marker]);
            const alreadyRewarded = tx.step();
            tx.free();

            if (!alreadyRewarded) {
                await addPoints(
                    String(row.provider_phone),
                    Number(row.amount_minor),
                    marker
                );
            }

            db.run(`UPDATE orders SET status = 'completed' WHERE id = ? AND status IN ('delivered','completed')`, [orderId]);
            db.run(`UPDATE escrow SET completed_at = COALESCE(completed_at, CURRENT_TIMESTAMP) WHERE id = ?`, [escrowId]);
        } catch (error) {
            console.error(`[Transaction Engine] Failed escrow ${escrowId} for order ${orderId}:`, error);
        }
    }

    stmt.free();
    saveDb();
}

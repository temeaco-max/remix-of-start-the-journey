import { getDb, saveDb } from '../database.js';

const DEFAULT_COOLING_OFF_HOURS = 24;

function isoAfterHours(hours: number): string {
    return new Date(Date.now() + hours * 60 * 60 * 1000).toISOString();
}

export async function createEscrow(
    orderId: string,
    buyerPhone: string,
    providerPhone: string,
    amountMinor: number,
    description: string,
    coolingOffHours = DEFAULT_COOLING_OFF_HOURS
): Promise<number> {
    if (!orderId || !buyerPhone || !providerPhone) throw new Error('Escrow parties and order are required');
    if (!Number.isInteger(amountMinor) || amountMinor <= 0) throw new Error('Escrow amount must be a positive integer');

    const db = await getDb();
    const existing = db.prepare(`SELECT id FROM escrow WHERE order_id = ? AND status IN ('held','disputed') LIMIT 1`);
    existing.bind([orderId]);
    if (existing.step()) {
        const id = Number(existing.getAsObject().id);
        existing.free();
        return id;
    }
    existing.free();

    db.run(
        `INSERT INTO escrow (order_id, buyer_phone, provider_phone, amount_minor, description, status, cooling_off_until)
         VALUES (?, ?, ?, ?, ?, 'held', ?)`,
        [orderId, buyerPhone, providerPhone, amountMinor, description, isoAfterHours(Math.max(0, coolingOffHours))]
    );
    const res = db.exec(`SELECT last_insert_rowid() as id`);
    const id = Number(res[0]?.values[0]?.[0]);
    saveDb();
    return id;
}

export async function releaseEscrow(escrowId: number, options: { force?: boolean } = {}): Promise<boolean> {
    const db = await getDb();
    const stmt = db.prepare(`SELECT status, cooling_off_until FROM escrow WHERE id = ?`);
    stmt.bind([escrowId]);
    let row: any = null;
    if (stmt.step()) row = stmt.getAsObject();
    stmt.free();

    if (!row || row.status !== 'held') return false;
    if (!options.force && row.cooling_off_until && new Date(String(row.cooling_off_until)).getTime() > Date.now()) {
        return false;
    }

    db.run(`UPDATE escrow SET status = 'released', completed_at = CURRENT_TIMESTAMP WHERE id = ? AND status = 'held'`, [escrowId]);
    saveDb();
    return true;
}

export async function refundEscrow(escrowId: number): Promise<boolean> {
    const db = await getDb();
    const stmt = db.prepare(`SELECT status FROM escrow WHERE id = ?`);
    stmt.bind([escrowId]);
    let status: string | null = null;
    if (stmt.step()) status = String(stmt.getAsObject().status);
    stmt.free();

    if (!status || !['held', 'disputed'].includes(status)) return false;
    db.run(`UPDATE escrow SET status = 'refunded', completed_at = CURRENT_TIMESTAMP WHERE id = ? AND status IN ('held','disputed')`, [escrowId]);
    saveDb();
    return true;
}

export async function freezeEscrowForOrder(orderId: string, reason?: string): Promise<boolean> {
    const db = await getDb();
    const escrowStmt = db.prepare(`SELECT id FROM escrow WHERE order_id = ? AND status = 'held' LIMIT 1`);
    escrowStmt.bind([orderId]);
    let escrowId: number | null = null;
    if (escrowStmt.step()) escrowId = Number(escrowStmt.getAsObject().id);
    escrowStmt.free();

    if (!escrowId) return false;
    db.run(`UPDATE escrow SET status = 'disputed', dispute_reason = COALESCE(?, dispute_reason) WHERE id = ? AND status = 'held'`, [reason || 'Dispute opened', escrowId]);
    saveDb();
    return true;
}

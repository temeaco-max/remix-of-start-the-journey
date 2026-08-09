import { getDb, saveDb } from '../database.js';

export async function createDispute(phone: string, orderId: string, reason: string): Promise<number> {
    const db = await getDb();
    db.run(
        `INSERT INTO disputes (phone, order_id, reason, status, type) VALUES (?, ?, ?, 'open', 'dispute')`,
        [phone, orderId, reason]
    );
    const res = db.exec(`SELECT last_insert_rowid() as id`);
    const id = res[0]?.values[0][0] || 1;
    saveDb();
    return id;
}

export async function resolveDispute(disputeId: number, resolution: string): Promise<void> {
    const db = await getDb();
    db.run(`UPDATE disputes SET status = 'resolved', resolution = ? WHERE id = ?`, [resolution, disputeId]);
    saveDb();
}

export async function escalateDispute(disputeId: number): Promise<void> {
    const db = await getDb();
    db.run(`UPDATE disputes SET status = 'escalated' WHERE id = ?`, [disputeId]);
    saveDb();
}

export async function getDisputeStatus(disputeId: number): Promise<string | null> {
    const db = await getDb();
    const stmt = db.prepare(`SELECT status FROM disputes WHERE id = ?`);
    stmt.bind([disputeId]);
    let status: string | null = null;
    if (stmt.step()) {
        status = stmt.getAsObject().status;
    }
    stmt.free();
    return status;
}

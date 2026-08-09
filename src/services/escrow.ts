import { getDb, saveDb } from '../database.js';

export async function createEscrow(orderId: string, buyerPhone: string, providerPhone: string, amountMinor: number, description: string): Promise<number> {
    const db = await getDb();
    db.run(`INSERT INTO escrow (order_id, buyer_phone, provider_phone, amount_minor, description, status) VALUES (?, ?, ?, ?, ?, 'held')`, [orderId, buyerPhone, providerPhone, amountMinor, description]);
    const res = db.exec(`SELECT last_insert_rowid() as id`);
    const id = res[0]?.values[0][0] || 1;
    saveDb();
    return id;
}

export async function releaseEscrow(escrowId: number): Promise<boolean> {
    const db = await getDb();
    const stmt = db.prepare(`SELECT status FROM escrow WHERE id = ?`);
    stmt.bind([escrowId]);
    let status = '';
    if (stmt.step()) {
        status = stmt.getAsObject().status as string;
    }
    stmt.free();
    
    if (status !== 'held') {
        return false;
    }
    
    db.run(`UPDATE escrow SET status = 'released' WHERE id = ?`, [escrowId]);
    saveDb();
    return true;
}

export async function refundEscrow(escrowId: number): Promise<boolean> {
    const db = await getDb();
    db.run(`UPDATE escrow SET status = 'refunded' WHERE id = ?`, [escrowId]);
    saveDb();
    return true;
}

export async function freezeEscrowForOrder(orderId: string): Promise<boolean> {
    const db = await getDb();
    
    // Find matching held escrow record by order_id
    const escrowStmt = db.prepare(`SELECT id FROM escrow WHERE order_id = ? AND status = 'held' LIMIT 1`);
    escrowStmt.bind([orderId]);
    let escrowId: number | null = null;
    if (escrowStmt.step()) {
        escrowId = escrowStmt.getAsObject().id;
    }
    escrowStmt.free();
    
    if (escrowId) {
        db.run(`UPDATE escrow SET status = 'disputed' WHERE id = ?`, [escrowId]);
        saveDb();
        return true;
    }
    return false;
}

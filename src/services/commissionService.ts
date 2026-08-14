import { getDb, saveDb } from '../database.js';

export class CommissionConfigurationError extends Error {
    constructor(type: string) {
        super(`No active commission configuration exists for ${type}.`);
        this.name = 'CommissionConfigurationError';
    }
}

export async function getAllCommissions() {
    const db = await getDb();
    const stmt = db.prepare(`SELECT id, type, rate_minor, description, active FROM commission_config`);
    const list = [];
    while (stmt.step()) {
        list.push(stmt.getAsObject());
    }
    stmt.free();
    return list;
}

export async function getCommission(type: string): Promise<number> {
    const db = await getDb();
    const stmt = db.prepare(`SELECT rate_minor FROM commission_config WHERE type = ? AND active = 1`);
    stmt.bind([type]);
    if (!stmt.step()) {
        stmt.free();
        throw new CommissionConfigurationError(type);
    }
    const rate = Number(stmt.getAsObject().rate_minor);
    stmt.free();
    if (!Number.isFinite(rate) || rate < 0) throw new CommissionConfigurationError(type);
    return rate;
}

export async function calculateCommission(type: string, amount: number = 0): Promise<number> {
    const rate = await getCommission(type);
    if (type === 'agent_topup' && rate <= 100 && amount > 0) {
        return Math.round(amount * (rate / 100));
    }
    return rate;
}

export async function updateCommission(id: number, rate_minor: number, active: number = 1) {
    const db = await getDb();
    db.run(`UPDATE commission_config SET rate_minor = ?, active = ? WHERE id = ?`, [rate_minor, active, id]);
    saveDb();
    return true;
}

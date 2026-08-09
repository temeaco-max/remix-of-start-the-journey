import { getDb, saveDb } from '../database.js';

async function initDeferredTables() {
    const db = await getDb();
    db.run(`
        CREATE TABLE IF NOT EXISTS open_intentions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            phone TEXT,
            intent TEXT,
            context TEXT,
            skill TEXT,
            location TEXT,
            status TEXT DEFAULT 'open',
            resolution TEXT,
            note TEXT,
            workaround TEXT,
            attempts INTEGER DEFAULT 0,
            max_attempts INTEGER DEFAULT 3,
            ttl_days INTEGER DEFAULT 30,
            created_at TEXT DEFAULT CURRENT_TIMESTAMP,
            updated_at TEXT DEFAULT CURRENT_TIMESTAMP
        );
    `);
    saveDb();
}

export async function createOpenIntention(
    phone: string,
    intent: string,
    context: string,
    options: { skill?: string; location?: string; ttlDays?: number; maxAttempts?: number } = {}
) {
    await initDeferredTables();
    const db = await getDb();
    const now = new Date().toISOString();
    const skill = options.skill || null;
    const location = options.location || null;
    const ttlDays = options.ttlDays || 30;
    const maxAttempts = options.maxAttempts || 3;

    db.run(`
        INSERT INTO open_intentions (phone, intent, context, skill, location, ttl_days, max_attempts, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [phone, intent, context, skill, location, ttlDays, maxAttempts, now, now]);

    saveDb();

    const stmt = db.prepare('SELECT * FROM open_intentions WHERE phone = ? ORDER BY id DESC LIMIT 1');
    stmt.bind([phone]);
    let intention = null;
    if (stmt.step()) {
        intention = stmt.getAsObject();
    }
    stmt.free();
    return intention;
}

export async function resolveOpenIntention(
    phone: string,
    intentionId: string | number,
    resolution: string,
    note?: string,
    workaround?: string
) {
    await initDeferredTables();
    const db = await getDb();
    const now = new Date().toISOString();

    db.run(`
        UPDATE open_intentions
        SET status = 'resolved', resolution = ?, note = ?, workaround = ?, updated_at = ?
        WHERE phone = ? AND (id = ? OR id = ?)
    `, [resolution, note || null, workaround || null, now, phone, Number(intentionId), String(intentionId)]);

    saveDb();
}

export async function getIntentions(phone: string) {
    await initDeferredTables();
    const db = await getDb();
    const stmt = db.prepare('SELECT * FROM open_intentions WHERE phone = ? ORDER BY created_at DESC');
    stmt.bind([phone]);
    const intentions: any[] = [];
    while (stmt.step()) {
        intentions.push(stmt.getAsObject());
    }
    stmt.free();
    return intentions;
}

export async function incrementAttempt(phone: string, intentionId: string | number) {
    await initDeferredTables();
    const db = await getDb();
    const now = new Date().toISOString();

    db.run(`
        UPDATE open_intentions
        SET attempts = attempts + 1, updated_at = ?
        WHERE phone = ? AND (id = ? OR id = ?)
    `, [now, phone, Number(intentionId), String(intentionId)]);

    saveDb();

    const stmt = db.prepare('SELECT * FROM open_intentions WHERE phone = ? AND (id = ? OR id = ?)');
    stmt.bind([phone, Number(intentionId), String(intentionId)]);
    let intention = null;
    if (stmt.step()) {
        intention = stmt.getAsObject();
    }
    stmt.free();
    return intention;
}

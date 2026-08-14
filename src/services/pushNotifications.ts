import { getDb, saveDb } from '../database.js';
async function ensureNotificationTable() {
    const db = await getDb();
    db.run(`CREATE TABLE IF NOT EXISTS internal_notifications (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        phone TEXT NOT NULL,
        title TEXT NOT NULL,
        body TEXT NOT NULL,
        link TEXT,
        status TEXT NOT NULL DEFAULT 'unread',
        created_at TEXT DEFAULT CURRENT_TIMESTAMP
    )`);
    const columns = new Set((db.exec('PRAGMA table_info(internal_notifications)')[0]?.values || []).map((row: any[]) => String(row[1])));
    if (!columns.has('delivery_state')) db.run(`ALTER TABLE internal_notifications ADD COLUMN delivery_state TEXT NOT NULL DEFAULT 'queued'`);
    if (!columns.has('provider_reference')) db.run(`ALTER TABLE internal_notifications ADD COLUMN provider_reference TEXT`);
    if (!columns.has('failure_reason')) db.run(`ALTER TABLE internal_notifications ADD COLUMN failure_reason TEXT`);
    db.run(`CREATE INDEX IF NOT EXISTS idx_internal_notifications_phone_status ON internal_notifications(phone, status)`);
    db.run(`CREATE INDEX IF NOT EXISTS idx_internal_notifications_delivery_state ON internal_notifications(delivery_state)`);
    return db;
}

export async function sendFcmPush(phone: string, title: string, body: string, link?: string): Promise<boolean> {
    const db = await ensureNotificationTable();
    const clickLink = link || null;

    // Persist an internal inbox notification even when no external adapter is configured.
    // This is a durable fallback, not evidence that an external delivery occurred.
    try {
        db.run(
            `INSERT INTO internal_notifications (phone, title, body, link, status, delivery_state) VALUES (?, ?, ?, ?, 'unread', 'queued')`,
            [phone, title, body, clickLink],
        );
        saveDb();
    } catch (error) {
        console.error('[Push] Failed to store internal notification:', error);
    }

    console.warn('[Push] FCM delivery adapter is not configured; notification stored in internal queue.');
    return false;
}

export async function transitionNotificationDelivery(notificationId: number, deliveryState: 'queued' | 'accepted' | 'sent' | 'delivered' | 'failed' | 'suppressed', phone?: string, providerReference?: string, failureReason?: string): Promise<boolean> {
    const db = await ensureNotificationTable();
    const ownerClause = phone ? ' AND phone = ?' : '';
    const params: any[] = [deliveryState, providerReference || null, failureReason || null, notificationId];
    if (phone) params.push(phone);
    db.run(`UPDATE internal_notifications SET delivery_state=?, provider_reference=?, failure_reason=? WHERE id=?${ownerClause}`, params);
    const updated = db.getRowsModified() > 0;
    if (updated) saveDb();
    return updated;
}

export async function getInternalNotifications(phone: string, limit = 20): Promise<Array<{ id: number; title: string; body: string; link: string; status: string; delivery_state: string; provider_reference?: string; failure_reason?: string; created_at: string }>> {
    const db = await ensureNotificationTable();
    const safeLimit = Math.max(1, Math.min(100, Math.floor(Number(limit) || 20)));
    const stmt = db.prepare(`SELECT id, title, body, link, status, delivery_state, provider_reference, failure_reason, created_at FROM internal_notifications WHERE phone = ? ORDER BY id DESC LIMIT ?`);
    stmt.bind([phone, safeLimit]);
    const results: Array<{ id: number; title: string; body: string; link: string; status: string; delivery_state: string; provider_reference?: string; failure_reason?: string; created_at: string }> = [];
    while (stmt.step()) results.push(stmt.getAsObject() as any);
    stmt.free();
    return results;
}

export async function markNotificationRead(notificationId: number, phone: string): Promise<boolean> {
    const db = await ensureNotificationTable();
    try {
        db.run(`UPDATE internal_notifications SET status = 'read' WHERE id = ? AND phone = ?`, [notificationId, phone]);
        const updated = db.getRowsModified() > 0;
        if (updated) saveDb();
        return updated;
    } catch {
        return false;
    }
}

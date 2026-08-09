import { getDb, saveDb } from '../database.js';

/**
 * Privacy Bridge — Blueprint §41 (Privacy & Security) & §2153 (Number Masking).
 *
 * Masks personal phone numbers behind short-lived proxy numbers so that
 * customer and provider can transact without exchanging real numbers. The
 * real number is stored in the `privacy_bridge` table and looked up only for
 * routing calls/messages; it is never surfaced in the chat UI.
 *
 * Full Africa's Talking / Twilio number-masking integration is a Phase 2 task
 * (Blueprint §2546). Until then, proxy numbers are allocated from an internal
 * pool range and the mapping is persisted locally.
 */

const PROXY_PREFIX = '+2348009'; // internal proxy number pool range

/** Mask a phone number for display (e.g. in chat cards): +234 803 *** ****.
 *  Never returns the real number. */
export function maskPhoneNumber(phone: string): string {
    if (!phone || phone.length < 6) return '***-****';
    return phone.substring(0, 4) + '****' + phone.substring(phone.length - 3);
}

/** Allocate a fresh proxy number for a real number and persist the mapping. */
export async function generateProxyNumber(realPhone: string, context = 'booking'): Promise<string> {
    const db = await getDb();
    // Derive a unique sequence number from the current row count.
    const res = db.exec(`SELECT COUNT(*) as c FROM privacy_bridge`);
    const count = (res[0]?.values[0][0] as number) || 0;
    const seq = String(count + 1).padStart(7, '0');
    const proxyPhone = `${PROXY_PREFIX}${seq}`;
    db.run(
        `INSERT INTO privacy_bridge (real_phone, proxy_phone, context, status) VALUES (?, ?, ?, 'active')`,
        [realPhone, proxyPhone, context]
    );
    saveDb();
    return proxyPhone;
}

/** Resolve a proxy number back to the real number (for routing only — never display). */
export async function getRealNumber(proxyPhone: string): Promise<string | null> {
    const db = await getDb();
    const stmt = db.prepare(`SELECT real_phone FROM privacy_bridge WHERE proxy_phone = ? AND status = 'active'`);
    stmt.bind([proxyPhone]);
    let real: string | null = null;
    if (stmt.step()) real = stmt.getAsObject().real_phone as string;
    stmt.free();
    return real;
}

/** Find the active proxy number currently mapped to a real number. */
export async function getProxyForPhone(realPhone: string): Promise<string | null> {
    const db = await getDb();
    const stmt = db.prepare(`SELECT proxy_phone FROM privacy_bridge WHERE real_phone = ? AND status = 'active' ORDER BY id DESC LIMIT 1`);
    stmt.bind([realPhone]);
    let proxy: string | null = null;
    if (stmt.step()) proxy = stmt.getAsObject().proxy_phone as string;
    stmt.free();
    return proxy;
}

/** Release a proxy mapping (e.g. after a booking is completed). */
export async function releaseProxyNumber(proxyPhone: string): Promise<boolean> {
    const db = await getDb();
    db.run(`UPDATE privacy_bridge SET status = 'released', released_at = CURRENT_TIMESTAMP WHERE proxy_phone = ? AND status = 'active'`, [proxyPhone]);
    const changes = db.exec(`SELECT changes() as c`);
    saveDb();
    return ((changes[0]?.values[0][0] as number) || 0) > 0;
}

/** Rotate: release the current proxy for a real number and allocate a fresh one. */
export async function rotateProxyNumber(realPhone: string, context = 'booking'): Promise<string> {
    const existing = await getProxyForPhone(realPhone);
    if (existing) await releaseProxyNumber(existing);
    return generateProxyNumber(realPhone, context);
}

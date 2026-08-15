import { getDb, saveDb } from '../database.js';
import { emitProgressiveTrustEvent } from './progressiveTrustService.js';

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

export interface PrivacyBridgeStatus {
    enabled: boolean;
    configured: boolean;
    externalActivationRequired: true;
    note: string;
}

export function getPrivacyBridgeStatus(env: NodeJS.ProcessEnv = process.env): PrivacyBridgeStatus {
    const enabled = env.FF_PRIVATE_NUMBER_MASKING === 'true';
    const configured = Boolean(String(env.NUMBER_MASKING_PROVIDER || '').trim());
    return {
        enabled,
        configured,
        externalActivationRequired: true,
        note: enabled && configured
            ? 'Internal proxy mapping is available; provider number ownership, routing, consent, and delivery receipts remain external activation requirements.'
            : 'Private-number mapping is disabled or not configured; no telephony capability is claimed.',
    };
}

/** Mask a phone number for display (e.g. in chat cards): +234 803 *** ****.
 *  Never returns the real number. */
export function maskPhoneNumber(phone: string): string {
    if (!phone || phone.length < 6) return '***-****';
    return phone.substring(0, 4) + '****' + phone.substring(phone.length - 3);
}

/** Allocate a fresh proxy number for a real number and persist the mapping. */
export async function generateProxyNumber(realPhone: string, context = 'booking'): Promise<string> {
    const normalizedPhone = String(realPhone || '').trim();
    if (!normalizedPhone) throw new Error('A real phone number is required for a privacy mapping.');
    const db = await getDb();
    const existing = db.prepare(`SELECT proxy_phone FROM privacy_bridge WHERE real_phone = ? AND status = 'active' ORDER BY id DESC LIMIT 1`);
    existing.bind([normalizedPhone]);
    if (existing.step()) {
        const current = String(existing.getAsObject().proxy_phone || '');
        existing.free();
        return current;
    }
    existing.free();
    const res = db.exec(`SELECT MAX(id) as max_id FROM privacy_bridge`);
    const maxId = Number(res[0]?.values?.[0]?.[0] || 0);
    const proxyPhone = `${PROXY_PREFIX}${String(maxId + 1).padStart(7, '0')}`;
    db.run(
        `INSERT INTO privacy_bridge (real_phone, proxy_phone, context, status, expires_at) VALUES (?, ?, ?, 'active', datetime('now', '+24 hours'))`,
        [normalizedPhone, proxyPhone, String(context || 'booking').slice(0, 80)]
    );
    saveDb();
    await emitProgressiveTrustEvent('privacy.number_mapping.created', normalizedPhone, { context: String(context || 'booking').slice(0, 80), status: 'active', expiresInHours: 24 }, `proxy:${proxyPhone}`);
    return proxyPhone;
}

/** Resolve a proxy number back to the real number (for routing only — never display). */
export async function getRealNumber(proxyPhone: string): Promise<string | null> {
    const db = await getDb();
    const stmt = db.prepare(`SELECT real_phone FROM privacy_bridge WHERE proxy_phone = ? AND status = 'active' AND (expires_at IS NULL OR expires_at > CURRENT_TIMESTAMP)`);
    stmt.bind([proxyPhone]);
    let real: string | null = null;
    if (stmt.step()) real = stmt.getAsObject().real_phone as string;
    stmt.free();
    return real;
}

/** Find the active proxy number currently mapped to a real number. */
export async function getProxyForPhone(realPhone: string): Promise<string | null> {
    const db = await getDb();
    const stmt = db.prepare(`SELECT proxy_phone FROM privacy_bridge WHERE real_phone = ? AND status = 'active' AND (expires_at IS NULL OR expires_at > CURRENT_TIMESTAMP) ORDER BY id DESC LIMIT 1`);
    stmt.bind([realPhone]);
    let proxy: string | null = null;
    if (stmt.step()) proxy = stmt.getAsObject().proxy_phone as string;
    stmt.free();
    return proxy;
}

/** Release a proxy mapping (e.g. after a booking is completed). */
export async function releaseProxyNumber(proxyPhone: string): Promise<boolean> {
    const db = await getDb();
    const ownerStmt = db.prepare(`SELECT real_phone FROM privacy_bridge WHERE proxy_phone = ? AND status = 'active' LIMIT 1`);
    ownerStmt.bind([proxyPhone]);
    const realPhone = ownerStmt.step() ? String(ownerStmt.getAsObject().real_phone || '') : '';
    ownerStmt.free();
    db.run(`UPDATE privacy_bridge SET status = 'released', released_at = CURRENT_TIMESTAMP WHERE proxy_phone = ? AND status = 'active'`, [proxyPhone]);
    const changes = db.exec(`SELECT changes() as c`);
    saveDb();
    const released = ((changes[0]?.values[0][0] as number) || 0) > 0;
    if (released && realPhone) await emitProgressiveTrustEvent('privacy.number_mapping.released', realPhone, { status: 'released' }, `proxy:${proxyPhone}`);
    return released;
}

/** Rotate: release the current proxy for a real number and allocate a fresh one. */
export async function rotateProxyNumber(realPhone: string, context = 'booking'): Promise<string> {
    const existing = await getProxyForPhone(realPhone);
    if (existing) await releaseProxyNumber(existing);
    return generateProxyNumber(realPhone, context);
}

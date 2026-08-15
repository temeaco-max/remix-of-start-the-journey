import crypto from 'crypto';
import { getDb, saveDb } from '../database.js';

const ALGORITHM = 'aes-256-cbc';

function parseProfileJson(value: string, field: string): any {
    try { return JSON.parse(value); }
    catch (error) { throw new Error(`[Kurukoo Security] Invalid encrypted ${field} profile data.`, { cause: error }); }
}
export type MemoryProvenance = 'user_declared' | 'verified' | 'inferred' | 'observed' | 'system_generated' | 'expired';

async function ensureMemoryFactsSchema(): Promise<void> {
    const db = await getDb();
    db.run(`CREATE TABLE IF NOT EXISTS memory_facts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        phone TEXT NOT NULL,
        field TEXT NOT NULL,
        value TEXT NOT NULL,
        provenance TEXT NOT NULL,
        confidence REAL,
        source_ref TEXT,
        observed_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        expires_at TEXT,
        status TEXT NOT NULL DEFAULT 'active',
        created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(phone, field, value, provenance)
    )`);
    db.run(`CREATE INDEX IF NOT EXISTS idx_memory_facts_owner ON memory_facts(phone, status, field)`);
    saveDb();
}

export async function recordMemoryFact(phone: string, field: string, value: unknown, provenance: MemoryProvenance, options: { confidence?: number; sourceRef?: string; expiresAt?: string } = {}): Promise<void> {
    const normalized = String(value ?? '').trim();
    if (!phone || !field || !normalized || provenance === 'expired') return;
    await ensureMemoryFactsSchema();
    const db = await getDb();
    db.run(`INSERT INTO memory_facts (phone, field, value, provenance, confidence, source_ref, expires_at, status, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, 'active', CURRENT_TIMESTAMP)
            ON CONFLICT(phone, field, value, provenance) DO UPDATE SET confidence = excluded.confidence, source_ref = excluded.source_ref, expires_at = excluded.expires_at, status = 'active', updated_at = CURRENT_TIMESTAMP`,
        [phone, field, normalized, provenance, options.confidence ?? null, options.sourceRef ?? null, options.expiresAt ?? null]);
    saveDb();
}

export async function getMemoryFacts(phone: string, fields?: string[]): Promise<Array<{ id: number; field: string; value: string; provenance: MemoryProvenance; confidence: number | null; sourceRef: string | null; observedAt: string; expiresAt: string | null }>> {
    await ensureMemoryFactsSchema();
    const db = await getDb();
    const params: unknown[] = [phone];
    let where = `phone = ? AND status = 'active' AND (expires_at IS NULL OR expires_at > CURRENT_TIMESTAMP)`;
    if (fields?.length) { where += ` AND field IN (${fields.map(() => '?').join(',')})`; params.push(...fields); }
    const stmt = db.prepare(`SELECT id, field, value, provenance, confidence, source_ref, observed_at, expires_at FROM memory_facts WHERE ${where} ORDER BY updated_at DESC`);
    stmt.bind(params);
    const facts: Array<{ id: number; field: string; value: string; provenance: MemoryProvenance; confidence: number | null; sourceRef: string | null; observedAt: string; expiresAt: string | null }> = [];
    while (stmt.step()) {
        const row = stmt.getAsObject() as any;
        facts.push({ id: Number(row.id), field: String(row.field), value: String(row.value), provenance: String(row.provenance) as MemoryProvenance, confidence: row.confidence == null ? null : Number(row.confidence), sourceRef: row.source_ref == null ? null : String(row.source_ref), observedAt: String(row.observed_at), expiresAt: row.expires_at == null ? null : String(row.expires_at) });
    }
    stmt.free();
    return facts;
}

export async function revokeMemoryFact(phone: string, factId: number): Promise<{ revoked: boolean; reason?: 'not_found' | 'already_revoked' }> {
    if (!phone || !Number.isInteger(factId) || factId <= 0) return { revoked: false, reason: 'not_found' };
    await ensureMemoryFactsSchema();
    const db = await getDb();
    const stmt = db.prepare(`SELECT id, status FROM memory_facts WHERE id = ? AND phone = ? LIMIT 1`);
    stmt.bind([factId, phone]);
    let status: string | null = null;
    if (stmt.step()) status = String((stmt.getAsObject() as any).status || '');
    stmt.free();
    if (!status) return { revoked: false, reason: 'not_found' };
    if (status !== 'active') return { revoked: false, reason: 'already_revoked' };
    db.run(`UPDATE memory_facts SET status = 'revoked', updated_at = CURRENT_TIMESTAMP WHERE id = ? AND phone = ? AND status = 'active'`, [factId, phone]);
    saveDb();
    await logProfileAccess(phone, 'memory_self_service', 'write');
    return { revoked: true };
}

const getSecretKey = () => {
    const raw = String(process.env.MEMORY_ENCRYPTION_KEY || '').trim();
    if (!raw && process.env.NODE_ENV === 'production') throw new Error('[Kurukoo Security] MEMORY_ENCRYPTION_KEY must be configured in production.');
    return crypto.createHash('sha256').update(raw || 'development-only-memory-key').digest();
};

export function encryptData(text: string): string {
    if (!text) return text;
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(ALGORITHM, getSecretKey(), iv);
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return iv.toString('hex') + ':' + encrypted;
}

export function decryptData(encryptedText: string): string {
    if (!encryptedText || !encryptedText.includes(':')) return encryptedText;
    const parts = encryptedText.split(':');
    const looksEncrypted = /^[a-f0-9]{32}$/i.test(parts[0] || '');
    if (!looksEncrypted) return encryptedText;
    if (parts.length !== 2 || !/^[a-f0-9]+$/i.test(parts[1])) throw new Error('[Kurukoo Security] Invalid encrypted profile payload.');
    const iv = Buffer.from(parts[0], 'hex');
    const decipher = crypto.createDecipheriv(ALGORITHM, getSecretKey(), iv);
    let decrypted = decipher.update(parts[1], 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
}

export async function logProfileAccess(phone: string, serviceName: string, action: 'read' | 'write') {
    try {
        const db = await getDb();
        db.run(`INSERT INTO profile_access_log (phone, service_name, action) VALUES (?, ?, ?)`, [phone, serviceName, action]);
        saveDb();
    } catch (e) {
        console.error('Failed to log profile access:', e);
    }
}

export async function getProfile(phone: string, serviceName: string = 'system') {
    await logProfileAccess(phone, serviceName, 'read');
    const db = await getDb();
    const stmt = db.prepare(`SELECT * FROM memory_profiles WHERE phone = ?`);
    stmt.bind([phone]);
    let profile: any = null;
    if (stmt.step()) {
        profile = stmt.getAsObject();
    }
    stmt.free();

    if (profile) {
        if (profile.preferences) {
            const decryptedPrefs = decryptData(profile.preferences);
            profile.preferences = parseProfileJson(decryptedPrefs, 'preferences');
        }
        if (profile.behavior_patterns) {
            const decryptedPatterns = decryptData(profile.behavior_patterns);
            profile.behavior_patterns = parseProfileJson(decryptedPatterns, 'behavior_patterns');
        }
    }
    return profile;
}

export async function updateProfile(phone: string, serviceName: string = 'system', updates: {
    name?: string;
    location?: string;
    country?: string;
    subscription_tier?: string;
    wallet_balance_minor?: number;
    preferences?: any;
    behavior_patterns?: any;
    fcm_token?: string;
    is_available?: number;
    provenance?: MemoryProvenance;
    source_ref?: string;
}) {
    await logProfileAccess(phone, serviceName, 'write');
    const db = await getDb();

    const existing = await getProfile(phone, serviceName);

    // Unknown remains unknown. Do not manufacture a location, balance, or other
    // user fact simply because a profile is being created.
    const name = updates.name !== undefined ? updates.name : (existing ? existing.name : null);
    const location = updates.location !== undefined ? updates.location : (existing ? existing.location : null);
    const country = updates.country !== undefined ? updates.country : (existing ? existing.country : null);
    const subscription_tier = updates.subscription_tier !== undefined ? updates.subscription_tier : (existing ? existing.subscription_tier : null);
    const wallet_balance_minor = updates.wallet_balance_minor !== undefined ? updates.wallet_balance_minor : (existing ? existing.wallet_balance_minor : null);

    const prefsObj = updates.preferences !== undefined ? updates.preferences : (existing ? existing.preferences : {});
    if (!prefsObj.referral_code) {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        let code = '';
        for (let i = 0; i < 8; i++) {
            code += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        prefsObj.referral_code = code;
    }
    if (!prefsObj.badges) {
        prefsObj.badges = [];
    }
    const prefsStr = encryptData(JSON.stringify(prefsObj));

    const patternsObj = updates.behavior_patterns !== undefined ? updates.behavior_patterns : (existing ? existing.behavior_patterns : {});
    const patternsStr = encryptData(JSON.stringify(patternsObj));

    const fcm_token = updates.fcm_token !== undefined ? updates.fcm_token : (existing ? existing.fcm_token : null);
    const is_available = updates.is_available !== undefined ? updates.is_available : (existing ? existing.is_available : 0);

    if (!existing) {
        db.run(`INSERT INTO memory_profiles (phone, name, location, country, subscription_tier, wallet_balance_minor, preferences, behavior_patterns, fcm_token, is_available) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [phone, name, location, country, subscription_tier, wallet_balance_minor, prefsStr, patternsStr, fcm_token, is_available]);
    } else {
        db.run(`UPDATE memory_profiles SET name = ?, location = ?, country = ?, subscription_tier = ?, wallet_balance_minor = ?, preferences = ?, behavior_patterns = ?, fcm_token = ?, is_available = ?, updated_at = CURRENT_TIMESTAMP WHERE phone = ?`,
            [name, location, country, subscription_tier, wallet_balance_minor, prefsStr, patternsStr, fcm_token, is_available, phone]);
    }
    saveDb();
    const provenance = updates.provenance || 'user_declared';
    if (updates.name !== undefined) await recordMemoryFact(phone, 'name', updates.name, provenance, { sourceRef: updates.source_ref || serviceName });
    if (updates.location !== undefined) await recordMemoryFact(phone, 'location', updates.location, provenance, { sourceRef: updates.source_ref || serviceName });
    if (updates.country !== undefined) await recordMemoryFact(phone, 'country', updates.country, provenance, { sourceRef: updates.source_ref || serviceName });
    return await getProfile(phone, serviceName);
}
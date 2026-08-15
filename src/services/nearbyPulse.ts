import { getDb, saveDb } from '../database.js';
import { deductCredits, deductPoints } from './pointsEngine.js';

/*
 * LOCATION DATA POLICY:
 * Public Pulse display uses fuzzed location (~100m radius) to protect provider privacy.
 * Exact lat/lng is stored in the pulse_sessions table for internal analytics and future data products.
 * Raw location is never exposed to consumers.
 */

export async function canActivatePulse(phone: string): Promise<boolean> {
    const db = await getDb();
    const stmt = db.prepare(`SELECT operation_mode FROM skills WHERE phone = ?`);
    let isMobile = false;
    while (stmt.step()) {
        const mode = stmt.getAsObject().operation_mode;
        if (mode === 'mobile') {
            isMobile = true;
            break;
        }
    }
    stmt.free();
    return isMobile;
}

export interface PulseReadiness {
    radarDefaultOn: boolean;
    active: boolean;
    eligibleToBroadcast: boolean;
    role: 'provider' | 'user';
    nudge?: string;
}

export async function getPulseReadiness(phone: string): Promise<PulseReadiness> {
    const db = await getDb();
    const profileStmt = db.prepare(`SELECT verified_provider, is_available FROM memory_profiles WHERE phone = ? LIMIT 1`);
    profileStmt.bind([phone]);
    let verifiedProvider = false;
    let available = false;
    if (profileStmt.step()) {
        const profile = profileStmt.getAsObject() as Record<string, unknown>;
        verifiedProvider = Number(profile.verified_provider || 0) === 1;
        available = Number(profile.is_available || 0) === 1;
    }
    profileStmt.free();
    const mobileMode = await canActivatePulse(phone);
    const eligibleToBroadcast = verifiedProvider && available && mobileMode;
    const providers = await getActivePulseProviders();
    const active = providers.some((provider: any) => String(provider.phone) === phone);
    return {
        radarDefaultOn: true,
        active,
        eligibleToBroadcast,
        role: verifiedProvider ? 'provider' : 'user',
        nudge: active
            ? 'You are live on Nearby Pulse. Kurukoo will keep your location fuzzed and show only confirmed availability.'
            : eligibleToBroadcast
                ? 'Nearby Radar is ready. Go Live only when you want nearby people to discover your available service.'
                : 'Nearby Radar is ready for local discovery. Tell Kurukoo what you need nearby, or complete provider verification before broadcasting yourself.',
    };
}

export async function activatePulse(phone: string, skill: string, lat: number, lng: number): Promise<{ success: boolean; message: string }> {
    const isMobile = await canActivatePulse(phone);
    if (!isMobile) {
        return { success: false, message: 'Cannot Go Live. Your skills are not registered as mobile operation mode.' };
    }

    const latitude = Number(lat);
    const longitude = Number(lng);
    if (!Number.isFinite(latitude) || !Number.isFinite(longitude) || latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
        return { success: false, message: 'Nearby Pulse needs an explicit valid location before it can be activated. No location was inferred.' };
    }

    const db = await getDb();
    
    // Check subscription tier gating
    const profileStmt = db.prepare(`SELECT subscription_tier FROM memory_profiles WHERE phone = ?`);
    profileStmt.bind([phone]);
    let tier = 'Base';
    if (profileStmt.step()) {
        tier = profileStmt.getAsObject().subscription_tier;
    }
    profileStmt.free();

    if (tier === 'Base') {
        const countStmt = db.prepare(`SELECT COUNT(*) as cnt FROM pulse_sessions WHERE phone = ? AND expires_at > datetime('now', '-30 days')`);
        countStmt.bind([phone]);
        let sessionCount = 0;
        if (countStmt.step()) {
            sessionCount = countStmt.getAsObject().cnt as number;
        }
        countStmt.free();
        if (sessionCount >= 10) {
            return { success: false, message: 'Nearby Pulse monthly limit reached. Base tier is limited to 5 hours (10 sessions) per month. Upgrade to Plus or Business for unlimited access.' };
        }
    }

    const success = await deductCredits(phone, 5, 'Nearby Pulse "Go Live" (30 min)');
    if (!success) {
        return { success: false, message: 'Insufficient credits for Nearby Pulse (requires 5 credits).' };
    }

    // Deactivate previous active ones first
    db.run(`UPDATE pulse_sessions SET active = 0 WHERE phone = ?`, [phone]);
    
    db.run(
        `INSERT INTO pulse_sessions (phone, skill, lat, lng, expires_at, active) VALUES (?, ?, ?, ?, datetime('now', '+30 minutes'), 1)`,
        [phone, skill || 'general_service', latitude, longitude]
    );
    saveDb();

    return { success: true, message: 'Nearby Pulse presence is active in Kurukoo for 30 minutes using the location and skill you explicitly supplied. Matching and any external contact remain separate, evidence-backed steps.' };
}

export async function endPulseSession(phone: string): Promise<void> {
    const db = await getDb();
    db.run(`UPDATE pulse_sessions SET active = 0 WHERE phone = ? AND active = 1`, [phone]);
    saveDb();
}

export async function getActivePulseProviders(): Promise<any[]> {
    const db = await getDb();
    
    // Combine active mobile sessions and live stationary providers
    const stmt = db.prepare(`
        SELECT p.phone, p.skill, p.lat, p.lng, m.name, m.location, m.subscription_tier, 'mobile' as source
        FROM pulse_sessions p
        JOIN memory_profiles m ON p.phone = m.phone
        WHERE p.active = 1 AND p.expires_at > datetime('now') AND m.verified_provider = 1 AND m.is_available = 1
        
        UNION ALL
        
        SELECT pr.phone, s.skill, pr.last_lat as lat, pr.last_lng as lng, m.name, m.location, m.subscription_tier, 'stationary' as source
        FROM provider_presence pr
        JOIN memory_profiles m ON pr.phone = m.phone
        JOIN skills s ON pr.phone = s.phone
        WHERE pr.is_live = 1 AND pr.operation_mode = 'stationary' AND m.verified_provider = 1 AND m.is_available = 1
    `);
    
    const results: any[] = [];
    while (stmt.step()) {
        results.push(stmt.getAsObject());
    }
    stmt.free();
    return results;
}

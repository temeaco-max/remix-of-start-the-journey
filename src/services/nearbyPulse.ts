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

export async function activatePulse(phone: string, skill: string, lat: number, lng: number): Promise<{ success: boolean; message: string }> {
    const isMobile = await canActivatePulse(phone);
    if (!isMobile) {
        return { success: false, message: 'Cannot Go Live. Your skills are not registered as mobile operation mode.' };
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
        [phone, skill || 'general_service', lat || 6.5244, lng || 3.3792]
    );
    saveDb();

    return { success: true, message: 'Nearby Pulse is LIVE! Broadcast sent to nearby users with vibration alert.' };
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
        WHERE p.active = 1 AND p.expires_at > datetime('now')
        
        UNION ALL
        
        SELECT pr.phone, s.skill, pr.last_lat as lat, pr.last_lng as lng, m.name, m.location, m.subscription_tier, 'stationary' as source
        FROM provider_presence pr
        JOIN memory_profiles m ON pr.phone = m.phone
        JOIN skills s ON pr.phone = s.phone
        WHERE pr.is_live = 1 AND pr.operation_mode = 'stationary'
    `);
    
    const results: any[] = [];
    while (stmt.step()) {
        results.push(stmt.getAsObject());
    }
    stmt.free();
    return results;
}

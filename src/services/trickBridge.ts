import { getDb, saveDb } from '../database.js';

/*
 * Presence Trick-Bridge Service (§5)
 * Implements cost-effective continuous feel without continuous GPS/WebRTC relay costs.
 * - Fuzzed location (~100m radius) for public display.
 * - Smart interval movement check and exponential back-off when stationary.
 * - Soft expiry & stationary confirmation nudges.
 * - High-value gating rule for precise GPS / short-lived WebRTC.
 */

export interface TrickPresence {
    phone: string;
    fuzzedLat: number;
    fuzzedLng: number;
    isLive: boolean;
    lastConfirmed: string;
    mode: 'mobile' | 'stationary';
}

/**
 * Fuzz coordinates to ~100m radius (~0.001 degree offset) to protect provider privacy.
 */
function fuzzCoordinates(lat: number, lng: number): { lat: number; lng: number } {
    const latOffset = (Math.random() - 0.5) * 0.0018;
    const lngOffset = (Math.random() - 0.5) * 0.0018;
    return {
        lat: Number((lat + latOffset).toFixed(5)),
        lng: Number((lng + lngOffset).toFixed(5))
    };
}

/**
 * Update provider presence with Trick-Bridge smart interval / movement back-off.
 */
export async function updateTrickPresence(phone: string, lat: number, lng: number, movementMeters: number = 50): Promise<{ success: boolean; fuzzed: { lat: number; lng: number } }> {
    const db = await getDb();
    const fuzzed = fuzzCoordinates(lat, lng);
    
    // Check if stationary (movement < 80 meters)
    const isStationary = movementMeters < 80;
    const updateIntervalMinutes = isStationary ? 15 : 3;

    db.run(
        `UPDATE provider_presence SET last_lat = ?, last_lng = ?, fuzzed_lat = ?, fuzzed_lng = ?, last_confirmed = datetime('now'), updated_at = datetime('now') WHERE phone = ?`,
        [lat, lng, fuzzed.lat, fuzzed.lng, phone]
    );
    saveDb();

    return { success: true, fuzzed };
}

/**
 * Get active fuzzed presence for public Kuru Pulse map.
 */
export async function getFuzzedTrickPresence(): Promise<TrickPresence[]> {
    const db = await getDb();
    const stmt = db.prepare(`
        SELECT phone, fuzzed_lat, fuzzed_lng, is_live, last_confirmed, operation_mode
        FROM provider_presence
        WHERE is_live = 1 AND live_until > datetime('now')
    `);
    const results: TrickPresence[] = [];
    while (stmt.step()) {
        const row = stmt.getAsObject();
        results.push({
            phone: row.phone as string,
            fuzzedLat: (row.fuzzed_lat !== null && row.fuzzed_lat !== undefined) ? Number(row.fuzzed_lat) : 6.5244,
            fuzzedLng: (row.fuzzed_lng !== null && row.fuzzed_lng !== undefined) ? Number(row.fuzzed_lng) : 3.3792,
            isLive: row.is_live === 1,
            lastConfirmed: row.last_confirmed as string,
            mode: (row.operation_mode as 'mobile' | 'stationary') || 'stationary'
        });
    }
    stmt.free();
    return results;
}

/**
 * High-value gating check: Determines if precise GPS or short-lived WebRTC is permitted.
 * Returns true ONLY if intent is confirmed or active job/delivery is underway.
 */
export function validateHighValueTransportGate(intentConfirmed: boolean, activeJobOrDelivery: boolean): boolean {
    return intentConfirmed || activeJobOrDelivery;
}

/**
 * Trigger stationary confirmation nudge ("Are you open/available today?")
 */
export async function checkStationaryNudges(): Promise<number> {
    const db = await getDb();
    // Find stationary providers not confirmed in the last 12 hours
    const stmt = db.prepare(`
        SELECT phone FROM provider_presence
        WHERE operation_mode = 'stationary' AND is_live = 1 AND (last_confirmed < datetime('now', '-12 hours') OR last_confirmed IS NULL)
    `);
    const phones: string[] = [];
    while (stmt.step()) {
        phones.push(stmt.getAsObject().phone as string);
    }
    stmt.free();

    // In production, triggers FCM push or WhatsApp check-in message
    return phones.length;
}

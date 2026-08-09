import { getDb, saveDb } from '../database.js';
import { getProfile, updateProfile } from './memoryProfile.js';
import { createEscrow, releaseEscrow } from './escrow.js';

export async function requestArtistVerification(phone: string, skill: string, managerName: string, managerContact: string): Promise<void> {
    const profile = await getProfile(phone);
    if (profile) {
        const prefs = profile.preferences || {};
        prefs.artist_verification = { skill, managerName, managerContact, requested_at: new Date().toISOString() };
        await updateProfile(phone, 'system', { preferences: prefs });
    }
}

export async function bookArtist(customerPhone: string, artistPhone: string, eventDetails: string, budget: number): Promise<number> {
    // triggers an escrow order for the full budget amount, with a 24‑hour cooling‑off period.
    const orderId = `book_${Date.now()}`;
    const escrowId = await createEscrow(orderId, customerPhone, artistPhone, budget, `Artist Booking: ${eventDetails} (24-hour cooling-off period)`);
    saveDb();
    return escrowId;
}

export async function releaseArtistEscrow(escrowId: number, bypassCoolingOff = false): Promise<{ success: boolean; message: string }> {
    const db = await getDb();
    const stmt = db.prepare(`SELECT * FROM escrow WHERE id = ?`);
    stmt.bind([escrowId]);
    if (!stmt.step()) {
        stmt.free();
        return { success: false, message: 'Escrow record not found' };
    }
    const escrow = stmt.getAsObject();
    stmt.free();

    // Check cooling-off period (24 hours)
    const createdAt = new Date(escrow.created_at as string);
    const diffHours = (new Date().getTime() - createdAt.getTime()) / (1000 * 60 * 60);
    if (diffHours < 24 && !bypassCoolingOff) {
        return { success: false, message: `Cannot release funds: Artist booking is still within the 24-hour cooling-off period. (${(24 - diffHours).toFixed(1)} hours remaining)` };
    }

    await releaseEscrow(escrowId);
    return { success: true, message: 'Funds successfully released to the artist.' };
}

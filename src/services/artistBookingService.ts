import crypto from 'node:crypto';
import { getDb, saveDb } from '../database.js';
import { getProfile, updateProfile } from './memoryProfile.js';
import { createEscrow, releaseEscrow } from './escrow.js';

export interface ArtistBookingRequest {
    artistPhone: string;
    eventDate: string;
    venue: string;
    eventDetails: string;
    budgetMinor: number;
    currency?: string;
}

function validDate(value: string): boolean {
    const date = new Date(value);
    return !Number.isNaN(date.getTime()) && date.getTime() > Date.now();
}

function bookingToken(customerPhone: string): string {
    return crypto.randomBytes(18).toString('base64url');
}

export async function requestArtistVerification(phone: string, skill: string, managerName: string, managerContact: string): Promise<void> {
    const profile = await getProfile(phone);
    if (!profile) throw new Error('Artist profile not found');
    if (!skill.trim() || !managerName.trim() || !managerContact.trim()) throw new Error('Artist verification details are incomplete');
    const prefs = profile.preferences || {};
    prefs.artist_verification = {
        skill: skill.trim(),
        managerName: managerName.trim(),
        managerContact: managerContact.trim(),
        status: 'pending',
        requested_at: new Date().toISOString()
    };
    await updateProfile(phone, 'system', { preferences: prefs });
}

export async function approveArtistVerification(artistPhone: string, approvedBy: string): Promise<void> {
    const profile = await getProfile(artistPhone);
    if (!profile) throw new Error('Artist profile not found');
    const approver = approvedBy.trim();
    if (!approver) throw new Error('Verification approver is required');
    const prefs = profile.preferences || {};
    if (!prefs.artist_verification) throw new Error('No artist verification request exists');
    prefs.artist_verification = { ...prefs.artist_verification, status: 'verified', verified_at: new Date().toISOString(), verified_by: approver };
    await updateProfile(artistPhone, 'system', { preferences: prefs });
}

export async function bookArtist(customerPhone: string, artistPhone: string, eventDetails: string, budget: number): Promise<number>;
export async function bookArtist(customerPhone: string, request: ArtistBookingRequest): Promise<{ escrowId: number; bookingToken: string }>;
export async function bookArtist(customerPhone: string, requestOrArtistPhone: ArtistBookingRequest | string, legacyEventDetails?: string, legacyBudget?: number): Promise<number | { escrowId: number; bookingToken: string }> {
    const request: ArtistBookingRequest = typeof requestOrArtistPhone === 'string'
        ? { artistPhone: requestOrArtistPhone, eventDate: '', venue: '', eventDetails: legacyEventDetails || '', budgetMinor: Number(legacyBudget || 0) }
        : requestOrArtistPhone;

    if (!validDate(request.eventDate)) throw new Error('Artist booking date must be a future date');
    if (!request.venue.trim() || !request.eventDetails.trim()) throw new Error('Venue and event details are required');
    if (!Number.isInteger(request.budgetMinor) || request.budgetMinor <= 0) throw new Error('Budget must be a positive integer in minor currency units');

    const artist = await getProfile(request.artistPhone);
    if (!artist) throw new Error('Artist profile not found');
    const verification = artist.preferences?.artist_verification;
    if (verification?.status !== 'verified') throw new Error('Artist representative verification is required before booking');

    const token = bookingToken(customerPhone);
    const orderId = `artist_${token}`;
    const currency = request.currency || 'NGN';
    const description = `Artist Booking: ${request.eventDetails} | ${request.venue} | ${request.eventDate} | ${currency}`;
    const escrowId = await createEscrow(orderId, customerPhone, request.artistPhone, request.budgetMinor, `${description} (24-hour cooling-off period)`);
    saveDb();
    return typeof requestOrArtistPhone === 'string' ? escrowId : { escrowId, bookingToken: token };
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

    const createdAt = new Date(escrow.created_at as string);
    const diffHours = (Date.now() - createdAt.getTime()) / (1000 * 60 * 60);
    if (diffHours < 24 && !bypassCoolingOff) return { success: false, message: `Cannot release funds: booking is still within the 24-hour cooling-off period. (${(24 - diffHours).toFixed(1)} hours remaining)` };

    await releaseEscrow(escrowId);
    return { success: true, message: 'Funds successfully released to the verified artist.' };
}

import crypto from 'node:crypto';
import { createEconomicOrder, getDb, getEconomicOrder, saveDb, transitionEconomicOrder } from '../database.js';
import { getProfile, updateProfile } from './memoryProfile.js';
import { createEscrow, releaseEscrow } from './escrow.js';
import { getEconomicCategory, getDefaultCapabilities } from './skillFlows.js';

/** Artist booking is a category policy over the shared Economic Request lifecycle. */
export interface ArtistBookingRequest {
    artistPhone: string;
    eventDate: string;
    venue: string;
    eventDetails: string;
    budgetMinor: number;
    currency?: string;
}
function validDate(value: string): boolean { const date = new Date(value); return !Number.isNaN(date.getTime()) && date.getTime() > Date.now(); }
function bookingToken(): string { return crypto.randomBytes(18).toString('base64url'); }

export async function requestArtistVerification(phone: string, skill: string, managerName: string, managerContact: string): Promise<void> {
    const profile = await getProfile(phone);
    if (!profile) throw new Error('Provider profile not found');
    if (!skill.trim() || !managerName.trim() || !managerContact.trim()) throw new Error('Representation verification details are incomplete');
    const prefs = profile.preferences || {};
    prefs.representation_verification = { skill: skill.trim(), managerName: managerName.trim(), managerContact: managerContact.trim(), status: 'pending', requested_at: new Date().toISOString() };
    await updateProfile(phone, 'system', { preferences: prefs });
}

export async function approveArtistVerification(artistPhone: string, approvedBy: string): Promise<void> {
    const profile = await getProfile(artistPhone);
    if (!profile) throw new Error('Provider profile not found');
    if (!approvedBy.trim()) throw new Error('Verification approver is required');
    const prefs = profile.preferences || {};
    if (!prefs.representation_verification && !prefs.artist_verification) throw new Error('No representation verification request exists');
    prefs.representation_verification = { ...(prefs.representation_verification || prefs.artist_verification), status: 'verified', verified_at: new Date().toISOString(), verified_by: approvedBy.trim() };
    delete prefs.artist_verification;
    await updateProfile(artistPhone, 'system', { preferences: prefs });
}

export async function bookArtist(customerPhone: string, request: ArtistBookingRequest): Promise<{ escrowId: number; bookingToken: string; requestId: string }>;
export async function bookArtist(customerPhone: string, artistPhone: string, eventDetails: string, budget: number): Promise<number>;
export async function bookArtist(customerPhone: string, requestOrArtistPhone: ArtistBookingRequest | string, legacyEventDetails?: string, legacyBudget?: number): Promise<number | { escrowId: number; bookingToken: string; requestId: string }> {
    const request: ArtistBookingRequest = typeof requestOrArtistPhone === 'string' ? { artistPhone: requestOrArtistPhone, eventDate: '', venue: '', eventDetails: legacyEventDetails || '', budgetMinor: Number(legacyBudget || 0) } : requestOrArtistPhone;
    if (!validDate(request.eventDate)) throw new Error('Booking date must be a future date');
    if (!request.venue.trim() || !request.eventDetails.trim()) throw new Error('Venue and event details are required');
    if (!Number.isInteger(request.budgetMinor) || request.budgetMinor <= 0) throw new Error('Budget must be a positive integer in minor currency units');
    const artist = await getProfile(request.artistPhone);
    if (!artist) throw new Error('Provider profile not found');
    const verification = artist.preferences?.representation_verification || artist.preferences?.artist_verification;
    if (verification?.status !== 'verified') throw new Error('Provider representation verification is required before booking');

    const token = bookingToken();
    const requestId = `booking_${token}`;
    const category = getEconomicCategory('verified_artist') || 'events-entertainment';
    const capabilities = getDefaultCapabilities(category);
    await createEconomicOrder({ id: requestId, phone: customerPhone, skill: 'verified_artist', category, requirements: { provider_phone: request.artistPhone, event_date: request.eventDate, venue: request.venue.trim(), event_details: request.eventDetails.trim(), currency: request.currency || 'NGN' }, capabilities, amount: request.budgetMinor });
    await transitionEconomicOrder(requestId, 'awaiting_match', { provider_phone: request.artistPhone, provider_status: 'verified_provider' });

    const currency = request.currency || 'NGN';
    const description = `Booking: ${request.eventDetails} | ${request.venue} | ${request.eventDate} | ${currency}`;
    const escrowId = await createEscrow(requestId, customerPhone, request.artistPhone, request.budgetMinor, `${description} (24-hour cooling-off period)`);
    await transitionEconomicOrder(requestId, 'partially_matched', { provider_phone: request.artistPhone, provider_status: 'confirmed', quote: { amount_minor: request.budgetMinor, currency } });
    saveDb();
    return typeof requestOrArtistPhone === 'string' ? escrowId : { escrowId, bookingToken: token, requestId };
}

export async function releaseArtistEscrow(escrowId: number, bypassCoolingOff = false): Promise<{ success: boolean; message: string }> {
    const db = await getDb();
    const stmt = db.prepare(`SELECT * FROM escrow WHERE id = ?`); stmt.bind([escrowId]);
    if (!stmt.step()) { stmt.free(); return { success: false, message: 'Escrow record not found' }; }
    const escrow = stmt.getAsObject(); stmt.free();
    const diffHours = (Date.now() - new Date(escrow.created_at as string).getTime()) / 3600000;
    if (diffHours < 24 && !bypassCoolingOff) return { success: false, message: `Cannot release funds: booking is still within the 24-hour cooling-off period. (${(24 - diffHours).toFixed(1)} hours remaining)` };
    await releaseEscrow(escrowId);
    const orderId = String(escrow.order_id || '');
    if (orderId) { const order = await getEconomicOrder(orderId); if (order && ['partially_matched', 'awaiting_match'].includes(String(order.status))) await transitionEconomicOrder(orderId, 'fulfilled', { provider_status: 'completed', fulfillment: { completed_at: new Date().toISOString() } }); }
    return { success: true, message: 'Funds successfully released to the verified provider.' };
}

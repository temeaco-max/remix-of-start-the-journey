/* Copyright (c) 2026 temeaco-max. All rights reserved. Proprietary and confidential. */
import crypto from 'node:crypto';
import { getDb, saveDb } from '../database.js';
import { recordCommercialEvent, ensureCommercialSchema } from './commercialLedger.js';

export type ProviderPayoutRail = 'opay' | 'moniepoint' | 'paystack_transfer' | 'manual';
export type ProviderPayoutStatus = 'requested' | 'pending_provider' | 'settled' | 'failed' | 'cancelled';
export interface ProviderPayoutRequest { id: string; providerPhone: string; amountMinor: number; currency: string; rail: ProviderPayoutRail; destinationRef: string; status: ProviderPayoutStatus; externalReference?: string; failureReason?: string; createdAt: string; updatedAt: string; }

async function ensureSchema(): Promise<void> {
  const db = await getDb();
  await ensureCommercialSchema();
  db.run(`CREATE TABLE IF NOT EXISTS provider_payouts (id TEXT PRIMARY KEY, provider_phone TEXT NOT NULL, amount_minor INTEGER NOT NULL, currency TEXT NOT NULL, rail TEXT NOT NULL, destination_ref TEXT NOT NULL, status TEXT NOT NULL DEFAULT 'requested', external_reference TEXT, failure_reason TEXT, idempotency_key TEXT NOT NULL UNIQUE, created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP, updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP)`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_provider_payouts_provider ON provider_payouts(provider_phone, created_at DESC)`);
  saveDb();
}

function rowToPayout(columns: string[], row: unknown[]): ProviderPayoutRequest {
  const o = Object.fromEntries(columns.map((c, i) => [c, row[i]]));
  return { id: String(o.id), providerPhone: String(o.provider_phone), amountMinor: Number(o.amount_minor), currency: String(o.currency), rail: String(o.rail) as ProviderPayoutRail, destinationRef: String(o.destination_ref), status: String(o.status) as ProviderPayoutStatus, externalReference: o.external_reference ? String(o.external_reference) : undefined, failureReason: o.failure_reason ? String(o.failure_reason) : undefined, createdAt: String(o.created_at), updatedAt: String(o.updated_at) };
}

/**
 * Truthful provider earnings: only ledger events representing real provider
 * value count — verified economic payments (gross minus platform fee) and
 * explicit adjustments. Refunds subtract. Nothing is "earned" from escrow
 * that has not actually been released with evidence.
 */
export async function getProviderPayoutBalance(providerPhone: string, currency = 'NGN'): Promise<{ earnedMinor: number; paidMinor: number; reservedMinor: number; availableMinor: number; currency: string }> {
  await ensureSchema();
  const db = await getDb();
  const normalized = String(currency || 'NGN').toUpperCase();
  const phone = String(providerPhone);
  const earnedRows = db.exec(`SELECT COALESCE(SUM(provider_amount_minor),0) FROM commercial_ledger WHERE event_type IN ('economic_payment','adjustment') AND status IN ('settled','authorized') AND represented_party=? AND direction='inbound' AND UPPER(currency)=?`, [phone, normalized]);
  const reversedRows = db.exec(`SELECT COALESCE(SUM(provider_amount_minor),0) FROM commercial_ledger WHERE event_type='refund' AND status='settled' AND represented_party=? AND UPPER(currency)=?`, [phone, normalized]);
  const paidRows = db.exec(`SELECT COALESCE(SUM(provider_amount_minor),0) FROM commercial_ledger WHERE event_type='provider_payout' AND status='settled' AND represented_party=? AND UPPER(currency)=?`, [phone, normalized]);
  const reservedRows = db.exec(`SELECT COALESCE(SUM(amount_minor),0) FROM provider_payouts WHERE provider_phone=? AND UPPER(currency)=? AND status IN ('requested','pending_provider')`, [phone, normalized]);
  const earnedMinor = Math.max(0, Number(earnedRows[0]?.values?.[0]?.[0] || 0) - Number(reversedRows[0]?.values?.[0]?.[0] || 0));
  const paidMinor = Math.max(0, Number(paidRows[0]?.values?.[0]?.[0] || 0));
  const reservedMinor = Math.max(0, Number(reservedRows[0]?.values?.[0]?.[0] || 0));
  return { earnedMinor, paidMinor, reservedMinor, availableMinor: Math.max(0, earnedMinor - paidMinor - reservedMinor), currency: normalized };
}


export async function requestProviderPayout(input: { providerPhone: string; amountMinor: number; currency: string; rail: ProviderPayoutRail; destinationRef: string; idempotencyKey?: string }): Promise<ProviderPayoutRequest> {
  await ensureSchema();
  const amountMinor = Number(input.amountMinor);
  if (!Number.isSafeInteger(amountMinor) || amountMinor <= 0) throw new Error('A positive payout amount is required.');
  const phone = String(input.providerPhone || '').trim();
  if (!phone) throw new Error('Provider phone is required.');
  if (!['opay', 'moniepoint', 'paystack_transfer', 'manual'].includes(input.rail)) throw new Error('Unsupported provider payout rail.');
  const destination = String(input.destinationRef || '').trim();
  if (!destination) throw new Error('A payout destination reference (bank account or mobile money) is required.');
  const db = await getDb();
  const idempotencyKey = String(input.idempotencyKey || `provider_payout:${phone}:${amountMinor}:${crypto.randomUUID()}`);
  const existing = db.exec('SELECT * FROM provider_payouts WHERE idempotency_key=? LIMIT 1', [idempotencyKey]);
  if (existing[0]?.values?.length) return rowToPayout(existing[0].columns, existing[0].values[0]);
  const balance = await getProviderPayoutBalance(phone, input.currency);
  if (amountMinor > balance.availableMinor) throw new Error(`Payout exceeds available provider earnings (${balance.availableMinor} ${balance.currency} minor units).`);
  const id = `prp_${crypto.randomUUID()}`;
  const currency = String(input.currency || 'NGN').toUpperCase();
  db.run(`INSERT INTO provider_payouts (id, provider_phone, amount_minor, currency, rail, destination_ref, status, idempotency_key) VALUES (?,?,?,?,?,?,?,?)`, [id, phone, amountMinor, currency, input.rail, destination, 'requested', idempotencyKey]);
  await recordCommercialEvent({ eventType: 'provider_payout', direction: 'outbound', status: 'pending', currency, grossMinor: amountMinor, platformFeeMinor: 0, providerAmountMinor: amountMinor, payer: 'KURUKOO', payee: destination, representedParty: phone, externalReference: id, idempotencyKey: `${id}:requested`, metadata: { rail: input.rail, payoutId: id } });
  saveDb();
  const created = db.exec('SELECT * FROM provider_payouts WHERE id=? LIMIT 1', [id]);
  return rowToPayout(created[0].columns, created[0].values[0]);
}

/** Mark a payout settled — requires external evidence from the actual payout rail. */
export async function settleProviderPayout(id: string, externalReference: string): Promise<ProviderPayoutRequest> {
  await ensureSchema();
  const db = await getDb();
  const rows = db.exec('SELECT * FROM provider_payouts WHERE id=? LIMIT 1', [String(id)]);
  if (!rows[0]?.values?.length) throw new Error('Provider payout not found.');
  const current = rowToPayout(rows[0].columns, rows[0].values[0]);
  if (current.status === 'settled') return current;
  const reference = String(externalReference || '').trim();
  if (!reference) throw new Error('Settlement evidence reference from the payout rail is required.');
  db.run(`UPDATE provider_payouts SET status='settled', external_reference=?, failure_reason=NULL, updated_at=CURRENT_TIMESTAMP WHERE id=?`, [reference.slice(0, 220), String(id)]);
  await recordCommercialEvent({ eventType: 'provider_payout', direction: 'outbound', status: 'settled', currency: current.currency, grossMinor: current.amountMinor, platformFeeMinor: 0, providerAmountMinor: current.amountMinor, payer: 'KURUKOO', payee: current.destinationRef, representedParty: current.providerPhone, externalReference: reference, idempotencyKey: `${id}:settled`, metadata: { rail: current.rail, payoutId: current.id } });
  saveDb();
  return { ...current, status: 'settled', externalReference: reference, updatedAt: new Date().toISOString() };
}
export async function failProviderPayout(id: string, reason: string): Promise<ProviderPayoutRequest> {
  await ensureSchema();
  const db = await getDb();
  const rows = db.exec('SELECT * FROM provider_payouts WHERE id=? LIMIT 1', [String(id)]);
  if (!rows[0]?.values?.length) throw new Error('Provider payout not found.');
  const current = rowToPayout(rows[0].columns, rows[0].values[0]);
  if (current.status === 'settled') throw new Error('A settled payout cannot be marked failed.');
  db.run(`UPDATE provider_payouts SET status='failed', failure_reason=?, updated_at=CURRENT_TIMESTAMP WHERE id=?`, [String(reason || 'payout failed').slice(0, 500), String(id)]);
  await recordCommercialEvent({ eventType: 'provider_payout', direction: 'outbound', status: 'failed', currency: current.currency, grossMinor: current.amountMinor, providerAmountMinor: current.amountMinor, payer: 'KURUKOO', payee: current.destinationRef, representedParty: current.providerPhone, idempotencyKey: `${id}:failed:${Date.now()}`, metadata: { rail: current.rail, payoutId: current.id, reason: String(reason || '') } });
  saveDb();
  return { ...current, status: 'failed', failureReason: String(reason || ''), updatedAt: new Date().toISOString() };
}

export async function listProviderPayouts(providerPhone: string, limit = 20): Promise<ProviderPayoutRequest[]> {
  await ensureSchema();
  const db = await getDb();
  const rows = db.exec('SELECT * FROM provider_payouts WHERE provider_phone=? ORDER BY created_at DESC LIMIT ?', [String(providerPhone), Math.min(Math.max(1, Number(limit) || 20), 100)]);
  return (rows[0]?.values || []).map((row: unknown[]) => rowToPayout(rows[0].columns, row));
}

export function getProviderPayoutReadiness() {
  return {
    providerAdapters: {
      opay: Boolean(process.env.KURUKOO_OPAY_PAYOUT_ENABLED === 'true'),
      moniepoint: Boolean(process.env.KURUKOO_MONIEPOINT_PAYOUT_ENABLED === 'true'),
      paystack_transfer: Boolean(process.env.PAYSTACK_SECRET_KEY),
    },
    settlementEvidenceRequired: true,
    canonicalLedger: 'commercialLedger',
    activation: 'external_provider_required' as const,
  };
}

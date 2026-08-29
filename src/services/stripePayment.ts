/* Copyright (c) 2026 temeaco-max. All rights reserved. Proprietary and confidential. */
import crypto from 'node:crypto';

import { hasConfiguredSecret } from './providerCapabilities.js';
import { getEconomicRequest, transitionEconomicRequest } from './skillFlows.js';

export interface StripePaymentIntent {
  id: string;
  clientSecret: string;
  status: string;
  amountMinor: number;
  currency: string;
}

export interface StripeWebhookEvent {
  id: string;
  type: string;
  data: { object?: { id?: string; status?: string; metadata?: Record<string, string>; amount?: number; currency?: string } };
}

function stripeSecret(): string {
  return process.env.STRIPE_SECRET_KEY || (process.env.NODE_ENV !== 'production' ? process.env.KURUKOO_TEST_STRIPE_SECRET_KEY || '' : '');
}

function stripeWebhookSecret(): string {
  return process.env.STRIPE_WEBHOOK_SECRET || (process.env.NODE_ENV !== 'production' ? process.env.KURUKOO_TEST_STRIPE_WEBHOOK_SECRET || '' : '');
}

function configured(): boolean {
  return process.env.KURUKOO_PAY_PROVIDER === 'stripe' && hasConfiguredSecret(stripeSecret()) && hasConfiguredSecret(stripeWebhookSecret());
}

export function stripeStatus(): { configured: boolean; provider: 'stripe'; required: string[] } {
  return { configured: configured(), provider: 'stripe', required: ['KURUKOO_PAY_PROVIDER=stripe', 'STRIPE_SECRET_KEY', 'STRIPE_WEBHOOK_SECRET'] };
}

function asPositiveInteger(value: number): number {
  if (!Number.isSafeInteger(value) || value <= 0) throw new Error('A positive minor-unit amount is required.');
  return value;
}

/**
 * Confirm a payment only inside the explicitly bounded local development sandbox.
 * This records persisted simulated authorization for the canonical Economic Request;
 * it is not a PSP settlement and is unavailable in production.
 */
export async function confirmDevelopmentEconomicPayment(requestId: string, ownerPhone: string): Promise<{ success: boolean; message: string; reference?: string }> {
  if (process.env.NODE_ENV === 'production' || String(process.env.KURUKOO_PAY_PROVIDER || 'sandbox').trim().toLowerCase() !== 'sandbox') {
    return { success: false, message: 'A verified external payment provider is required.' };
  }
  const request = await getEconomicRequest(requestId);
  if (!request || request.phone !== ownerPhone) return { success: false, message: 'Economic Request ownership is required.' };
  const amount = Number((request.quote as any)?.amount_minor || 0);
  if (!Number.isInteger(amount) || amount <= 0) return { success: false, message: 'A confirmed positive quote is required.' };
  if (request.status === 'paid' || request.status === 'in_fulfillment') return { success: true, message: 'Development payment authorization was already recorded.', reference: String((request.fulfillment as any)?.payment_reference || '') };
  if (!['quoted', 'awaiting_confirmation', 'reserved', 'payment_pending'].includes(request.status)) return { success: false, message: 'This request is not ready for payment confirmation.' };
  const reference = `KURUKOO-DEV-PAY-${request.id}`;
  try {
    let current = await getEconomicRequest(request.id);
    if (current?.status === 'quoted') { await transitionEconomicRequest(request.id, 'awaiting_confirmation'); current = await getEconomicRequest(request.id); }
    if (current?.status === 'awaiting_confirmation') { await transitionEconomicRequest(request.id, 'reserved'); current = await getEconomicRequest(request.id); }
    if (current?.status === 'reserved') { await transitionEconomicRequest(request.id, 'payment_pending'); current = await getEconomicRequest(request.id); }
    if (current?.status !== 'payment_pending') return { success: false, message: `Payment confirmation is not available from request state ${current?.status || 'unknown'}.` };
    await transitionEconomicRequest(request.id, 'paid', { fulfillment: { ...(current.fulfillment || {}), payment_verified: true, payment_provider: 'development_sandbox', payment_reference: reference, payment_verified_at: new Date().toISOString(), simulated: true } });
    return { success: true, message: 'Development payment authorization recorded; no real payment was settled.', reference };
  } catch (error) {
    return { success: false, message: error instanceof Error ? error.message : 'Development payment authorization failed.' };
  }
}

export async function createStripePaymentIntent(input: { amountMinor: number; currency: string; economicRequestId: string; idempotencyKey: string }): Promise<StripePaymentIntent> {
  if (!configured()) throw new Error('Stripe payment integration is not configured.');
  const amountMinor = asPositiveInteger(input.amountMinor);
  const currency = input.currency.trim().toLowerCase();
  if (!/^[a-z]{3}$/.test(currency)) throw new Error('A three-letter currency code is required.');
  if (!input.economicRequestId || !input.idempotencyKey) throw new Error('Canonical request and idempotency references are required.');
  const body = new URLSearchParams({
    amount: String(amountMinor), currency, 'metadata[economic_request_id]': input.economicRequestId,
    'metadata[origin]': 'kurukoo', 'automatic_payment_methods[enabled]': 'true',
  });
  const response = await fetch('https://api.stripe.com/v1/payment_intents', {
    method: 'POST', headers: {
      Authorization: `Bearer ${stripeSecret()}`,
      'Content-Type': 'application/x-www-form-urlencoded',
      'Idempotency-Key': input.idempotencyKey.slice(0, 255),
    }, body,
  });
  const payload = await response.json() as Record<string, unknown>;
  if (!response.ok || typeof payload.id !== 'string' || typeof payload.client_secret !== 'string') throw new Error(typeof payload.error === 'object' && payload.error && 'message' in payload.error ? String((payload.error as any).message) : 'Stripe did not create a payment intent.');
  return { id: payload.id, clientSecret: payload.client_secret, status: String(payload.status || 'requires_payment_method'), amountMinor, currency };
}

function safeEqual(left: string, right: string): boolean {
  const a = Buffer.from(left, 'utf8'); const b = Buffer.from(right, 'utf8');
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

/** Verifies Stripe's timestamped v1 signature over the raw request bytes before JSON parsing. */
export function verifyStripeWebhook(rawBody: Buffer, signatureHeader: string | undefined): StripeWebhookEvent | null {
  const secret = stripeWebhookSecret();
  if (!configured() || !secret || !signatureHeader || !rawBody?.length) return null;
  const parts = signatureHeader.split(',').map(part => part.trim().split('=', 2));
  const timestamp = parts.find(([key]) => key === 't')?.[1];
  const signatures = parts.filter(([key]) => key === 'v1').map(([, value]) => value).filter(Boolean) as string[];
  if (!timestamp || !signatures.length || !/^\d+$/.test(timestamp)) return null;
  if (Math.abs(Date.now() / 1000 - Number(timestamp)) > 300) return null;
  const expected = crypto.createHmac('sha256', secret).update(`${timestamp}.${rawBody.toString('utf8')}`).digest('hex');
  if (!signatures.some(signature => safeEqual(signature, expected))) return null;
  try {
    const parsed = JSON.parse(rawBody.toString('utf8')) as StripeWebhookEvent;
    return typeof parsed.id === 'string' && typeof parsed.type === 'string' ? parsed : null;
  } catch { return null; }
}

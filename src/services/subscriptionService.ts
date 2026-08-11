/**
 * Subscription mutations — never trust client phone or payment references.
 * Flow: authenticated session → validated plan → verified payment → tier state.
 */
import { getDb, saveDb } from '../database.js';
import { getPlan } from './pricingService.js';
import { processDirectPayment, chargeProviderSubscription } from './directWallet.js';
import { claimReferral } from './referralService.js';
import { providerSubscriptionTiers } from '../config/providerSubscriptionTiers.js';

export type SubscriptionResult = {
  success: boolean;
  message: string;
  tier?: string;
  plan?: unknown;
  error?: string;
  payment_required?: boolean;
};

function normalizeTierName(plan: string): string {
  const p = String(plan || '').trim();
  if (!p) return 'Base';
  return p.charAt(0).toUpperCase() + p.slice(1).toLowerCase();
}

export async function upgradeSubscriptionAfterPayment(
  phone: string,
  plan: string,
  country: string,
  options?: { payment_ref?: string; force_sandbox_grant?: boolean }
): Promise<SubscriptionResult> {
  if (!phone || !plan || !country) {
    return { success: false, message: 'phone, plan, and country are required', error: 'missing_params' };
  }

  const planObj = await getPlan(country, plan);
  if (!planObj || !(planObj as any).active) {
    return { success: false, message: 'Pricing plan not found or inactive', error: 'plan_not_found' };
  }

  const amountMinor = Number((planObj as any).monthly_price_minor) || 0;
  const provider = process.env.KURUKOO_PAY_PROVIDER || 'sandbox';
  let paid = false;

  if (amountMinor <= 0) {
    paid = true;
  } else if (provider === 'sandbox' && process.env.FORCE_SANDBOX_SUBSCRIPTION === 'true') {
    // Explicit QA-only bypass. Never enable this in production.
    paid = true;
  } else {
    // A payment_ref is metadata, not proof of settlement. The wallet/PSP
    // adapter must independently confirm ownership, amount, currency, status
    // and idempotency before value is created.
    paid = await processDirectPayment(phone, 'SYSTEM', amountMinor / 100);
  }

  if (!paid) {
    return {
      success: false,
      message: 'Payment not confirmed. Complete checkout with a verified provider before retrying.',
      error: 'payment_required',
      payment_required: true,
      plan: planObj,
    };
  }

  const tier = normalizeTierName(plan);
  const db = await getDb();
  db.run(`UPDATE memory_profiles SET subscription_tier = ?, updated_at = CURRENT_TIMESTAMP WHERE phone = ?`, [tier, phone]);
  saveDb();

  try {
    await claimReferral(phone);
  } catch (refErr) {
    console.error('Error claiming referral after subscription:', refErr);
  }

  return {
    success: true,
    message: `Successfully upgraded to ${tier} (${country.toUpperCase()})`,
    tier,
    plan: planObj,
  };
}

export async function subscribeProviderTier(
  phone: string,
  tier: string,
  options?: { payment_ref?: string }
): Promise<SubscriptionResult> {
  if (!phone || !tier) {
    return { success: false, message: 'Phone and tier are required', error: 'missing_params' };
  }

  const key = Object.keys(providerSubscriptionTiers).find(
    (k) => k.toLowerCase().includes(tier.toLowerCase()) || tier.toLowerCase() === k.replace('Kurukoo ', '').toLowerCase()
  );
  const normalized =
    tier === 'Base' || tier === 'Plus' || tier === 'Business'
      ? tier
      : key
        ? key.replace('Kurukoo ', '')
        : null;

  if (!normalized || !['Base', 'Plus', 'Business'].includes(normalized)) {
    return { success: false, message: 'Invalid tier', error: 'invalid_tier' };
  }

  const feeMap: Record<string, number> = { Base: 500, Plus: 1500, Business: 5000 };
  const fee = feeMap[normalized];

  // Never treat a client payment_ref as proof of settlement. Existing wallet
  // and provider adapters remain the only sources allowed to confirm payment.
  let paid = await chargeProviderSubscription(phone, normalized, fee);
  if (!paid) paid = await processDirectPayment(phone, 'SYSTEM', fee);

  if (!paid) {
    return {
      success: false,
      message: 'Insufficient balance or payment provider did not confirm subscription charge.',
      error: 'payment_required',
      payment_required: true,
    };
  }

  const nextBillingDate = new Date();
  nextBillingDate.setMonth(nextBillingDate.getMonth() + 1);

  const db = await getDb();
  db.run(
    `INSERT INTO provider_subscriptions (phone, tier, status, next_billing_date, leads_this_month)
     VALUES (?, ?, 'active', ?, 0)
     ON CONFLICT(phone) DO UPDATE SET
        tier=excluded.tier,
        status='active',
        next_billing_date=excluded.next_billing_date,
        leads_this_month=0`,
    [phone, normalized, nextBillingDate.toISOString()]
  );
  db.run(`UPDATE memory_profiles SET subscription_tier = ?, updated_at = CURRENT_TIMESTAMP WHERE phone = ?`, [normalized, phone]);
  saveDb();

  return {
    success: true,
    message: `Subscribed to ${normalized} tier successfully.`,
    tier: normalized,
  };
}

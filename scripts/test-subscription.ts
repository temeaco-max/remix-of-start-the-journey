import assert from 'node:assert/strict';
import { getDb } from '../src/database.js';
import { upsertProfile } from '../src/routes/authRoutes.js';
import { createPlan } from '../src/services/pricingService.js';
import { upgradeSubscriptionAfterPayment } from '../src/services/subscriptionService.js';

const phone = `+234806${String(Date.now()).slice(-8)}`;
await upsertProfile(phone, 'Subscription Actor');
await createPlan({ plan: 'MatrixPlus', country: 'ng', monthly_price_minor: 1500, currency: 'NGN', credits_per_month: 100, features: ['matrix-test'], active: 1 });

process.env.KURUKOO_PAY_PROVIDER = 'sandbox';
process.env.FORCE_SANDBOX_SUBSCRIPTION = 'false';
const unpaid = await upgradeSubscriptionAfterPayment(phone, 'MatrixPlus', 'ng', { payment_ref: 'client-supplied-metadata-only' });
assert.equal(unpaid.success, false);
assert.equal(unpaid.payment_required, true);

process.env.FORCE_SANDBOX_SUBSCRIPTION = 'true';
const granted = await upgradeSubscriptionAfterPayment(phone, 'MatrixPlus', 'ng');
assert.equal(granted.success, true);
assert.equal(granted.tier, 'Matrixplus');
const db = await getDb();
const rows = db.exec('SELECT subscription_tier FROM memory_profiles WHERE phone = ?', [phone]);
assert.equal(String(rows[0].values[0][0]), 'Matrixplus');
process.env.FORCE_SANDBOX_SUBSCRIPTION = 'false';
console.log('Subscription regression passed: payment boundary, explicit sandbox grant, and persisted customer entitlement verified.');

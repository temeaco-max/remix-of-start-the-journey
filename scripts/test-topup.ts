import assert from 'node:assert/strict';
import { getDb } from '../src/database.js';
import { upsertProfile } from '../src/routes/authRoutes.js';
import { addPoints, getPointsBalance } from '../src/services/pointsEngine.js';
import { processDirectPayment } from '../src/services/directWallet.js';

const phone = `+234811${String(Date.now()).slice(-8)}`;
await upsertProfile(phone, 'Top-up Boundary Actor');
const db = await getDb();
const pointsBefore = await getPointsBalance(phone);
const before = db.exec('SELECT wallet_balance_minor FROM memory_profiles WHERE phone = ?', [phone]);
const walletBefore = Number(before[0].values[0][0] || 0);
process.env.KURUKOO_PAY_PROVIDER = 'sandbox';
assert.equal(await processDirectPayment(phone, 'SYSTEM', 100), false, 'sandbox wallet movement must not claim payment success');
await addPoints(phone, 15, 'Sandbox top-up');
assert.equal(await getPointsBalance(phone), pointsBefore + 15);
const after = db.exec('SELECT wallet_balance_minor FROM memory_profiles WHERE phone = ?', [phone]);
assert.equal(Number(after[0].values[0][0] || 0), walletBefore, 'Points top-up must not mutate fiat wallet balance');
console.log('Top-up regression passed: sandbox Points top-up, fail-closed wallet boundary, and semantic separation verified.');

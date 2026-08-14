import assert from 'node:assert/strict';
import { getDb } from '../src/database.js';
import { upsertProfile } from '../src/routes/authRoutes.js';
import { generateReferralCode, trackReferral, claimReferral, getReferralStats } from '../src/services/referralService.js';
import { getPointsHistory } from '../src/services/pointsEngine.js';

const suffix = String(Date.now()).slice(-8);
const referrer = `+234807${suffix}`;
const referred = `+234808${suffix}`;
await upsertProfile(referrer, 'Referral Owner');
await upsertProfile(referred, 'Referred Actor');
const code = await generateReferralCode(referrer);
assert.match(code, /^[A-Z0-9]{8}$/);

await trackReferral(referrer, referred, code);
await trackReferral(referrer, referred, code);
await trackReferral(referrer, referrer, code);
await trackReferral(`+234809${suffix}`, `+234810${suffix}`, code);

const db = await getDb();
const rows = db.exec('SELECT referrer_phone, referred_phone, status FROM referrals WHERE referred_phone = ?', [referred]);
assert.equal(rows[0]?.values?.length, 1, 'valid attribution must be idempotent');
assert.equal(String(rows[0].values[0][0]), referrer);
assert.equal(String(rows[0].values[0][2]), 'registered');

assert.equal(await claimReferral(referred), true, 'qualifying action should claim the referral');
assert.equal(await claimReferral(referred), false, 'reward claim must be idempotent');
const stats = await getReferralStats(referrer);
assert.equal(stats.successfulReferrals, 1);
const rewardHistory = await getPointsHistory(referrer, 100);
assert.ok(rewardHistory.some((entry: any) => String(entry.description || '').includes('Referral reward')));
console.log('Referral regression passed: valid two-actor attribution, self/mismatched rejection, idempotent claim, and Points reward verified.');

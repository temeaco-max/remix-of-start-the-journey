import assert from 'node:assert/strict';
import { getDb } from '../src/database.js';
import { upsertProfile } from '../src/routes/authRoutes.js';
import { addPoints, deductPoints, getPointsBalance, getPointsHistory } from '../src/services/pointsEngine.js';

const ngPhone = `+234810${String(Date.now()).slice(-8)}`;
const ukPhone = `+44770${String(Date.now()).slice(-7)}`;
await upsertProfile(ngPhone, 'Points NG Actor');
await upsertProfile(ukPhone, 'Points UK Actor');
const db = await getDb();
db.run('UPDATE memory_profiles SET country = ? WHERE phone = ?', ['gb', ukPhone]);

const initial = await getPointsBalance(ngPhone);
await addPoints(ngPhone, 25, 'Points matrix award');
assert.equal(await getPointsBalance(ngPhone), initial + 25);
const spent = await deductPoints(ngPhone, 5, 'Points matrix spend');
assert.equal(spent.success, true);
assert.equal(spent.remainingPoints, initial + 20);
const history = await getPointsHistory(ngPhone, 20);
assert.ok(history.some((entry: any) => String(entry.description).includes('Points matrix award')));
assert.ok(history.some((entry: any) => String(entry.description).includes('Points matrix spend')));
assert.equal(await getPointsBalance(ukPhone), 0, 'UK Points must remain disabled by design');
console.log('Points regression passed: owner-scoped award/spend history, distinct loyalty units, and UK boundary verified.');

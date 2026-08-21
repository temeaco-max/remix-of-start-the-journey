import { getDb, saveDb, CANONICAL_OPERATOR_PHONE } from '../src/database.js';

if (process.env.NODE_ENV === 'production') throw new Error('Demo workspace reset is disabled in production.');

const db = await getDb();
const phone = process.env.KURUKOO_OPERATOR_PHONE || CANONICAL_OPERATOR_PHONE;

for (const [sql, params] of [
  ['DELETE FROM messages WHERE phone=? AND card_data LIKE ?', [phone, '%demo_seed%']],
  ['DELETE FROM saved_items WHERE phone=? AND metadata LIKE ?', [phone, '%demo_seed%']],
  ['DELETE FROM cart_items WHERE phone=? AND id LIKE ?', [phone, 'demo-%']],
  ['DELETE FROM economic_requests WHERE phone=? AND id LIKE ?', [phone, 'demo-%']],
  ['DELETE FROM economic_offers WHERE id LIKE ?', ['demo-%']],
  ['DELETE FROM reminders WHERE phone=? AND id LIKE ?', [phone, 'demo-%']],
  ['DELETE FROM internal_notifications WHERE phone=? AND title IN (SELECT title FROM internal_notifications WHERE phone=? AND body LIKE ?)', [phone, phone, '%demo%']],
  ['DELETE FROM agent_goals WHERE phone=? AND id LIKE ?', [phone, 'demo-%']],
  ['DELETE FROM topics WHERE id LIKE ?', ['demo-%']],
] as Array<[string, unknown[]]>) {
  try { db.run(sql, params); } catch {}
}
for (const key of ['demo_workspace_seed_version','demo_workspace_seeded_for','demo_workspace_seeded_at']) {
  try { db.run('DELETE FROM system_settings WHERE key=?', [key]); } catch {}
}
saveDb(true);
console.log(`Demo workspace state reset for ${phone}. Restart Kurukoo in development to re-seed the latest fixture version.`);

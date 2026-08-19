import { getDb, saveDb } from '../database.js';

/** Move due transient FCM failures back to the worker's queued state. */
export async function requeueDueFcmFailures(): Promise<number> {
  const db = await getDb();
  try {
    db.run(`UPDATE internal_notifications
      SET delivery_state = 'queued'
      WHERE delivery_state = 'failed'
        AND (next_attempt_at IS NULL OR datetime(next_attempt_at) <= datetime('now'))
        AND attempt_count < max_attempts`);
    const changed = db.getRowsModified();
    if (changed > 0) saveDb();
    return changed;
  } catch {
    return 0;
  }
}

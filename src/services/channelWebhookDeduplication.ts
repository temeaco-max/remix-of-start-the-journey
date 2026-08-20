import { getDb, saveDb } from '../database.js';

let schemaReady: Promise<void> | null = null;

async function ensureSchema(): Promise<void> {
  if (schemaReady) return schemaReady;
  schemaReady = (async () => {
    const db = await getDb();
    db.run(`CREATE TABLE IF NOT EXISTS channel_webhook_events (
      channel TEXT NOT NULL,
      source_ref TEXT NOT NULL,
      phone TEXT,
      received_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY(channel, source_ref)
    )`);
    db.run('CREATE INDEX IF NOT EXISTS idx_channel_webhook_events_received ON channel_webhook_events(received_at DESC)');
    saveDb();
  })().catch(error => { schemaReady = null; throw error; });
  return schemaReady;
}

export async function claimInboundWebhook(input: { channel: string; sourceRef?: string; phone?: string }): Promise<{ duplicate: boolean }> {
  const channel = String(input.channel || '').trim().toLowerCase();
  const sourceRef = String(input.sourceRef || '').trim();
  if (!channel || !sourceRef) return { duplicate: false };
  await ensureSchema();
  const db = await getDb();
  db.run(`INSERT OR IGNORE INTO channel_webhook_events(channel, source_ref, phone) VALUES (?, ?, ?)`, [channel, sourceRef.slice(0, 256), input.phone ? String(input.phone).slice(0, 256) : null]);
  const inserted = db.getRowsModified() === 1;
  if (inserted) saveDb();
  return { duplicate: !inserted };
}

export async function purgeOldWebhookEvents(retentionDays = 30): Promise<number> {
  await ensureSchema();
  const db = await getDb();
  const days = Math.max(1, Math.min(365, Math.floor(Number(retentionDays) || 30)));
  db.run(`DELETE FROM channel_webhook_events WHERE received_at < datetime('now', ?)`, [`-${days} days`]);
  const deleted = db.getRowsModified();
  if (deleted) saveDb();
  return deleted;
}

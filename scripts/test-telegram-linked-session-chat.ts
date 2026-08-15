import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'kurukoo-telegram-linked-chat-'));
process.env.DB_PATH = path.join(tempDir, 'telegram.sqlite');
process.env.JWT_SECRET = 'telegram-linked-session-test-secret-0123456789';
process.env.KURUKOO_DISABLE_LISTEN = 'true';
process.env.KURUKOO_CHANNEL_EVIDENCE_ENABLED = 'true';
process.env.KURUKOO_SMOLLM2_LOCAL = 'false';

try {
  const { getDb } = await import('../src/database.js');
  const { processTelegramLinkedDeviceMessageForTest } = await import('../src/services/telegramLinkedDeviceService.js');
  const replies: Array<{ chatId: string; text: string }> = [];
  const ownerPhone = '+2348030000000';
  const result = await processTelegramLinkedDeviceMessageForTest({ ownerPhone, senderId: 'telegram-sender-1', chatId: 'telegram-chat-1', text: 'What can Kurukoo help me get done?' }, async (chatId, text) => {
    replies.push({ chatId, text });
  });
  assert.equal(result.accepted, true);
  assert.equal(result.phone, 'tg_telegram-sender-1');
  assert.equal(replies.length, 1);
  assert.equal(replies[0].chatId, 'telegram-chat-1');
  assert.ok(replies[0].text.length > 0);
  const db = await getDb();
  const evidence = db.exec("SELECT channel, evidence_type, consented FROM channel_evidence WHERE phone=? AND channel='telegram'", [ownerPhone])[0]?.values || [];
  assert.equal(evidence.length, 1);
  assert.equal(String(evidence[0][1]), 'verified_personal_linked_session_inbound');
  const eventRows = db.exec("SELECT type, producer, payload_json FROM coordinator_events WHERE type IN ('channel.evidence.observed','chat.turn.completed') ORDER BY created_at ASC")[0]?.values || [];
  assert.ok(eventRows.some(row => String(row[0]) === 'channel.evidence.observed' && String(row[1]) === 'progressiveTrustService'));
  assert.ok(eventRows.some(row => String(row[0]) === 'chat.turn.completed' && String(row[2]).includes('telegram')));
  assert.ok(!eventRows.some(row => String(row[2]).includes('What can Kurukoo help')));
  console.log('Telegram linked-session Chat regression passed: evidence, canonical Chat handoff, reply capture, coordinator routing, and telemetry redaction are enforced.');
} finally {
  fs.rmSync(tempDir, { recursive: true, force: true });
}

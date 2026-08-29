/* Copyright (c) 2026 temeaco-max. All rights reserved. Proprietary and confidential. */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const dbPath = path.join(os.tmpdir(), `kurukoo-whatsapp-parity-${process.pid}-${Date.now()}.sqlite`);
process.env.DB_PATH = dbPath;
process.env.NODE_ENV = 'test';
process.env.KURUKOO_SMOLLM2_LOCAL = 'false';
process.env.WHATSAPP_TOKEN = 'provider-fixture-token';
process.env.WHATSAPP_PHONE_NUMBER_ID = 'provider-fixture-number';
process.env.WHATSAPP_APP_SECRET = '';

const { getDb } = await import('../src/database.js');
const { updateProfile } = await import('../src/services/memoryProfile.js');
const { processCanonicalChatTurn } = await import('../src/services/canonicalChatTurnService.js');
const { handleWhatsAppWebhook, verifyWhatsAppSignature } = await import('../src/channels/whatsapp.js');
const { handleSmsWebhook } = await import('../src/channels/sms.js');

const phone = '+2348012345678';
const db = await getDb();
await updateProfile(phone, 'whatsapp-parity-test', {
  name: 'WhatsApp Parity User',
  location: 'Ikeja',
  country: 'ng',
  preferences: { onboarding_complete: true },
});

const outbound: Array<{ url: string; body: any }> = [];
const originalFetch = globalThis.fetch;
globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
  const body = typeof init?.body === 'string' ? JSON.parse(init.body) : undefined;
  outbound.push({ url: String(input), body });
  return new Response(JSON.stringify({ messages: [{ id: `wamid.fixture.${outbound.length}` }] }), {
    status: 200,
    headers: { 'content-type': 'application/json' },
  });
}) as typeof fetch;

try {
  const webTurn = await processCanonicalChatTurn({
    phone,
    message: 'Remember that I prefer short answers.',
    channel: 'web',
  });

  const whatsappResult = await handleWhatsAppWebhook({
    entry: [{ changes: [{ value: {
      metadata: { phone_number_id: 'provider-fixture-number' },
      messages: [{
        from: phone.slice(1),
        id: 'wamid.inbound.fixture',
        type: 'text',
        text: { body: 'What do you remember about me?' },
      }],
    } }] }],
  }, '');

  assert.equal(whatsappResult.status, 'success', 'WhatsApp fixture should complete through the canonical adapter');
  assert.equal(whatsappResult.conversationId, webTurn.conversationId, 'WhatsApp should continue the phone-scoped canonical conversation');
  assert.match(String(whatsappResult.response), /short answers|remember/i, 'WhatsApp should use the same memory-backed routing semantics');
  assert.ok(outbound.some(item => item.body?.to === phone.slice(1) && item.body?.type === 'text'), 'WhatsApp adapter should use the provider outbound boundary');

  const smsResult = await handleSmsWebhook({ From: phone, Body: 'Continue where we left off.' });
  assert.equal(smsResult.status, 'success', 'SMS should complete through the shared canonical handler');
  assert.equal(smsResult.conversationId, webTurn.conversationId, 'SMS should continue the same phone-scoped canonical conversation');

  const rowsStmt = db.prepare('SELECT channel, thread_id, COUNT(*) AS count FROM messages WHERE phone = ? GROUP BY channel, thread_id ORDER BY channel');
  rowsStmt.bind([phone]);
  const channelRows: any[][] = [];
  while (rowsStmt.step()) channelRows.push(Object.values(rowsStmt.getAsObject()));
  rowsStmt.free();
  assert.ok(channelRows.some(row => row[0] === 'web' && row[1] === webTurn.conversationId), 'Web should persist into the canonical conversation');
  assert.ok(channelRows.some(row => row[0] === 'whatsapp' && row[1] === webTurn.conversationId), 'WhatsApp should persist into the canonical conversation');
  assert.ok(channelRows.some(row => row[0] === 'sms' && row[1] === webTurn.conversationId), 'SMS should persist into the canonical conversation');

  process.env.NODE_ENV = 'production';
  process.env.WHATSAPP_APP_SECRET = 'fixture-secret';
  assert.equal(verifyWhatsAppSignature('{}', ''), false, 'production WhatsApp signature verification must fail closed');
  process.env.NODE_ENV = 'test';
  process.env.WHATSAPP_APP_SECRET = '';

  console.log('WhatsApp parity contract passed: Web, WhatsApp, and SMS share identity, conversation, memory-backed routing, persistence, provider-boundary delivery, and production signature fail-closed behavior.');
} finally {
  globalThis.fetch = originalFetch;
  try { fs.unlinkSync(dbPath); } catch {}
}

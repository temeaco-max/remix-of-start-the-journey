/* Copyright (c) 2026 temeaco-max. All rights reserved. Proprietary and confidential. */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import type { AddressInfo } from 'node:net';
import jwt from 'jsonwebtoken';

const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'kurukoo-notifications-'));
process.env.NODE_ENV = 'test';
process.env.DB_PATH = path.join(tempDir, 'notifications.sqlite');
process.env.JWT_SECRET = 'notification-queue-test-secret-0123456789';
process.env.ADMIN_USERNAME = 'queue-admin';
process.env.ADMIN_PASSWORD = 'queue-admin-password';
process.env.KURUKOO_DISABLE_LISTEN = 'true';

const { app } = await import('../src/index.js');
const { getDb } = await import('../src/database.js');
const { listQueuedNotifications, recordNotificationAttempt, sendFcmPush, transitionNotificationDelivery } = await import('../src/services/pushNotifications.js');
const { processCanonicalChatTurn } = await import('../src/services/canonicalChatTurnService.js');

const phone = '+2348090000000';
const otherPhone = '+2348090000001';
const userToken = (identity: string) => jwt.sign({ phone: identity, role: 'user' }, process.env.JWT_SECRET!, { algorithm: 'HS256' });
const userHeaders = (identity: string) => ({ Authorization: `Bearer ${userToken(identity)}` });

const server = app.listen(0, '127.0.0.1');
await new Promise<void>((resolve, reject) => {
  server.once('listening', resolve);
  server.once('error', reject);
});
const { port } = server.address() as AddressInfo;
const baseUrl = `http://127.0.0.1:${port}`;

try {
  assert.equal(await sendFcmPush(phone, 'Deferred match', 'A provider is available.', '/chat?requestId=123', {
    contextId: 'request:123',
    conversationId: 'conversation-123',
    availableAction: 'review',
    canonicalAction: 'economic_request.review_match',
    objectType: 'economic_request',
    objectId: '123',
    ownerScope: phone,
    idempotencyKey: 'notification-test:request:123',
    surface: 'chat',
  }), false, 'Unconfigured FCM must not claim delivery');

  const ownerList = await fetch(`${baseUrl}/api/notifications`, { headers: userHeaders(phone) });
  assert.equal(ownerList.status, 200, 'Authenticated owner should list internal notifications');
  const ownerPayload = await ownerList.json() as { notifications?: Array<{ id: number; status: string; link: string; context_id?: string; conversation_id?: string; available_action?: string; canonical_action?: string; object_type?: string; object_id?: string; owner_scope?: string; idempotency_key?: string }> };
  assert.equal(ownerPayload.notifications?.length, 1, 'Queued notification should appear once in the owner inbox');
  const notification = ownerPayload.notifications?.[0];
  assert.equal(notification?.status, 'unread', 'New internal notifications should be unread');
  assert.equal(notification?.link, '/chat?requestId=123&conversationId=conversation-123&contextId=request%3A123&action=review&canonicalAction=economic_request.review_match&objectType=economic_request&objectId=123', 'Notification link should preserve exact canonical context');
  assert.equal(notification?.context_id, 'request:123');
  assert.equal(notification?.conversation_id, 'conversation-123');
  assert.equal(notification?.canonical_action, 'economic_request.review_match');
  assert.equal(notification?.object_type, 'economic_request');
  assert.equal(notification?.object_id, '123');
  assert.equal(notification?.owner_scope, phone);
  assert.equal(notification?.idempotency_key, 'notification-test:request:123');
  const resumed = await processCanonicalChatTurn({ phone, message: 'Continue this update', channel: 'web', conversationId: 'conversation-123', contextAction: { type: 'resume_canonical_context', contextId: `notification:${notification!.id}`, conversationId: 'conversation-123', canonicalAction: 'notification.open', objectType: 'notification', objectId: String(notification!.id) } });
  assert.equal(resumed.cardData?.type, 'canonical_context', 'Owner should reopen the exact notification context through Chat');
  assert.equal(resumed.cardData?.objectId, String(notification!.id), 'Chat must preserve exact notification identity');
  const rejected = await processCanonicalChatTurn({ phone: otherPhone, message: 'Continue this update', channel: 'web', conversationId: 'conversation-123', contextAction: { type: 'resume_canonical_context', contextId: `notification:${notification!.id}`, conversationId: 'conversation-123', canonicalAction: 'notification.open', objectType: 'notification', objectId: String(notification!.id) } });
  assert.equal(rejected.cardData?.type, 'canonical_context_unavailable', 'Another owner must not reopen the notification context');
  const queuedBeforeAttempt = await listQueuedNotifications();
  assert.equal(queuedBeforeAttempt.some(item => item.id === notification?.id && item.delivery_state === 'queued'), true, 'Unconfigured delivery must remain durably queued');
  assert.equal(await recordNotificationAttempt(notification!.id, 'provider_not_configured', phone), 'queued', 'First failed attempt should schedule a retry');
  assert.equal(await listQueuedNotifications().then(items => items.some(item => item.id === notification?.id)), false, 'Backoff should keep a failed notification out of the immediate retry set');
  assert.equal(await recordNotificationAttempt(notification!.id, 'provider_not_configured', phone), 'queued', 'Second failed attempt should remain retryable');
  assert.equal(await recordNotificationAttempt(notification!.id, 'provider_not_configured', phone), 'dead_letter', 'Notification should dead-letter at the bounded attempt limit');
  const dbAfterDeadLetter = await getDb();
  const deadLetter = dbAfterDeadLetter.exec('SELECT delivery_state, attempt_count, dead_lettered_at FROM internal_notifications WHERE id = ?', [notification!.id]);
  assert.equal(deadLetter[0]?.values?.[0]?.[0], 'dead_letter', 'Dead-letter state must be explicit and durable');
  assert.equal(deadLetter[0]?.values?.[0]?.[1], 3, 'Dead-letter attempt count must be durable');
  assert.ok(deadLetter[0]?.values?.[0]?.[2], 'Dead-letter timestamp must be recorded');
  assert.equal(await transitionNotificationDelivery(notification!.id, 'queued', phone), false, 'A dead-letter notification must not be resurrected by a late callback');
  assert.equal(await transitionNotificationDelivery(notification!.id, 'dead_letter', phone), true, 'Repeating the terminal dead-letter state must remain idempotent');

  const otherList = await fetch(`${baseUrl}/api/notifications`, { headers: userHeaders(otherPhone) });
  const otherPayload = await otherList.json() as { notifications?: unknown[] };
  assert.equal(otherList.status, 200, 'Another authenticated user may query their own inbox');
  assert.equal(otherPayload.notifications?.length || 0, 0, 'Internal notifications must be owner-scoped');

  const markRead = await fetch(`${baseUrl}/api/notifications/${notification?.id}/read`, {
    method: 'POST',
    headers: userHeaders(phone),
  });
  assert.equal(markRead.status, 200, 'Owner should mark a notification read');

  const repeatedRead = await fetch(`${baseUrl}/api/notifications/${notification?.id}/read`, {
    method: 'POST',
    headers: userHeaders(phone),
  });
  assert.equal(repeatedRead.status, 200, 'Repeated notification read should remain idempotent');

  const unauthorizedRead = await fetch(`${baseUrl}/api/notifications/${notification?.id}/read`, {
    method: 'POST',
    headers: userHeaders(otherPhone),
  });
  assert.equal(unauthorizedRead.status, 404, 'Another owner must not mark the notification read');

  const health = await fetch(`${baseUrl}/health`);
  const healthPayload = await health.json() as { status?: string; scheduled_reminders?: number; active_check_ins?: number };
  assert.equal(health.status, 200, 'Health endpoint should remain available');
  assert.equal(healthPayload.status, 'ok', 'Health should report the database as available');
  assert.equal(typeof healthPayload.scheduled_reminders, 'number', 'Health should report reminder observability');
  assert.equal(typeof healthPayload.active_check_ins, 'number', 'Health should report safety observability');

  const adminAuth = await fetch(`${baseUrl}/api/admin/auth`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: 'queue-admin', password: 'queue-admin-password' }),
  });
  assert.equal(adminAuth.status, 200, 'Configured admin should authenticate');
  const adminPayload = await adminAuth.json() as { token?: string };
  assert.ok(adminPayload.token, 'Admin auth should issue a token');

  const stats = await fetch(`${baseUrl}/api/admin/stats`, { headers: { Authorization: `Bearer ${adminPayload.token}` } });
  const statsPayload = await stats.json() as { success?: boolean; economic_requests?: unknown; reminders?: unknown; check_ins?: unknown; unread_internal_notifications?: number; notification_queue?: { total?: number; queued?: number; deadLetter?: number } };
  assert.equal(stats.status, 200, 'Admin should access platform stats');
  assert.equal(statsPayload.success, true, 'Stats should return a successful payload');
  assert.equal(typeof statsPayload.economic_requests, 'object', 'Stats should include economic request status counts');
  assert.equal(typeof statsPayload.reminders, 'object', 'Stats should include reminder status counts');
  assert.equal(typeof statsPayload.check_ins, 'object', 'Stats should include safety check-in status counts');
  assert.equal(statsPayload.unread_internal_notifications, 0, 'Stats should reflect the read notification');
  assert.equal(typeof statsPayload.notification_queue?.total, 'number', 'Admin stats should expose durable notification queue totals');
  assert.equal(typeof statsPayload.notification_queue?.queued, 'number', 'Admin stats should expose queued notification count');
  assert.equal(typeof statsPayload.notification_queue?.deadLetter, 'number', 'Admin stats should expose dead-letter notification count');

  const db = await getDb();
  const queued = db.exec('SELECT status FROM internal_notifications WHERE phone = ?', [phone]);
  assert.equal(queued[0]?.values?.[0]?.[0], 'read', 'Queue state should persist the owner-scoped read transition');
  console.log('Notification queue tests passed');
} finally {
  server.close();
}

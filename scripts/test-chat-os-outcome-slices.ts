import assert from 'node:assert/strict';
import { routeIntent } from '../src/services/intentRouter.js';
import { sendFcmPush } from '../src/services/pushNotifications.js';

const phone = `+234807${String(Date.now()).slice(-7)}`;
const conversationId = `chat-os-outcomes-${Date.now()}`;

const remembered = await routeIntent('Remember that I prefer concise answers.', phone, undefined, undefined, conversationId);
assert.equal(remembered.skill, 'memory');
assert.equal(remembered.cardData?.type, 'memory_action');
assert.equal(remembered.canonicalAction, 'memory.record');

const memory = await routeIntent('What do you remember?', phone, undefined, undefined, conversationId);
assert.equal(memory.cardData?.type, 'memory');
assert.ok(memory.cardData?.ownerScoped);

const reminder = await routeIntent('Remind me in 2 hours to review the outcome slices.', phone, undefined, undefined, conversationId);
assert.equal(reminder.skill, 'reminder');
assert.equal(reminder.cardData?.type, 'reminder');
assert.equal(reminder.cardData?.reminder?.status, 'scheduled');

const reminders = await routeIntent('Show my reminders.', phone, undefined, undefined, conversationId);
assert.equal(reminders.cardData?.type, 'reminders');
assert.equal(reminders.cardData?.reminders?.length, 1);
const reminderId = String(reminders.cardData.reminders[0].id);
const cancelled = await routeIntent(`Cancel reminder ${reminderId}.`, phone, undefined, undefined, conversationId);
assert.equal(cancelled.cardData?.type, 'reminder_action');
assert.equal(cancelled.cardData?.status, 'completed');

await sendFcmPush(phone, 'Kurukoo test update', 'A stored update is ready for review.', '/chat/', { conversationId, canonicalAction: 'test.update', ownerScope: phone, idempotencyKey: `chat-os:${phone}` });
const notifications = await routeIntent('Show my notifications.', phone, undefined, undefined, conversationId);
assert.equal(notifications.cardData?.type, 'notifications');
assert.ok(notifications.cardData?.notifications?.length >= 1);
const notificationId = Number(notifications.cardData.notifications[0].id);
const marked = await routeIntent(`Mark notification ${notificationId} as read.`, phone, undefined, undefined, conversationId);
assert.equal(marked.cardData?.type, 'notification_action');
assert.equal(marked.cardData?.status, 'completed');

const points = await routeIntent('What is my points balance?', phone, undefined, undefined, conversationId);
assert.equal(points.cardData?.type, 'os_status');
assert.equal(points.cardData?.domain, 'points');

const subscription = await routeIntent('What is my subscription?', phone, undefined, undefined, conversationId);
assert.equal(subscription.cardData?.type, 'os_status');
assert.equal(subscription.cardData?.domain, 'subscription');

const channel = await routeIntent('Is WhatsApp connected?', phone, undefined, undefined, conversationId);
assert.equal(channel.cardData?.type, 'os_status');
assert.equal(channel.cardData?.domain, 'channel');

const requestStatus = await routeIntent("What's the status of my request?", phone, undefined, undefined, conversationId);
assert.equal(requestStatus.cardData?.type, 'request_status');
assert.equal(requestStatus.cardData?.status, 'not_found');

console.log('Chat OS outcome slices passed: memory record/review, reminder create/list/cancel, notification inbox/read, Points/subscription/channel status, and exact request-status fallback.');

process.exit(0);


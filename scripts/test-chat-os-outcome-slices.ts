import assert from 'node:assert/strict';
import { routeIntent } from '../src/services/intentRouter.js';
import { processCanonicalChatTurn } from '../src/services/canonicalChatTurnService.js';
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

const createContext = { relation: 'create' } as any;
const makeDomainPhone = (offset: number) => `+234${String(Date.now() + offset).slice(-10)}`;
const recurringReminder = await routeIntent('Remind me every day at 9am to call John', makeDomainPhone(13), undefined, undefined, `${conversationId}-recurring-reminder`);
assert.equal(recurringReminder.skill, 'reminder');
assert.equal(recurringReminder.cardData?.type, 'reminder');
assert.equal(recurringReminder.cardData?.reminder?.status, 'scheduled');

const untilDoneReminder = await routeIntent('Keep reminding me until I deal with this', makeDomainPhone(15), undefined, undefined, `${conversationId}-until-done-reminder`);
assert.equal(untilDoneReminder.skill, 'reminder');
assert.equal(untilDoneReminder.cardData?.type, 'reminder_setup');
assert.equal(untilDoneReminder.cardData?.status, 'needs_user');

const plumber = await routeIntent('Find me a plumber tomorrow', makeDomainPhone(17), undefined, createContext, `${conversationId}-plumber`);
assert.equal(plumber.skill, 'find_worker');
assert.equal(plumber.cardData?.type, 'agentic_storefront');

const food = await routeIntent('Find me a good place to eat nearby', makeDomainPhone(23), undefined, createContext, `${conversationId}-food`);
assert.equal(food.skill, 'order_food');
assert.equal(food.cardData?.type, 'agentic_storefront');

const transport = await routeIntent('Get me to the airport tomorrow', makeDomainPhone(29), undefined, createContext, `${conversationId}-transport`);
assert.equal(transport.skill, 'ride_request');
assert.equal(transport.cardData?.type, 'agentic_storefront');

const charger = await routeIntent('Buy me a replacement charger', makeDomainPhone(31), undefined, createContext, `${conversationId}-charger`);
assert.equal(charger.skill, 'product_sourcing');
assert.equal(charger.cardData?.type, 'agentic_storefront');

const teacher = await routeIntent('Find someone who teaches guitar', makeDomainPhone(37), undefined, createContext, `${conversationId}-teacher`);
assert.equal(teacher.skill, 'find_worker');
assert.equal(teacher.cardData?.type, 'agentic_storefront');

const monitoring = await routeIntent('Keep an eye on my Wi-Fi', makeDomainPhone(41), undefined, undefined, `${conversationId}-monitoring`);
assert.equal(monitoring.skill, 'autonomous_agent');
assert.equal(monitoring.cardData?.type, 'monitoring_setup');

const communication = await routeIntent('Tell John I am late', makeDomainPhone(43), undefined, undefined, `${conversationId}-communication`);
assert.equal(communication.skill, 'communication');
assert.equal(communication.cardData?.type, 'communication_prepare');
assert.equal(communication.cardData?.deliveryState, 'not_sent');

const monitoringTurn = await processCanonicalChatTurn({ phone: makeDomainPhone(47), message: 'Keep an eye on my Wi-Fi', channel: 'web', conversationId: `${conversationId}-monitoring-turn` });
assert.equal(monitoringTurn.cardData?.type, 'monitoring_setup');

const communicationTurn = await processCanonicalChatTurn({ phone: makeDomainPhone(53), message: 'Tell John I am late', channel: 'web', conversationId: `${conversationId}-communication-turn` });
assert.equal(communicationTurn.cardData?.type, 'communication_prepare');
assert.equal(communicationTurn.cardData?.deliveryState, 'not_sent');

const brief = await processCanonicalChatTurn({ phone, message: 'Show me what I need to deal with.', channel: 'web', conversationId });
assert.equal(brief.cardData?.type, 'agent_brief');

const firstItem = await processCanonicalChatTurn({ phone, message: 'Deal with the first one.', channel: 'web', conversationId });
assert.ok(['agent_brief', 'notification_action', 'reminder_action', 'task_action', 'agent_goal', 'agentic_storefront'].includes(String(firstItem.cardData?.type)));

const requestStatus = await routeIntent("What's the status of my request?", phone, undefined, undefined, conversationId);
assert.equal(requestStatus.cardData?.type, 'request_status');
assert.equal(requestStatus.cardData?.status, 'not_found');

console.log('Chat OS outcome slices passed: memory record/review, one-shot and recurring reminders, safe until-complete reminder clarification, notification inbox/read, provider/food/transport/product/discovery outcome routing, monitoring setup, communication preparation, Agent Brief attention and first-item continuation, Points/subscription/channel status, and exact request-status fallback.');

process.exit(0);


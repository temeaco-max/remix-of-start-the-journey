import assert from 'node:assert/strict';
import { getDb, saveDb } from '../src/database.js';
import { recordPlatformJourneyEvent, listPlatformJourneyEvents } from '../src/services/platformJourneyWeaver.js';

const id = `journey_test_${Date.now()}`;
const phone = `journey_user_${Date.now()}`;
const db = await getDb();
try {
  const event = await recordPlatformJourneyEvent({
    eventKey: `${id}:dispatch-completed`,
    contextId: `request:${id}`,
    eventType: 'dispatch_completed',
    actorPhone: phone,
    customerPhone: phone,
    economicRequestId: id,
    objectType: 'dispatch_lead',
    objectId: id,
    skill: 'okada_rider',
    category: 'transport-mobility',
    metadata: { source: 'regression' },
  });
  assert.equal(event.eventType, 'dispatch_completed');
  const events = await listPlatformJourneyEvents({ economicRequestId: id, phone });
  assert.equal(events.length, 1);
  assert.equal(events[0].contextId, `request:${id}`);
  console.log(JSON.stringify({ passed: true, eventId: event.id }, null, 2));
} finally {
  try { db.run('DELETE FROM platform_journey_events WHERE event_key LIKE ?', [`${id}%`]); } catch {}
  saveDb(true);
}

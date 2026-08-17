import assert from 'node:assert/strict';
import { registerConnectedResource, activateConnectedResource, controlConnectedResource } from '../src/services/connectedResourceService.js';

const phone = `+234809${String(Date.now()).slice(-7)}`;
const { resource, challenge } = await registerConnectedResource({
  phone,
  kind: 'iot',
  label: 'Kitchen relay',
  protocol: 'mqtt',
  capabilities: ['control'],
  metadata: { baseTopic: 'kurukoo/test/kitchen-relay' },
});
const activated = await activateConnectedResource(phone, resource.id, challenge.code);
assert.equal(activated?.status, 'active');

const first = await controlConnectedResource({ phone, id: resource.id, command: 'control', payload: 'on', idempotencyKey: 'ledger-test-1' });
assert.equal(first.accepted, false);
assert.equal(first.state, 'not_configured');
assert.ok(first.commandId);

const replay = await controlConnectedResource({ phone, id: resource.id, command: 'control', payload: 'on', idempotencyKey: 'ledger-test-1' });
assert.equal(replay.commandId, first.commandId);
assert.equal(replay.state, first.state);
assert.equal(replay.accepted, first.accepted);

const blocked = await controlConnectedResource({ phone, id: resource.id, command: 'unsupported', payload: '', idempotencyKey: 'ledger-test-2' });
assert.equal(blocked.state, 'blocked');
assert.equal(blocked.accepted, false);

console.log('Connected-resource command ledger regression passed: owner scope, capability gating, truthful MQTT readiness, persisted command identity, and idempotent replay.');

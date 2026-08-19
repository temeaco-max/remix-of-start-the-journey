import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const dbPath = path.join(os.tmpdir(), `kurukoo-execution-${process.pid}-${Date.now()}.sqlite`);
process.env.DB_PATH = dbPath;
process.env.NODE_ENV = 'production';
process.env.JWT_SECRET = 'test-jwt-secret';
process.env.KURUKOO_PAY_PROVIDER = 'sandbox';
process.env.FF_PRIVATE_NUMBER_MASKING = 'true';
process.env.NUMBER_MASKING_PROVIDER = 'test-proxy-provider';
process.env.KURUKOO_EXTERNAL_EXECUTION_ENABLED = 'false';

const { getDb, saveDb } = await import('../src/database.js');
const { createEconomicRequest, getEconomicRequest } = await import('../src/services/skillFlows.js');
const { addEconomicParticipant } = await import('../src/services/economicParticipants.js');
const { getRealNumber, getPrivacyBridgeStatus } = await import('../src/services/privacyBridge.js');
const {
  authorizeProviderConnector,
  revokeProviderConnector,
  authorizeProviderExecution,
  createExecutionRequest,
  dispatchExecutionRequest,
  drainPendingExecutionRequests,
  completeDevelopmentExecution,
  getExecutionRequest,
  updateExecutionStatus,
  recordExecutionEvidence,
} = await import('../src/services/executionConnector.js');

const db = await getDb();
const buyerPhone = '+2347000020101';
const deliveryPhone = '+2347000020102';
const unconnectedPhone = '+2347000020103';
const requestId = 'execution-boundary-request';

for (const [phone, name, verified] of [
  [buyerPhone, 'Execution test buyer', 0],
  [deliveryPhone, 'Execution test delivery provider', 1],
  [unconnectedPhone, 'Unconnected delivery provider', 1],
] as const) {
  db.run("INSERT INTO memory_profiles (phone,name,location,country,is_available,verified_provider,provider_type) VALUES (?,?,'Ikeja','ng',1,?,?)", [phone, name, verified, 'human']);
}
db.run("INSERT INTO skills (phone,skill,is_available,hourly_rate,rating) VALUES (?, 'delivery',1,1200,4.8)", [deliveryPhone]);
db.run("INSERT INTO skills (phone,skill,is_available,hourly_rate,rating) VALUES (?, 'delivery',1,1300,4.7)", [unconnectedPhone]);

await createEconomicRequest({ id: requestId, phone: buyerPhone, skill: 'product_sourcing', requirements: { product: 'known generator', location: 'Ikeja' }, amount: 8000 });
await addEconomicParticipant({ requestId, ownerPhone: buyerPhone, role: 'delivery_provider', providerPhone: deliveryPhone, capability: 'delivery', status: 'selected' });
await addEconomicParticipant({ requestId, ownerPhone: buyerPhone, role: 'delivery_provider', providerPhone: unconnectedPhone, capability: 'delivery', status: 'offered' });

const before = await getEconomicRequest(requestId);
assert.equal(before?.status, 'requested');
assert.equal(before?.providerPhone, null);

const blocked = await authorizeProviderExecution({ requestId, providerPhone: unconnectedPhone, role: 'delivery_provider', capability: 'delivery', actionRequested: 'dispatch_delivery' });
assert.deepEqual(blocked, { authorized: false, reason: 'No active authorized connector permits this action' });
await assert.rejects(() => createExecutionRequest({ requestId, actionId: 'unauthorized-action', providerPhone: unconnectedPhone, role: 'delivery_provider', capability: 'delivery', actionRequested: 'dispatch_delivery', idempotencyKey: 'blocked-execution', correlationId: `corr-${requestId}` }), /No active authorized connector/i);

await authorizeProviderConnector({ providerPhone: deliveryPhone, connectorId: 'kurukoo_dummy_test_v1', capability: 'delivery', externalProviderId: 'dummy-delivery-provider-1', allowedActions: ['dispatch_delivery'] });
const authorization = await authorizeProviderExecution({ requestId, providerPhone: deliveryPhone, role: 'delivery_provider', capability: 'delivery', actionRequested: 'dispatch_delivery' });
assert.equal(authorization.authorized, true);
if (!authorization.authorized) throw new Error('Expected explicit connector authorization');
assert.equal(authorization.connectorId, 'kurukoo_dummy_test_v1');

const created = await createExecutionRequest({ requestId, actionId: 'dispatch-action-1', providerPhone: deliveryPhone, role: 'delivery_provider', capability: 'delivery', actionRequested: 'dispatch_delivery', idempotencyKey: 'delivery-dispatch-idempotency-1', correlationId: `corr-${requestId}`, authorizationContext: { invoked_by: buyerPhone, reason: 'buyer selected delivery provider', environment: 'development' } });
assert.equal(created.status, 'pending');
assert.equal(created.connectorId, 'kurukoo_dummy_test_v1');
const proxyContact = String(created.authorizationContext.privateContactNumber || '');
assert.match(proxyContact, /^\+2348009\d{7}$/);
assert.notEqual(proxyContact, deliveryPhone);
assert.equal(await getRealNumber(proxyContact), deliveryPhone);
assert.equal(getPrivacyBridgeStatus().externalActivationRequired, true);

const disabledWorker = await drainPendingExecutionRequests();
assert.deepEqual(disabledWorker, { attempted: 0, advanced: 0, failed: 0 }, 'execution worker must be fail-closed when external execution is disabled');

process.env.KURUKOO_EXTERNAL_EXECUTION_ENABLED = 'true';
const workerResult = await drainPendingExecutionRequests(20);
assert.equal(workerResult.attempted, 1, 'enabled execution worker should pick up the durable pending execution');
assert.equal(workerResult.failed, 0);
assert.equal(workerResult.advanced, 1);
const dispatched = await getExecutionRequest(created.id);
assert.equal(dispatched?.status, 'acknowledged');
assert.match(dispatched?.externalReference || '', /^DUMMY-EXEC_/i);
assert.equal(dispatched?.evidence[0]?.source, 'connector_reported');
assert.equal(dispatched?.evidence[0]?.verificationState, 'pending_review');
process.env.KURUKOO_EXTERNAL_EXECUTION_ENABLED = 'false';

const duplicate = await createExecutionRequest({ requestId, actionId: 'different-action-must-not-duplicate', providerPhone: deliveryPhone, role: 'delivery_provider', capability: 'delivery', actionRequested: 'dispatch_delivery', idempotencyKey: 'delivery-dispatch-idempotency-1', correlationId: `corr-${requestId}` });
assert.equal(duplicate.id, created.id);
assert.equal((await getExecutionRequest(created.id))?.evidence.length, 1);

process.env.NODE_ENV = 'development';
const simulated = await completeDevelopmentExecution(created.id);
assert.equal(simulated.status, 'succeeded');
assert.equal(simulated.authorizationContext.environment, 'development');
assert.equal(simulated.evidence.some((item) => item.type === 'development_dispatch_progress' && item.payload.simulated === true), true);
assert.equal(simulated.evidence.some((item) => item.type === 'development_execution_result' && item.payload.simulated === true), true);
process.env.NODE_ENV = 'production';
assert.equal((await updateExecutionStatus(created.id, 'succeeded')).status, 'succeeded');
await assert.rejects(() => updateExecutionStatus(created.id, 'pending'), /Invalid execution transition/i);

const withProviderEvidence = await recordExecutionEvidence(created.id, { id: 'provider-handover-001', source: 'provider_reported', type: 'collection_confirmation', scope: 'delivery_provider', submittedBy: deliveryPhone, verificationState: 'unverified', payload: { reference: 'provider-reported-collection' } });
assert.equal(withProviderEvidence.evidence.at(-1)?.source, 'provider_reported');
assert.equal(withProviderEvidence.evidence.at(-1)?.verificationState, 'unverified');
const withKurukooEvidence = await recordExecutionEvidence(created.id, { id: 'buyer-selection-001', source: 'kurukoo_recorded', type: 'delivery_selection', scope: 'delivery_provider', submittedBy: buyerPhone, verificationState: 'verified', payload: { selected: deliveryPhone } });
assert.equal(withKurukooEvidence.evidence.at(-1)?.source, 'kurukoo_recorded');
assert.equal(withKurukooEvidence.evidence.at(-1)?.verificationState, 'verified');
const repeatedEvidence = await recordExecutionEvidence(created.id, { id: 'buyer-selection-001', source: 'kurukoo_recorded', type: 'delivery_selection', scope: 'delivery_provider', submittedBy: buyerPhone, payload: { selected: deliveryPhone } });
assert.equal(repeatedEvidence.evidence.filter((item) => item.id === 'buyer-selection-001').length, 1);

const after = await getEconomicRequest(requestId);
assert.equal(after?.status, 'requested');
assert.equal(after?.providerPhone, null);
const privacyEvents = db.exec("SELECT type, payload_json FROM coordinator_events WHERE type IN ('privacy.number_mapping.created','privacy.number_mapping.released')")[0]?.values || [];
assert.ok(privacyEvents.some(row => String(row[0]) === 'privacy.number_mapping.created'));
assert.ok(!privacyEvents.some(row => String(row[1]).includes(deliveryPhone)));

await revokeProviderConnector({ providerPhone: deliveryPhone, connectorId: 'kurukoo_dummy_test_v1', capability: 'delivery' });
const revoked = await authorizeProviderExecution({ requestId, providerPhone: deliveryPhone, role: 'delivery_provider', capability: 'delivery', actionRequested: 'dispatch_delivery' });
assert.deepEqual(revoked, { authorized: false, reason: 'No active authorized connector permits this action' });

saveDb(true);
try { fs.rmSync(dbPath, { force: true }); } catch {}
console.log('Execution boundary regression checks passed');
console.log('Verified: explicit authorization, durable execution worker gating, dummy dispatch, development progression, idempotency, typed evidence, privacy isolation, unchanged Economic Request boundaries, and connector revocation.');

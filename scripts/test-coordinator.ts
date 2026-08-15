import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const isolatedDbPath = path.join(os.tmpdir(), `kurukoo-coordinator-${process.pid}-${Date.now()}.sqlite`);
process.env.DB_PATH = isolatedDbPath;
process.env.KURUKOO_AGENT_ENABLED = 'true';
process.env.KURUKOO_AGENT_AUTONOMOUS = 'true';
process.env.KURUKOO_AGENT_AUTONOMOUS_LOW_RISK = 'false';
process.env.KURUKOO_COORDINATOR_TEACHER_ENABLED = 'false';
process.on('exit', () => { try { fs.rmSync(isolatedDbPath, { force: true }); } catch {} });

const { upsertProfile } = await import('../src/routes/authRoutes.js');
const { createEconomicRequest } = await import('../src/services/skillFlows.js');
const { createConversationGoal } = await import('../src/services/agentRuntime.js');
const { processCanonicalChatTurn } = await import('../src/services/canonicalChatTurnService.js');
const { getDb } = await import('../src/database.js');
const { coordinatorEventForAgentGoal, internalCoordinator } = await import('../src/services/internalCoordinator.js');
const { approveLearningArtifact, listCoordinatorRuns, ensureCoordinatorSchema, listLearningArtifacts, persistLearningArtifact } = await import('../src/services/coordinatorStore.js');
const { requestTeacherCandidate } = await import('../src/services/coordinatorLearning.js');

const owner = `+234809${String(Date.now()).slice(-7)}`;
await upsertProfile(owner, 'Coordinator Owner');
const request = await createEconomicRequest({ id: `coordinator-request-${Date.now()}`, phone: owner, skill: 'find_worker', requirements: { location: 'Ikeja', description: 'Repair help' } });
const goal = await createConversationGoal({ phone: owner, conversationId: 'coordinator-test', skill: 'find_worker', objective: 'Find repair help.', economicRequestId: request.id });
assert.ok(goal, 'Coordinator test must create an owned request goal');

const result = await internalCoordinator.handle(coordinatorEventForAgentGoal({ ownerPhone: owner, agentGoalId: goal!.id, economicRequestId: request.id, conversationId: goal!.conversationId }));
assert.equal(result.ok, true, 'Coordinator must complete the read-only request inspection');
assert.equal(result.state, 'observed', 'Coordinator must report observation rather than claim external progress');
assert.equal(result.tool, 'get_request_state', 'Coordinator must use the canonical request-state tool');
assert.equal(result.evidence?.level, 'persisted_state', 'Coordinator evidence must remain scoped to persisted state');

const runs = await listCoordinatorRuns(10);
assert.ok(runs.some(run => run.capability === 'inspect_request' && run.provider === 'deterministic' && run.model === 'rules-v1'), 'Coordinator run telemetry must persist the deterministic local-first decision');

process.env.KURUKOO_AGENT_AUTONOMOUS = 'false';
const disabled = await internalCoordinator.handle(coordinatorEventForAgentGoal({ ownerPhone: owner, agentGoalId: goal!.id, economicRequestId: request.id }));
assert.equal(disabled.ok, true, 'Disabled coordination must fail safely rather than throw');
assert.equal(disabled.state, 'observed', 'Read-only inspection remains safe when autonomous side effects are disabled');
process.env.KURUKOO_AGENT_AUTONOMOUS = 'true';

await ensureCoordinatorSchema();
const teacherDisabled = await requestTeacherCandidate({ task: 'choose_capability', event: coordinatorEventForAgentGoal({ ownerPhone: owner, agentGoalId: goal!.id, economicRequestId: request.id }) });
assert.equal(teacherDisabled.status, 'disabled', 'Teacher mode must remain opt-in');
assert.equal((await listLearningArtifacts()).length, 0, 'Disabled teacher mode must not create learning artifacts');

await persistLearningArtifact({ id: 'coordinator-test-candidate', type: 'routing_rule', content: { capability: 'inspect_request' }, provenance: { source: 'test', evidenceLevel: 'assertion' }, policyVersion: 'coordinator-policy-v1' });
const approved = await approveLearningArtifact({ id: 'coordinator-test-candidate', operatorId: 'test-operator', evaluationScore: 0.91, policyVersion: 'coordinator-policy-v1' });
assert.equal(approved.ok, true, 'Operator approval should promote a candidate artifact');
assert.equal(approved.status, 'approved', 'Approved artifact must have approved status');
const approvedAgain = await approveLearningArtifact({ id: 'coordinator-test-candidate', operatorId: 'test-operator' });
assert.equal(approvedAgain.ok, true, 'Repeated approval must remain idempotent');

await processCanonicalChatTurn({ phone: owner, message: 'What is the current status?', channel: 'web', conversationId: 'coordinator-chat' });
const db = await getDb();
const chatEvent = db.exec("SELECT type, producer, payload_json, provenance_json FROM coordinator_events WHERE id LIKE 'chat-turn:%' ORDER BY created_at DESC LIMIT 1")[0]?.values?.[0];
assert.equal(String(chatEvent?.[0]), 'chat.turn.completed', 'Canonical Chat must emit a completed-turn coordinator event');
assert.equal(String(chatEvent?.[1]), 'canonicalChatTurnService', 'Chat event must identify the canonical producer');
assert.match(String(chatEvent?.[3]), /persisted_state/, 'Chat coordinator event must carry persisted-state provenance');

console.log('Coordinator regression passed: typed event persistence, deterministic local-first capability selection, truthful evidence, fail-safe disabled behavior, and teacher opt-in boundary.');

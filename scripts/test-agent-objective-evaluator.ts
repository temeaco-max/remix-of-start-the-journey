import assert from 'node:assert/strict';
import { ensureAgentExecutionTraceSchema, recordAgentExecutionTrace } from '../src/services/agentExecutionTrace.js';
import { evaluateAgentObjective } from '../src/services/agentObjectiveEvaluator.js';

await ensureAgentExecutionTraceSchema();

const owner = `agent-eval-${Date.now()}`;
const goalId = `goal-${Date.now()}`;

await recordAgentExecutionTrace({
  ownerPhone: owner,
  goalId,
  kind: 'outcome',
  status: 'completed',
  evidence: 'external provider reported repair completed',
});

const blocked = await evaluateAgentObjective({
  ownerPhone: owner,
  goalId,
  objective: 'Repair laptop',
  planPresent: true,
  capabilityAllowed: true,
  authorizationSatisfied: true,
  dependenciesSatisfied: true,
  evidenceRequired: true,
});

assert.equal(blocked.verdict, 'fail');
assert.equal(blocked.externallyVerified, false);

await recordAgentExecutionTrace({
  ownerPhone: owner,
  goalId,
  kind: 'evidence',
  status: 'verified',
  evidence: 'verified technician completion record',
});

const passed = await evaluateAgentObjective({
  ownerPhone: owner,
  goalId,
  objective: 'Repair laptop',
  planPresent: true,
  capabilityAllowed: true,
  authorizationSatisfied: true,
  dependenciesSatisfied: true,
  evidenceRequired: true,
});

assert.equal(passed.verdict, 'pass');
assert.equal(passed.evidencePresent, true);
assert.equal(passed.externallyVerified, true);
assert.ok(passed.traceCount >= 2);

console.log('Agent objective evaluator contract passed.');

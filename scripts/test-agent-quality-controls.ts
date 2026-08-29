/* Copyright (c) 2026 temeaco-max. All rights reserved. Proprietary and confidential. */
import assert from 'node:assert/strict';
import {
  defaultAgentExecutionBudget,
  initialAgentExecutionUsage,
  checkAgentExecutionBudget,
  recordAgentExecutionAction,
  executionStopMessage,
} from '../src/services/agentExecutionControls.js';
import { evaluateAgentWork } from '../src/services/agentQualityGate.js';

const budget = defaultAgentExecutionBudget({
  KURUKOO_AGENT_MAX_ACTIONS_PER_CYCLE: '2',
  KURUKOO_AGENT_MAX_RETRIES: '1',
  KURUKOO_AGENT_MAX_ELAPSED_MS: '10000',
  KURUKOO_AGENT_MAX_CONCURRENT_GOALS: '3',
  KURUKOO_AGENT_MAX_ESTIMATED_COST_MINOR: '100',
} as NodeJS.ProcessEnv);
assert.equal(budget.maxActions, 2);
assert.equal(budget.maxRetries, 1);
assert.equal(budget.maxElapsedMs, 10000);
assert.equal(budget.maxConcurrentGoals, 3);
assert.equal(budget.maxEstimatedCostMinor, 100);

let usage = initialAgentExecutionUsage(1_000);
assert.equal(checkAgentExecutionBudget(budget, usage).allowed, true);
usage = recordAgentExecutionAction(usage, { estimatedCostMinor: 40 });
assert.equal(checkAgentExecutionBudget(budget, usage, 40).allowed, true);
usage = recordAgentExecutionAction(usage, { retry: true, estimatedCostMinor: 60 });
assert.equal(checkAgentExecutionBudget(budget, usage).allowed, false);
assert.equal(checkAgentExecutionBudget(budget, usage).reason, 'max_actions');
assert.match(executionStopMessage('max_actions'), /action budget/i);

assert.deepEqual(
  evaluateAgentWork({
    objective: 'fix laptop',
    planPresent: true,
    capabilityAllowed: true,
    authorizationSatisfied: true,
    dependenciesSatisfied: true,
  }),
  { verdict: 'pass', reasons: ['quality_requirements_satisfied'] },
);

assert.equal(
  evaluateAgentWork({
    objective: 'fix laptop',
    planPresent: true,
    requiredInputsMissing: ['device model'],
    capabilityAllowed: true,
    authorizationSatisfied: true,
    dependenciesSatisfied: true,
  }).verdict,
  'needs_user',
);

assert.equal(
  evaluateAgentWork({
    objective: 'sell laptop',
    planPresent: true,
    capabilityAllowed: true,
    authorizationSatisfied: true,
    dependenciesSatisfied: false,
  }).verdict,
  'blocked',
);

assert.equal(
  evaluateAgentWork({
    objective: 'repair laptop',
    planPresent: true,
    capabilityAllowed: true,
    authorizationSatisfied: true,
    dependenciesSatisfied: true,
    evidenceRequired: true,
    evidencePresent: false,
  }).verdict,
  'blocked',
);

assert.equal(
  evaluateAgentWork({
    objective: 'repair laptop',
    planPresent: true,
    capabilityAllowed: true,
    authorizationSatisfied: true,
    dependenciesSatisfied: true,
    externalOutcomeClaimed: true,
    externallyVerified: false,
  }).verdict,
  'fail',
);

console.log('Agent quality-control tests passed.');

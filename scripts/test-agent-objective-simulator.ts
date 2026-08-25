import assert from 'node:assert/strict';
import { simulateCompoundObjective } from '../src/services/agentObjectiveSimulator.js';

const result = simulateCompoundObjective();

assert.equal(result.parent.objective, 'Fix my laptop and sell it when it is ready');
assert.equal(result.goals.find((goal) => goal.id === 'sim-repair')?.status, 'completed');
assert.equal(result.goals.find((goal) => goal.id === 'sim-sale')?.status, 'needs_user');
assert.equal(result.quality.verdict, 'needs_user');
assert.ok(result.events.includes('repair_completed_with_verified_evidence'));
assert.ok(result.events.includes('sale_ready_but_requires_user_confirmation'));
assert.ok(result.events.includes('quality:needs_user'));
assert.equal(result.usage.actions, 2);

console.log('Agent objective simulator contract passed.');

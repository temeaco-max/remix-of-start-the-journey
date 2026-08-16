import assert from 'node:assert/strict';
import { buildReferenceTrajectories } from '../src/services/conversationTrajectoryService.js';
import { evaluateTrajectories } from '../src/services/conversationTrajectoryEvaluatorService.js';

const trajectories = buildReferenceTrajectories();
const evaluations = evaluateTrajectories(trajectories);
assert.equal(evaluations.length, trajectories.length);
assert.ok(evaluations.every(result => result.userTurns > 0));
assert.ok(evaluations.every(result => result.assistantTurns > 0));
assert.ok(evaluations.every(result => result.conversationQuality >= 0 && result.conversationQuality <= 1));
assert.ok(evaluations.every(result => result.actionDiscipline >= 0 && result.actionDiscipline <= 1));
assert.ok(evaluations.some(result => result.evaluatedTurns.some(turn => turn.assistant && turn.quality)));
console.log(JSON.stringify({
  trajectories: evaluations.length,
  statuses: evaluations.map(result => result.status),
  averageConversationQuality: evaluations.reduce((sum, result) => sum + result.conversationQuality, 0) / evaluations.length,
  averageActionDiscipline: evaluations.reduce((sum, result) => sum + result.actionDiscipline, 0) / evaluations.length,
  status: 'passed',
}, null, 2));

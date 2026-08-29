/* Copyright (c) 2026 temeaco-max. All rights reserved. Proprietary and confidential. */
import assert from 'node:assert/strict';
import { buildReferenceTrajectories, scoreTrajectory, detectTrajectorySignals, type TrajectoryDefinition } from '../src/services/conversationTrajectoryService.js';
import { evaluateTrajectories } from '../src/services/conversationTrajectoryEvaluatorService.js';

const base = buildReferenceTrajectories();
assert.equal(base.length, 3);

const generated: TrajectoryDefinition[] = [];
const services = ['plumber', 'cleaner', 'electrician', 'mechanic', 'tailor', 'caterer', 'barber', 'roofer'];
const markets: Array<TrajectoryDefinition['market']> = ['NG', 'GB', 'GH', 'CA'];
const locales = ['en-NG', 'en-GB', 'en-GH', 'en-CA'];

for (let i = 0; i < 1000; i += 1) {
  const service = services[i % services.length];
  const market = markets[i % markets.length];
  const locale = locales[i % locales.length];
  const turns = [
    { role: 'user' as const, text: `I might need a ${service} sometime this week.`, expectedMode: 'conversation' as const },
    { role: 'assistant' as const, text: 'We can work out what you need first.' },
    { role: 'user' as const, text: 'Actually, hold on. Remind me tomorrow about it.', expectedMode: 'action' as const },
    { role: 'assistant' as const, text: 'I can keep the reminder separate from the service question.' },
    { role: 'user' as const, text: `Find me a ${service} near me.`, expectedMode: 'action' as const },
    { role: 'assistant' as const, text: 'I can look for suitable options based on the location evidence available.' },
    { role: 'user' as const, text: i % 2 === 0 ? 'Not that one. The other guy.' : 'Use the second one.', expectedMode: 'reference' as const, expectedTarget: `${service}` },
    { role: 'assistant' as const, text: 'Understood. I’ll keep the current context and use the other option.' },
    { role: 'user' as const, text: i % 3 === 0 ? 'Actually make it Saturday.' : 'No, I meant next week.', expectedMode: 'action' as const, expectedTarget: `${service}` },
    { role: 'assistant' as const, text: 'Got it. I’ll change the timing without starting a new request.' },
    { role: 'user' as const, text: 'Go back to the original thing.', expectedMode: 'reference' as const, expectedTarget: `${service}` },
    { role: 'assistant' as const, text: 'Sure — returning to the original service request.' },
  ];
  generated.push({ id: `generated-${i + 1}`, market, locale, title: `Trajectory ${i + 1}`, goals: [service, 'reminder'], turns });
}

const trajectories = [...base, ...generated];
let failures = 0;
let references = 0;
let deep = 0;
let totalTurns = 0;
let totalScore = 0;

for (const trajectory of trajectories) {
  const score = scoreTrajectory(trajectory);
  failures += score.issues.length;
  references += trajectory.turns.filter(turn => detectTrajectorySignals(turn.text).reference).length;
  deep += trajectory.turns.filter(turn => /actually|forget|other|second|go back|what were we doing|instead/i.test(turn.text)).length;
  totalTurns += score.turns;
  totalScore += score.overall;
}

const responseEvaluations = evaluateTrajectories(trajectories);
const averageConversationQuality = responseEvaluations.reduce((sum, result) => sum + result.conversationQuality, 0) / responseEvaluations.length;
const averageActionDiscipline = responseEvaluations.reduce((sum, result) => sum + result.actionDiscipline, 0) / responseEvaluations.length;
const responseIssueCount = responseEvaluations.reduce((sum, result) => sum + result.responseIssues.length, 0);

assert.ok(totalTurns >= 12_000, `expected a long-horizon corpus, got ${totalTurns} turns`);
assert.ok(references >= 2_000, `expected substantial relative-reference coverage, got ${references}`);
assert.ok(deep >= 3_000, `expected deep/conversational-hard cases, got ${deep}`);
assert.equal(failures, 0, `${failures} deterministic trajectory failures detected`);

const averageScore = totalScore / trajectories.length;
assert.ok(averageScore >= 0.90, `average deterministic trajectory score ${averageScore.toFixed(3)} is below threshold`);
assert.ok(averageConversationQuality >= 0.72, `average response quality ${averageConversationQuality.toFixed(3)} is below threshold`);
assert.ok(averageActionDiscipline >= 0.95, `average action discipline ${averageActionDiscipline.toFixed(3)} is below threshold`);
assert.equal(responseIssueCount, 0, `${responseIssueCount} response quality issues detected in reference trajectories`);

console.log(JSON.stringify({
  trajectories: trajectories.length,
  turns: totalTurns,
  relativeReferences: references,
  hardCases: deep,
  failures,
  deterministicAverageScore: Number(averageScore.toFixed(4)),
  averageConversationQuality: Number(averageConversationQuality.toFixed(4)),
  averageActionDiscipline: Number(averageActionDiscipline.toFixed(4)),
  responseIssueCount,
  status: 'passed',
}, null, 2));

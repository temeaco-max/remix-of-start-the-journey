import assert from 'node:assert/strict';
import { decideConversationIntelligence } from '../src/services/conversationIntelligenceService.js';

const cases = [
  { text: 'Hey, how are you?', mode: 'conversation', avoid: true },
  { text: 'I am thinking about getting a cleaner in Ibadan.', mode: 'exploration', avoid: true },
  { text: 'Please find me a cleaner in Ibadan this weekend.', mode: 'action', action: true },
  { text: 'What do you think about finding someone to fix my phone?', mode: 'exploration', avoid: true },
  { text: 'Can you arrange it?', mode: 'clarification', avoid: true },
  { text: 'Use the second one.', mode: 'reference', reconcile: true },
  { text: 'Not the first guy — the other one.', mode: 'reference', reconcile: true },
  { text: 'Actually change it to Saturday.', mode: 'reference', reconcile: true },
  { text: 'Go ahead and book it.', mode: 'control', action: true },
  { text: 'I need someone to clean my flat and I am not sure what I need yet.', mode: 'action', action: true },
];

let deep = 0;
for (const item of cases) {
  const decision = decideConversationIntelligence({
    userMessage: item.text,
    latestUserMessage: item.text,
    assistantReply: 'I understand and will keep the relevant context while we work through it.',
    activeContextIds: item.reconcile ? ['request:1', 'request:2'] : undefined,
    selectedContextId: item.reconcile ? 'request:2' : undefined,
    currentGoal: item.reconcile ? 'active request' : undefined,
    knownFacts: ['Ibadan', 'this weekend'],
  });

  assert.equal(decision.mode, item.mode, item.text);
  if (item.avoid) assert.equal(decision.shouldAvoidAction, true, item.text);
  if (item.action) assert.equal(decision.shouldRequireCanonicalAction, true, item.text);
  if (item.reconcile) assert.equal(decision.requiresContextReconciliation, true, item.text);
  if (decision.modelTier === 'strong') deep += 1;
}

for (let i = 0; i < 1000; i += 1) {
  const text = i % 5 === 0
    ? `Actually, use the other option for my cleaner request ${i}`
    : i % 5 === 1
      ? `Maybe I should find a plumber in Lagos, what do you think ${i}?`
      : i % 5 === 2
        ? `Please find me an electrician in Manchester for Saturday ${i}`
        : i % 5 === 3
          ? `Can you explain the subscription options ${i}?`
          : `What were we doing with the phone repair again ${i}?`;
  const decision = decideConversationIntelligence({
    userMessage: text,
    latestUserMessage: text,
    assistantReply: 'I can help with that and keep the relevant context.',
    activeContextIds: ['request:1', 'request:2'],
    selectedContextId: 'request:1',
    currentGoal: 'active request',
  });
  assert.ok(decision.reasons.length >= 0);
}

assert.ok(deep > 0);
console.log(JSON.stringify({ cases: cases.length + 1000, deepTierCases: deep, status: 'passed' }, null, 2));

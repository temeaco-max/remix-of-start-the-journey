/* Copyright (c) 2026 temeaco-max. All rights reserved. Proprietary and confidential. */
import assert from 'node:assert/strict';
import { decideConversationIntelligence } from '../src/services/conversationIntelligenceService.js';

const cases = [
  {
    name: 'casual conversation stays conversation',
    input: { userMessage: 'I have had a really long day.', assistantReply: 'That sounds exhausting. Want to talk about what happened?' },
    expected: { mode: 'conversation', avoid: true, action: false },
  },
  {
    name: 'exploration does not become action',
    input: { userMessage: 'I am thinking about getting a cleaner in Ibadan.', assistantReply: 'That could be useful. What matters most to you about the cleaner?' },
    expected: { mode: 'exploration', avoid: true, action: false },
  },
  {
    name: 'explicit action becomes canonical action',
    input: { userMessage: 'Please find me a cleaner in Ibadan this weekend.', assistantReply: 'Sure. I can help look for suitable options.' },
    expected: { mode: 'action', avoid: false, action: true },
  },
  {
    name: 'reference with two contexts escalates',
    input: {
      userMessage: 'Use the second one instead.',
      assistantReply: 'I can switch to the second option.',
      activeContextIds: ['request:1', 'request:2'],
      selectedContextId: 'request:2',
    },
    expected: { mode: 'reference', avoid: false, action: false, strong: true },
  },
  {
    name: 'pending field can ask clarification',
    input: {
      userMessage: 'Can you arrange it?',
      assistantReply: 'What day do you need it?',
      activeContextIds: ['request:1'],
      pendingFields: ['time'],
      currentGoal: 'cleaner',
    },
    expected: { mode: 'action', ask: true },
  },
];

for (const testCase of cases) {
  const decision = decideConversationIntelligence({ ...testCase.input, latestUserMessage: testCase.input.userMessage });
  assert.equal(decision.mode, testCase.expected.mode, testCase.name);
  if ('avoid' in testCase.expected) assert.equal(decision.shouldAvoidAction, testCase.expected.avoid, testCase.name);
  if ('action' in testCase.expected) assert.equal(decision.shouldRequireCanonicalAction, testCase.expected.action, testCase.name);
  if ('strong' in testCase.expected) assert.equal(decision.modelTier, 'strong', testCase.name);
  if ('ask' in testCase.expected) assert.equal(decision.shouldAskClarification, true, testCase.name);
}

const all = cases.map(testCase => decideConversationIntelligence({ ...testCase.input, latestUserMessage: testCase.input.userMessage }));
assert.equal(all.length, cases.length);
console.log(JSON.stringify({
  cases: cases.length,
  modes: all.map(item => item.mode),
  modelTiers: all.map(item => item.modelTier),
  status: 'passed',
}, null, 2));

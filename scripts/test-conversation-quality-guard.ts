/* Copyright (c) 2026 temeaco-max. All rights reserved. Proprietary and confidential. */
import assert from 'node:assert/strict';
import { assessConversationQuality, classifyConversationDifficulty, detectRelativeReference } from '../src/services/conversationQualityService.js';

const clean = assessConversationQuality({
  latestUserMessage: 'I need a cleaner this weekend in Ibadan.',
  assistantReply: 'Sure. What part of Ibadan should I use, and is there anything specific you want cleaned?',
  activeContextIds: ['request:1'],
  selectedContextId: 'request:1',
  knownFacts: ['this weekend', 'Ibadan'],
  pendingFields: ['location'],
});
assert.equal(clean.issues.includes('internal_metadata_leak'), false);
assert.equal(clean.preservedContext, true);
assert.ok(clean.score >= 0.72);

const leak = assessConversationQuality({
  latestUserMessage: 'Where were we?',
  assistantReply: 'Intent: find_worker. route=canonical. Internal conversation orientation selected=economic_request.',
});
assert.ok(leak.issues.includes('internal_metadata_leak'));
assert.equal(leak.conversational, false);

const repeated = assessConversationQuality({
  latestUserMessage: 'Can you help?',
  assistantReply: 'I can help with that. Tell me a little more about what you need.',
  priorAssistantReplies: ['I can help with that. Tell me a little more about what you need.'],
});
assert.ok(repeated.issues.includes('repetition'));

const premature = assessConversationQuality({
  latestUserMessage: "I'm thinking about getting a cleaner.",
  assistantReply: 'I can help coordinate a cleaner. Please confirm the payment and booking.',
});
assert.ok(premature.issues.includes('premature_action'), 'premature action must be caught even without a card');
assert.equal(premature.conversational, false, 'a fluent action response is still non-conversational when the user is exploring');

const prematureCard = assessConversationQuality({
  latestUserMessage: "I'm thinking about getting a cleaner.",
  assistantReply: 'I can help coordinate a cleaner. Please confirm the payment and booking.',
  cardType: 'economic_request',
});
assert.ok(prematureCard.issues.includes('premature_action'));

const refs = [
  ['the other guy', 'other'],
  ['the second one', 'second'],
  ['the first option', 'first'],
  ['go back to the plumber', 'previous'],
  ['same place', 'attribute'],
  ['the cheaper one', 'attribute'],
  ['same time', 'attribute'],
  ['tomorrow instead', 'attribute'],
] as const;
for (const [message, target] of refs) assert.equal(detectRelativeReference(message)?.target, target);

assert.equal(classifyConversationDifficulty('hello'), 'simple');
assert.equal(classifyConversationDifficulty('Actually change the time to tomorrow', { activeContextIds: ['request:1'], pendingFields: ['time'] }), 'deep');
assert.equal(classifyConversationDifficulty('The other one, not the first guy — go back to the one we discussed before', { activeContextIds: ['request:1', 'request:2'] }), 'deep');
assert.equal(classifyConversationDifficulty('Make it cheaper, but keep Saturday and use the second provider', { activeContextIds: ['request:1'], pendingFields: ['budget'] }), 'complex');

console.log('Conversation quality guard passed: leak detection, repetition, premature-action detection without card metadata, continuity checks, comparative references and difficulty classification.');

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
  cardType: 'economic_request',
});
assert.ok(premature.issues.includes('premature_action'));

const refs = [
  ['the other guy', 'other'],
  ['the second one', 'second'],
  ['the first option', 'first'],
  ['go back to the plumber', 'previous'],
  ['same place', 'current'],
] as const;
for (const [message, target] of refs) assert.equal(detectRelativeReference(message)?.target, target);

assert.equal(classifyConversationDifficulty('hello'), 'simple');
assert.equal(classifyConversationDifficulty('Actually change the time to tomorrow', { activeContextIds: ['request:1'], pendingFields: ['time'] }), 'complex');
assert.equal(classifyConversationDifficulty('The other one, not the first guy — go back to the one we discussed before', { activeContextIds: ['request:1', 'request:2'] }), 'deep');

console.log('Conversation quality guard passed: leak detection, repetition, premature-action detection, continuity checks, relative references and difficulty classification.');

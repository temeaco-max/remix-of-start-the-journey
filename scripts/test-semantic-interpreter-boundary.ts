/* Copyright (c) 2026 temeaco-max. All rights reserved. Proprietary and confidential. */
import assert from 'node:assert/strict';
import { fallbackSemanticConversationInterpretation } from '../src/services/semanticConversationInterpreter.js';
import { buildConversationTurnContract } from '../src/services/conversationTurnContractService.js';

const exploratory = fallbackSemanticConversationInterpretation({
  message: 'I am thinking about booking the cheaper option, but I want to compare them first.',
});
assert.equal(exploratory.mode, 'exploration');
assert.equal(exploratory.explicitAuthorization, false);
assert.equal(exploratory.responseStrategy, 'answer');

const action = fallbackSemanticConversationInterpretation({
  message: 'Please go ahead and book the cheaper option.',
});
assert.equal(action.mode, 'action');
assert.equal(action.explicitAuthorization, true);

const contract = buildConversationTurnContract({
  latestUserMessage: 'I am thinking about booking the cheaper option, but I want to compare them first.',
  userMessage: 'I am thinking about booking the cheaper option, but I want to compare them first.',
  assistantReply: '',
  semanticInterpretation: {
    ...exploratory,
    mode: 'exploration',
    confidence: 0.95,
    source: 'llm',
  },
});
assert.equal(contract.shouldAvoidAction, true);
assert.equal(contract.actionPosture, 'none');
assert.equal(contract.semanticInterpretation?.mode, 'exploration');
assert.match(contract.modelInstructions.join('\n'), /Explore without treating exploration as authorization/i);

console.log('semantic interpreter boundary tests passed');

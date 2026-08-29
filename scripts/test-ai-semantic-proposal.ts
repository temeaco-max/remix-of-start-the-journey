/* Copyright (c) 2026 temeaco-max. All rights reserved. Proprietary and confidential. */
import assert from 'node:assert/strict';
import { buildConversationTurnContract } from '../src/services/conversationTurnContractService.js';
import { proposeSemanticCapability } from '../src/services/aiSemanticProposalService.js';

async function main() {
  const conversation = buildConversationTurnContract({
    userMessage: 'hello',
    latestUserMessage: 'hello',
    assistantReply: '',
  });
  assert.equal(await proposeSemanticCapability({ userMessage: 'hello', contract: conversation }), null, 'greeting must not trigger semantic capability inference');

  const exploration = buildConversationTurnContract({
    userMessage: 'I am thinking about getting someone to clean my flat',
    latestUserMessage: 'I am thinking about getting someone to clean my flat',
    assistantReply: '',
  });
  assert.equal(await proposeSemanticCapability({ userMessage: 'I am thinking about getting someone to clean my flat', contract: exploration }), null, 'exploration must not silently authorize action');

  const action = buildConversationTurnContract({
    userMessage: 'Please find someone to clean my flat this weekend',
    latestUserMessage: 'Please find someone to clean my flat this weekend',
    assistantReply: '',
  });
  assert.ok(action.requiresStructuredProposal || action.mode === 'action', 'explicit action should enter proposal-capable posture');

  console.log('AI semantic proposal regression passed.');
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});

import { generateConversationalResponse } from '../src/services/conversationalGenerationService.js';

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

const cases = [
  {
    name: 'casual conversation remains conversational',
    prompt: 'How are you today?',
    expectedMode: 'conversation',
  },
  {
    name: 'exploration does not become an action',
    prompt: "I'm thinking about getting a cleaner this weekend.",
    expectedMode: 'exploration',
  },
  {
    name: 'explicit action remains action-capable',
    prompt: 'Please find me a cleaner in Ibadan this weekend.',
    expectedMode: 'action',
  },
  {
    name: 'relative reference triggers stronger context handling',
    prompt: 'Actually, use the cheaper one instead.',
    expectedMode: 'reference',
  },
];

for (const item of cases) {
  const result = await generateConversationalResponse({
    prompt: item.prompt,
    activeContextIds: item.expectedMode === 'reference' ? ['request:one', 'request:two'] : [],
    priorAssistantReplies: [],
  });

  assert(result.contract.mode === item.expectedMode, `${item.name}: expected ${item.expectedMode}, got ${result.contract.mode}`);
  assert(Boolean(result.text.trim()), `${item.name}: empty response`);
  assert(!result.text.includes('internal conversation orientation'), `${item.name}: leaked internal prompt text`);
  assert(!result.text.includes('system prompt'), `${item.name}: leaked system prompt text`);

  if (item.expectedMode === 'exploration') {
    assert(result.contract.shouldAvoidAction, `${item.name}: exploration should block autonomous action`);
    assert(result.contract.actionPosture === 'none' || result.contract.actionPosture === 'clarify', `${item.name}: unexpected action posture ${result.contract.actionPosture}`);
  }

  if (item.expectedMode === 'reference') {
    assert(result.contract.requiresContextReconciliation || result.contract.relativeReference, `${item.name}: reference did not require context handling`);
  }
}

console.log(`Conversational generation regression passed: ${cases.length} cases.`);

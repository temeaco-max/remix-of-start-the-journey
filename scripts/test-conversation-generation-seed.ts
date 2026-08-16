import assert from 'node:assert/strict';
import { generateConversationalResponse } from '../src/services/conversationalGenerationService.js';

const seeded = await generateConversationalResponse({
  prompt: 'My phone has been acting weird since yesterday.',
  seedResponse: {
    provider: 'Kurukoo Router',
    model: 'router-response',
    text: 'That sounds frustrating. What is the phone doing differently?',
    latencyMs: 0,
    cost: 'already-generated',
  },
});

assert.equal(seeded.text, 'That sounds frustrating. What is the phone doing differently?');
assert.equal(seeded.attemptCount, 1);
assert.equal(seeded.escalated, false);
assert.equal(seeded.contract.mode, 'conversation');
assert.ok(!seeded.quality.issues.includes('premature_action'));

const unsafeSeed = await generateConversationalResponse({
  prompt: "I'm thinking about getting a cleaner this weekend.",
  seedResponse: {
    provider: 'Kurukoo Router',
    model: 'router-response',
    text: 'Please confirm the booking and payment.',
    latencyMs: 0,
    cost: 'already-generated',
  },
});

assert.equal(unsafeSeed.contract.mode, 'exploration');
assert.ok(unsafeSeed.quality.issues.includes('premature_action'));
assert.notEqual(unsafeSeed.text, 'Please confirm the booking and payment.');

console.log('Seeded conversational generation regression passed.');

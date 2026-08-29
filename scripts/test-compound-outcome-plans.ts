/* Copyright (c) 2026 temeaco-max. All rights reserved. Proprietary and confidential. */
import assert from 'node:assert/strict';
import { recognizeCompoundObjective } from '../src/services/compoundObjectiveResolver.js';

const cases = [
  { text: 'I need to get my laptop sorted.', skills: ['phone_repairer', 'find_worker', 'reminder'] },
  { text: 'I need somewhere to stay next week.', skills: ['hotel_deals', 'reminder'] },
  { text: 'Sort out my internet.', skills: ['wifi_installer', 'find_worker', 'reminder'] },
  { text: 'I need to get to the airport tomorrow.', skills: ['ride_request', 'reminder'] },
  { text: 'Find and buy the right charger for this laptop.', skills: ['phone_repairer', 'product_sourcing', 'reminder'] },
] as const;

for (const testCase of cases) {
  const decomposition = recognizeCompoundObjective(testCase.text);
  assert.ok(decomposition, `Expected a composed outcome for: ${testCase.text}`);
  assert.deepEqual(decomposition.subObjectives.map(item => item.skill), testCase.skills, `Unexpected skill sequence for: ${testCase.text}`);
  assert.equal(decomposition.subObjectives[0]?.dependsOn, undefined, `The first step must be independent for: ${testCase.text}`);
  for (let index = 1; index < decomposition.subObjectives.length; index += 1) {
    assert.equal(decomposition.subObjectives[index]?.dependsOn, index - 1, `Step ${index} must depend on its previous evidence step for: ${testCase.text}`);
  }
}

assert.equal(recognizeCompoundObjective('I want a general update.'), null, 'Unbounded conversation must not become a fabricated multi-step plan.');
console.log('Compound outcome plan regression passed: device, accommodation, internet, transport, charger, ordering, dependencies, and conservative non-match.');
process.exit(0);

export {};

/* Copyright (c) 2026 temeaco-max. All rights reserved. Proprietary and confidential. */
import assert from 'node:assert/strict';
import { chooseInferenceProvider } from '../src/services/aiInferencePolicy.js';

const hello = chooseInferenceProvider({ task: 'conversation', prompt: 'hello' });
assert.equal(hello.provider, 'smollm2');
assert.equal(hello.maxComplexity, 'low');

const repair = chooseInferenceProvider({ task: 'skill_intake', prompt: 'My iPhone 13 screen is broken and I need collection and same-day return' });
assert.ok(['smollm2', 'mistral'].includes(repair.provider));
assert.notEqual(repair.maxComplexity, 'low');

const unclear = chooseInferenceProvider({ task: 'conversation', prompt: 'I need that thing sorted somehow' });
assert.ok(['smollm2', 'mistral'].includes(unclear.provider));

const support = chooseInferenceProvider({ task: 'support', prompt: 'how do I unlink my phone?' });
assert.equal(support.provider, 'smollm2');

console.log('AI inference policy regression passed.');

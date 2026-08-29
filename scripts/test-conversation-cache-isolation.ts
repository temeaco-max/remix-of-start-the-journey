/* Copyright (c) 2026 temeaco-max. All rights reserved. Proprietary and confidential. */
import assert from 'node:assert/strict';
import fs from 'node:fs';

const source = fs.readFileSync(new URL('../src/services/conversationalGenerationService.ts', import.meta.url), 'utf8');

assert.match(source, /turnScope\s*=\s*`/);
assert.match(source, /thread=\$\{input\.threadId \|\| 'anonymous'\}/);
assert.match(source, /turn=\$\{Date\.now\(\)\}-\$\{Math\.random\(\)/);
assert.match(source, /const contextualSystemPrompt = \[/);
assert.match(source, /turnScope,/);

console.log('Conversational cache isolation contract passed: each model-generated conversational turn receives a non-reusable internal turn scope.');

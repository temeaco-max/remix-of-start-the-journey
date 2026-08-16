import assert from 'node:assert/strict';
import fs from 'node:fs';

const source = fs.readFileSync(new URL('../src/services/conversationalGenerationService.ts', import.meta.url), 'utf8');

assert.match(source, /const conversationProvider = input\.provider && input\.provider !== 'auto' \? input\.provider : strongerProvider\(input\.provider\);/);
assert.match(source, /provider: conversationProvider,/);
assert.match(source, /function strongerProvider\(preferred: AIProvider \| undefined\)/);
assert.match(source, /KURUKOO_AI_HOSTED_PROVIDER === 'mistral'/);
assert.match(source, /KURUKOO_AI_HOSTED_PROVIDER === 'gemini'/);
assert.match(source, /return 'smollm2';/);

console.log('Conversational provider-selection contract passed: configured hosted conversation models are preferred, with SmolLM2 as the local fallback.');

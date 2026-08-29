/* Copyright (c) 2026 temeaco-max. All rights reserved. Proprietary and confidential. */
import assert from 'node:assert/strict';

process.env.KURUKOO_DEFAULT_COUNTRY ||= 'ng';
process.env.KURUKOO_AI_BYPASS_SMOLLM2 = 'true';
process.env.KURUKOO_AI_PRIMARY_PROVIDER = 'mistral';
process.env.MISTRAL_API_KEY = process.env.MISTRAL_API_KEY || 'test-mistral-key';
process.env.FF_HOSTED_MISTRAL = 'true';

const { resolveConversationProvider } = await import('../src/services/conversationalGenerationService.js');

assert.equal(resolveConversationProvider(undefined), 'mistral');
assert.equal(resolveConversationProvider('auto'), 'mistral');
assert.equal(resolveConversationProvider('smollm2'), 'smollm2');
console.log('Mistral bypass contract passed: auto conversational generation selects Mistral when explicit SmolLM2 bypass is enabled.');

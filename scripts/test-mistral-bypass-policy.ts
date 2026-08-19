import assert from 'node:assert/strict';

const original = {
  primary: process.env.KURUKOO_AI_PRIMARY_PROVIDER,
  hosted: process.env.KURUKOO_AI_HOSTED_PROVIDER,
  bypass: process.env.KURUKOO_AI_BYPASS_SMOLLM2,
  mistralKey: process.env.MISTRAL_API_KEY,
  country: process.env.KURUKOO_DEFAULT_COUNTRY,
  flag: process.env.FF_HOSTED_MISTRAL,
};

process.env.KURUKOO_DEFAULT_COUNTRY = 'ng';
process.env.MISTRAL_API_KEY = 'test-mistral-key';
process.env.FF_HOSTED_MISTRAL = 'true';
process.env.KURUKOO_AI_PRIMARY_PROVIDER = 'mistral';
delete process.env.KURUKOO_AI_HOSTED_PROVIDER;
process.env.KURUKOO_AI_BYPASS_SMOLLM2 = 'true';

const { resolveConversationProvider } = await import('../src/services/conversationalGenerationService.js');
assert.equal(resolveConversationProvider(undefined), 'mistral');
assert.equal(resolveConversationProvider('mistral'), 'mistral');
assert.equal(resolveConversationProvider('smollm2'), 'smollm2');

console.log('Mistral bypass policy contract passed: explicit Mistral preference bypasses automatic SmolLM2 selection while explicit smollm2 remains available for diagnostics/tests.');

for (const [key, value] of Object.entries(original)) {
  const envKey = key === 'primary' ? 'KURUKOO_AI_PRIMARY_PROVIDER' : key === 'hosted' ? 'KURUKOO_AI_HOSTED_PROVIDER' : key === 'bypass' ? 'KURUKOO_AI_BYPASS_SMOLLM2' : key === 'mistralKey' ? 'MISTRAL_API_KEY' : key === 'country' ? 'KURUKOO_DEFAULT_COUNTRY' : 'FF_HOSTED_MISTRAL';
  if (value === undefined) delete process.env[envKey]; else process.env[envKey] = value;
}

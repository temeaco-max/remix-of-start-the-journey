import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const file = readFileSync(resolve(process.cwd(), 'src/services/conversationalGenerationService.ts'), 'utf8');

if (!file.includes("export type ConversationGenerationMode = 'generate' | 'present' | 'deterministic';")) {
  throw new Error('Conversation generation modes are not defined');
}
if (!file.includes("const generationMode = input.generationMode || 'generate';")) {
  throw new Error('Ordinary conversation is not explicitly model-authored by default');
}
if (!file.includes("generationMode === 'present' || generationMode === 'deterministic'")) {
  throw new Error('Seed responses are not restricted to explicit presentation/deterministic modes');
}
if (!file.includes('Router output is never used as a reply seed')) {
  throw new Error('Conversation ownership invariant is not documented in the implementation');
}

console.log('Conversational generation ownership guard passed');

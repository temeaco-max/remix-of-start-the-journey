import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const file = readFileSync(resolve(process.cwd(), 'src/services/conversationalGenerationService.ts'), 'utf8');

function assert(condition: boolean, message: string): void {
  if (!condition) throw new Error(`Conversation generation ownership guard failed: ${message}`);
}

assert(file.includes("export type ConversationGenerationMode = 'generate' | 'present' | 'deterministic';"), 'generation modes are not defined');
assert(file.includes("const generationMode = input.generationMode || 'generate';"), 'ordinary conversation is not explicitly model-authored by default');
assert(file.includes("generationMode === 'present' || generationMode === 'deterministic'"), 'seed responses are not restricted to explicit presentation/deterministic modes');
assert(file.includes('Ordinary Chat is model-authored.'), 'ordinary Chat ownership rule is not documented in implementation');
assert(file.includes("base = await queryUnifiedAI(input.prompt"), 'generate mode does not call the canonical model boundary');
assert(file.includes("if (generationMode === 'deterministic')"), 'deterministic mode is not explicit');
assert(file.includes("else if (generationMode === 'present')"), 'presentation mode is not explicit');

console.log('Conversational generation ownership guard passed');

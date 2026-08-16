import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const file = readFileSync(resolve(process.cwd(), 'src/services/conversationalGenerationService.ts'), 'utf8');
const contract = readFileSync(resolve(process.cwd(), 'src/services/conversationTurnContractService.ts'), 'utf8');

if (!file.includes('buildConversationalSystemDirective(contract)')) {
  throw new Error('Conversational generation is not injecting the turn contract into the model prompt');
}
if (!file.includes('activeGoals?: string[]')) {
  throw new Error('Generation input does not accept active conversational goals');
}
if (!file.includes('goalState.currentGoal')) {
  throw new Error('Generation repair path does not preserve current goal state');
}
if (!contract.includes('unresolvedFields')) {
  throw new Error('Turn contract does not expose unresolved goal fields');
}
if (!contract.includes('preserveGoalContext')) {
  throw new Error('Turn contract does not lock goal preservation');
}

console.log('Conversational contract injection guard passed');

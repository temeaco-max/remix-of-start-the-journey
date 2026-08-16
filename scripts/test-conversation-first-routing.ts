import { routeIntent } from '../src/services/intentRouter.js';

function assert(condition: boolean, message: string): void {
  if (!condition) throw new Error(message);
}

async function main() {
  const exploratory = await routeIntent("I'm thinking about getting a cleaner this weekend.");
  assert(exploratory.skill === 'general_question', `Expected exploration to stay conversational, got ${exploratory.skill}`);

  const explicit = await routeIntent('Please find me a cleaner in Ibadan this weekend.');
  assert(explicit.skill === 'find_worker', `Expected explicit action to route to find_worker, got ${explicit.skill}`);

  const problem = await routeIntent("My phone has been acting weird since yesterday.");
  assert(problem.skill === 'general_question', `Expected an unresolved phone problem to remain conversational, got ${problem.skill}`);

  const howQuestion = await routeIntent('How can I get a cleaner for Saturday?');
  assert(howQuestion.skill === 'general_question', `Expected exploratory how-question to remain conversational, got ${howQuestion.skill}`);

  console.log('Conversation-first routing regression passed.');
}

main().catch(error => {
  console.error(error);
  process.exitCode = 1;
});

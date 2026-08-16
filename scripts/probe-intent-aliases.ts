import assert from 'node:assert/strict';
import { routeIntent } from '../src/services/intentRouter.js';

const cases = [
  ['I need someone to help with my house this weekend', 'find_worker'],
  ['Can someone clean my house this weekend?', 'find_worker'],
  ['Could anyone fix the leaking roof tomorrow?', 'find_worker'],
  ['What events are happening this weekend?', 'national_events'],
  ['Show me the weekend calendar', 'national_events'],
] as const;
for (const [query, expected] of cases) {
  const result = await routeIntent(query);
  assert.equal(result.skill, expected, `${query} should route to ${expected}, got ${result.skill}`);
  console.log(`${expected}\t${result.skill}\t${query}`);
}
console.log('Intent alias probe passed.');

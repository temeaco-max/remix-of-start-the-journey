import assert from 'node:assert/strict';
import { routeIntent } from '../src/services/intentRouter.js';

const exploratory = [
  'Where can I get good suya around here?',
  'Is there a cleaner in Ibadan this weekend?',
  'Who sells rice near me?',
];
for (const prompt of exploratory) {
  const result = await routeIntent(prompt);
  assert.equal(result.cardData, undefined, `Exploratory question must not create a consequential card: ${prompt}`);
  assert.notEqual(result.canonicalAction, 'start_storefront', `Exploratory question must not start a storefront: ${prompt}`);
  assert.notEqual(result.canonicalAction, 'create_economic_request', `Exploratory question must not create an Economic Request: ${prompt}`);
}

const explicitActions = [
  'Find me a cleaner in Ibadan this weekend.',
  'Order food for me in Ikeja.',
];
for (const prompt of explicitActions) {
  const result = await routeIntent(prompt);
  assert.ok(result.cardData, `Explicit action should retain a canonical preview/card boundary: ${prompt}`);
}

console.log(`Conversational route discrimination regression passed: ${exploratory.length} exploratory and ${explicitActions.length} explicit action cases.`);

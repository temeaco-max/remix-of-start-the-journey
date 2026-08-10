import { classifyWithFastText } from '../src/services/fastTextService.js';

const cases: Array<[string, string]> = [
  ['I need a taxi to Ikeja', 'ride_request'],
  ['Find me someone to repair my fridge', 'find_worker'],
  ['Order suya and bread near me', 'order_food'],
  ['I need emergency help after an accident', 'emergency'],
  ['Help me find a football match this weekend', 'sports_matchmaking'],
  ['How do I fix a leaking tap?', 'find_worker']
];

let failures = 0;
for (const [query, expected] of cases) {
  const result = classifyWithFastText(query);
  const ok = result?.intent === expected;
  console.log(`${ok ? 'PASS' : 'FAIL'} ${JSON.stringify(query)} -> ${result?.intent || 'unknown'} (${result?.source || 'none'}, ${result?.confidence?.toFixed(2) || 'n/a'})`);
  if (!ok) failures += 1;
}

if (failures) throw new Error(`FastText intent verification failed for ${failures} sample(s)`);
console.log('FastText intent verification passed.');

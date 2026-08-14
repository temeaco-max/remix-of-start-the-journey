import assert from 'node:assert/strict';
import { classifyWithFastText, getFastTextRuntimeStatus } from '../src/services/fastTextService.js';

const runtime = getFastTextRuntimeStatus();
assert.equal(runtime.modelState, 'real', `expected a real FastText binary, got ${runtime.modelState}`);
assert.equal(runtime.realModelPresent, true, 'realModelPresent must be true when the binary is valid');

const cases: Array<[string, string]> = [
  ['I need a taxi to Ikeja', 'ride_request'],
  ['Find me someone to repair my fridge', 'find_worker'],
  ['Order suya and bread near me', 'order_food'],
  ['I need emergency help after an accident', 'emergency'],
  ['Help me find a football match this weekend', 'sports_matchmaking'],
  ['How do I fix a leaking tap?', 'find_worker']
];

let failures = 0;
let fastTextSourceCount = 0;
for (const [query, expected] of cases) {
  const result = classifyWithFastText(query);
  const ok = result?.intent === expected;
  if (result?.source === 'fasttext') fastTextSourceCount += 1;
  console.log(`${ok ? 'PASS' : 'FAIL'} ${JSON.stringify(query)} -> ${result?.intent || 'unknown'} (${result?.source || 'none'}, ${result?.confidence?.toFixed(2) || 'n/a'})`);
  if (!ok) failures += 1;
}

if (failures) throw new Error(`FastText intent verification failed for ${failures} sample(s)`);
assert.ok(fastTextSourceCount >= 4, `expected at least four representative routes to use fasttext, got ${fastTextSourceCount}`);
console.log(`FastText intent verification passed with ${fastTextSourceCount}/${cases.length} real-model sources.`);

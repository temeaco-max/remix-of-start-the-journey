/* Copyright (c) 2026 temeaco-max. All rights reserved. Proprietary and confidential. */
import assert from 'node:assert/strict';
import fs from 'node:fs';

const routerSource = fs.readFileSync(new URL('../src/services/intentRouter.ts', import.meta.url), 'utf8');
const legacySource = fs.readFileSync(new URL('../src/services/legacyIntentRouter.ts', import.meta.url), 'utf8');

assert.match(routerSource, /interpretConversationSemantics/);
assert.match(routerSource, /legacyIntentRouter/);
assert.match(routerSource, /semantic\.mode === 'action'/);
assert.match(routerSource, /semantic\.explicitAuthorization/);
assert.match(routerSource, /semantic\.confidence < 0\.55/);
assert.match(routerSource, /Do not turn conversation into a booking/);
assert.match(legacySource, /export async function routeIntent/);

console.log('semantic router entrypoint boundary tests passed');

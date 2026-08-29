/* Copyright (c) 2026 temeaco-max. All rights reserved. Proprietary and confidential. */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'kurukoo-skill-mode-routing-'));
process.env.DB_PATH = path.join(tempDir, 'skill-modes.sqlite');
process.env.KURUKOO_DISABLE_LISTEN = 'true';

const { routeIntent } = await import('../src/services/intentRouter.js');
const phone = '+2347000000111';

const cases = [
  ['Please help with emergency', 'safety', 'skill_flow.safety'],
  ['I need nin passport guidance', 'information', 'skill_flow.information'],
  ['Help me organise a neighbourhood watch', 'coordination', 'skill_flow.coordination'],
] as const;
for (const [query, stage, action] of cases) {
  const result = await routeIntent(query, phone);
  assert.equal(result.cardData?.stage, stage, `${query} should render the ${stage} stage`);
  assert.equal(result.cardData?.canonicalAction, action, `${query} should expose the ${action} action`);
  assert.equal(result.cardData?.requestId, undefined, `${query} must not create an Economic Request`);
  assert.equal(result.canonicalAction, action, `${query} result metadata must remain non-economic`);
  assert.equal(result.progressStage, stage, `${query} should expose truthful ${stage} progress`);
}

const economic = await routeIntent('I need a taxi quick from Ikeja to Yaba tomorrow', phone);
assert.equal(economic.canonicalAction, 'economic_request.start', 'Economic skills should retain the canonical Economic Request action');
assert.ok(economic.cardData?.requestId, 'Economic skills should persist an Economic Request');
console.log('Skill mode routing tests passed');

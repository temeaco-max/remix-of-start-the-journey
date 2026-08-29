/* Copyright (c) 2026 temeaco-max. All rights reserved. Proprietary and confidential. */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'kurukoo-skill-flows-'));
process.env.DB_PATH = path.join(tempDir, 'skill-flows.sqlite');
process.env.KURUKOO_DISABLE_LISTEN = 'true';

const { getSkillFlow, auditSkillFlows, getKnownSkills, getEconomicCategory } = await import('../src/services/skillFlows.js');
const { startStorefrontSession } = await import('../src/services/agenticStorefront.js');
const { getDb } = await import('../src/database.js');

const canonicalSkills = getKnownSkills();
assert.ok(canonicalSkills.length >= 200, `Expected the full canonical skill catalogue, found ${canonicalSkills.length}`);
const seen = new Set<string>();
for (const [skill, expectedMode] of [['emergency','safety'],['nin_passport_guidance','information'],['neighbourhood_watch','coordination'],['taxi_quick','economic']] as const) {
  const flow = await getSkillFlow(skill);
  assert.equal(flow?.mode, expectedMode, `${skill} should use the explicit ${expectedMode} flow mode`);
}

for (const skill of canonicalSkills) {
  const flow = await getSkillFlow(skill);
  assert.ok(flow, `${skill} should have an explicit persisted skill flow`);
  assert.equal(flow?.skill, skill, `${skill} should preserve its canonical identifier`);
  assert.equal(flow?.category, getEconomicCategory(skill), `${skill} should retain canonical category mapping`);
  assert.ok(flow?.question_set, `${skill} should expose a structured question set`);
  assert.ok(flow?.post_match_action, `${skill} should expose an explicit lifecycle action`);
  assert.ok(flow?.payment_model, `${skill} should expose an explicit payment boundary`);
  assert.ok(flow?.fulfillment_instructions, `${skill} should expose explicit fulfillment instructions`);
  assert.ok(flow?.capabilities?.includes('completion'), `${skill} should retain completion capability`);
  assert.ok(!seen.has(skill), `${skill} should not be seeded more than once in the canonical definition map`);
  seen.add(skill);
}

const safetyCard = await startStorefrontSession('+2347000000999', 'emergency');
assert.equal(safetyCard.stage, 'safety', 'Safety skills must not enter an economic storefront stage');
assert.equal(safetyCard.requestId, undefined, 'Safety skills must not create an Economic Request');
const informationCard = await startStorefrontSession('+2347000000999', 'nin_passport_guidance');
assert.equal(informationCard.stage, 'information', 'Information skills must not enter an economic storefront stage');
assert.equal(informationCard.requestId, undefined, 'Information skills must not create an Economic Request');
const coordinationCard = await startStorefrontSession('+2347000000999', 'neighbourhood_watch');
assert.equal(coordinationCard.stage, 'coordination', 'Coordination skills must use the coordination stage');
assert.equal(coordinationCard.requestId, undefined, 'Coordination skills must not create an Economic Request');

const db = await getDb();
db.run(`UPDATE skill_flows SET post_match_action='legacy_default', payment_model='legacy_default', fulfillment_instructions='legacy_default' WHERE skill='rider'`);
const upgraded = await getSkillFlow('rider');
assert.ok(upgraded && upgraded.post_match_action !== 'legacy_default', 'Existing legacy flow rows must be upgraded to the explicit definition');

const audit = await auditSkillFlows();
assert.equal(audit.invalid.length, 0, `Skill flow audit should have no invalid seeded records: ${audit.invalid.join(', ')}`);
assert.equal(audit.valid, canonicalSkills.length, `Every canonical skill must have one valid flow: ${audit.valid}/${canonicalSkills.length}`);
console.log(`Skill flow tests passed: ${audit.valid}/${audit.total} valid explicit canonical flows`);

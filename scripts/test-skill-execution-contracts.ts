/* Copyright (c) 2026 temeaco-max. All rights reserved. Proprietary and confidential. */
import assert from 'node:assert/strict';
import { buildSkillExecutionContract } from '../src/services/skillExecutionContract.js';
import { getAllConvergedSkillNames } from '../src/services/skillBehaviourConvergence.js';

const checks = [
  ['bin_day', 'information', false],
  ['phone_repairer', 'economic', true],
  ['hotel_booking', 'coordination', true],
  ['okada_rider', 'economic', true],
  ['prayer_partner', 'coordination', false],
] as const;
for (const [skill, mode, provider] of checks) {
  const contract = buildSkillExecutionContract(skill);
  assert.equal(contract.mode, mode, `${skill}: unexpected execution mode`);
  assert.equal(contract.requiresProvider, provider, `${skill}: provider requirement mismatch`);
  assert.ok(contract.requirements.length, `${skill}: missing requirements`);
  assert.ok(contract.completionEvidence.length, `${skill}: missing completion evidence`);
  assert.ok(contract.memoryKeys.includes('location'), `${skill}: location memory is not available`);
}
const skills = getAllConvergedSkillNames();
for (const skill of skills) {
  const contract = buildSkillExecutionContract(skill);
  assert.ok(contract.completionCondition, `${skill}: missing completion condition`);
  assert.ok(contract.truthBoundary.length, `${skill}: missing truth boundary`);
}
console.log(`Skill execution contract checks passed for ${checks.length} critical skills plus ${skills.length} converged skills.`);

/* Copyright (c) 2026 temeaco-max. All rights reserved. Proprietary and confidential. */
import assert from 'node:assert/strict';
import { ECONOMIC_CATEGORIES, getSkillCapabilities, getSkillRequirements, getEconomicCategory } from '../src/services/skillFlows.js';
import { getAllConvergedSkillNames } from '../src/services/skillBehaviourConvergence.js';
import { buildSkillExecutionContract } from '../src/services/skillExecutionContract.js';

const skills = getAllConvergedSkillNames();
const representatives = new Map<string, string>();
for (const skill of skills) {
  const category = getEconomicCategory(skill);
  if (category && !representatives.has(category)) representatives.set(category, skill);
}

for (const category of ECONOMIC_CATEGORIES) {
  const skill = representatives.get(category);
  assert.ok(skill, `${category}: no converged representative skill`);
  const requirements = getSkillRequirements(skill!);
  const capabilities = getSkillCapabilities(skill!);
  const contract = buildSkillExecutionContract(skill!);
  assert.ok(requirements.length, `${category}/${skill}: no requirements`);
  assert.ok(capabilities.length, `${category}/${skill}: no capabilities`);
  assert.ok(contract.completionEvidence.length, `${category}/${skill}: no completion evidence`);
  assert.ok(contract.failureModes.length, `${category}/${skill}: no failure modes`);
  assert.ok(contract.memoryKeys.length, `${category}/${skill}: no memory policy`);
}

console.log(`Economic category convergence passed ${ECONOMIC_CATEGORIES.length} categories across ${skills.length} converged skills.`);

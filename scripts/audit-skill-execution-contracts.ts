/* Copyright (c) 2026 temeaco-max. All rights reserved. Proprietary and confidential. */
import fs from 'node:fs';
import path from 'node:path';
import { getAllConvergedSkillNames } from '../src/services/skillBehaviourConvergence.js';
import { buildSkillExecutionContract } from '../src/services/skillExecutionContract.js';

const skills = getAllConvergedSkillNames();
const failures: Array<{ skill: string; reason: string }> = [];
const summary = { total: skills.length, complete: 0, information: 0, coordination: 0, economic: 0, safety: 0, providerRequired: 0, paymentRequired: 0, evidenceRequired: 0 };

for (const skill of skills) {
  const contract = buildSkillExecutionContract(skill);
  if (!contract.category) failures.push({ skill, reason: 'missing category' });
  if (!contract.requirements.length) failures.push({ skill, reason: 'missing requirements' });
  if (!contract.capabilities.length) failures.push({ skill, reason: 'missing capabilities' });
  if (!contract.completionEvidence.length) failures.push({ skill, reason: 'missing completion evidence' });
  if (!contract.failureModes.length) failures.push({ skill, reason: 'missing failure/recovery modes' });
  if (!contract.memoryKeys.length) failures.push({ skill, reason: 'missing Memory Profile policy' });
  if (!contract.completionCondition) failures.push({ skill, reason: 'missing completion condition' });
  summary[contract.mode] += 1;
  if (contract.requiresProvider) summary.providerRequired += 1;
  if (contract.requiresPayment) summary.paymentRequired += 1;
  if (contract.requiresEvidence) summary.evidenceRequired += 1;
}
summary.complete = skills.length - new Set(failures.map(item => item.skill)).size;

const outputDir = path.join(process.cwd(), 'data', 'audits');
fs.mkdirSync(outputDir, { recursive: true });
const output = { generatedAt: new Date().toISOString(), summary, failures };
fs.writeFileSync(path.join(outputDir, 'skill-execution-contract-audit.json'), JSON.stringify(output, null, 2));
if (failures.length) {
  console.error(`[skill-contract-audit] ${failures.length} contract gap(s) found.`);
  for (const failure of failures.slice(0, 30)) console.error(`- ${failure.skill}: ${failure.reason}`);
  process.exitCode = 1;
} else {
  console.log(`[skill-contract-audit] ${skills.length}/${skills.length} skills have complete execution contracts.`);
}

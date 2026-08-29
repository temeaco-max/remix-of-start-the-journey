/* Copyright (c) 2026 temeaco-max. All rights reserved. Proprietary and confidential. */
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { getAllConvergedSkillNames } from '../src/services/skillBehaviourRegistry.js';

const root = process.cwd();
const scenarioPath = path.join(root, 'data', 'scenario-lab', 'provider-outcome-scenarios.jsonl');
execFileSync('npx', ['tsx', 'scripts/provider-outcome-scenario-lab.ts'], { cwd: root, stdio: 'inherit', env: { ...process.env, KURUKOO_SCENARIO_TARGET: '999999' } });
execFileSync('npx', ['tsx', 'scripts/augment-converged-scenario-lab.ts'], { cwd: root, stdio: 'inherit' });

if (!fs.existsSync(scenarioPath)) throw new Error('Scenario lab output was not generated.');
const rows = fs.readFileSync(scenarioPath, 'utf8').split('\n').filter(Boolean).map(line => JSON.parse(line));
const present = new Set(rows.map(row => String(row.skill || '')));
const missing = getAllConvergedSkillNames().filter(skill => !present.has(skill));
if (missing.length) throw new Error(`Converged scenario coverage missing ${missing.length} skills: ${missing.slice(0, 25).join(', ')}`);
console.log(`[scenario-lab] converged coverage verified: ${present.size} skills represented.`);

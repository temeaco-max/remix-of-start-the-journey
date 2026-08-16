import fs from 'node:fs';
import path from 'node:path';
import { buildOutcomeCompletenessMatrix, summarizeOutcomeCompleteness } from '../src/services/outcomeCompleteness.js';

const country = String(process.env.KURUKOO_MATRIX_COUNTRY || 'ng').toLowerCase();
const rows = await buildOutcomeCompletenessMatrix(country);
const summary = summarizeOutcomeCompleteness(rows);
const outputDir = path.join(process.cwd(), 'data', 'audits');
fs.mkdirSync(outputDir, { recursive: true });
fs.writeFileSync(path.join(outputDir, 'outcome-completeness.json'), JSON.stringify({ country, summary, rows }, null, 2) + '\n');

const columns: Array<[string, (row: (typeof rows)[number]) => string]> = [
  ['Skill', (row) => row.skill],
  ['Family', (row) => row.family],
  ['Mode', (row) => row.mode || ''],
  ['Status', (row) => row.status],
  ['Canonical owner', (row) => row.canonicalOwner.join('<br>')],
  ['Chat entry', (row) => row.chatEntry],
  ['Context requirements', (row) => row.contextRequirements.join('<br>')],
  ['Actors', (row) => row.actors.join('<br>')],
  ['Capabilities', (row) => row.capabilities.join(', ')],
  ['Canonical objects', (row) => row.canonicalObjects.join('<br>')],
  ['Lifecycle states', (row) => row.lifecycleStates.join(' → ')],
  ['Execution boundaries', (row) => row.executionBoundaries.join('<br>')],
  ['Evidence requirements', (row) => row.evidenceRequirements.join('<br>')],
  ['UI representations', (row) => row.uiRepresentations.join('<br>')],
  ['Channel representations', (row) => row.channelRepresentations.join('<br>')],
  ['Linked-device behaviour', (row) => row.linkedDeviceBehaviour],
  ['Notification/continuation', (row) => row.notificationContinuation],
  ['Failure/recovery', (row) => row.failureRecovery.join('<br>')],
  ['External activation dependencies', (row) => row.externalActivationDependencies.join('<br>') || 'None beyond repository boundary'],
  ['Missing implementation', (row) => row.missingImplementation.join('<br>') || 'None detected'],
];
const escapeCell = (value: string) => value.replace(/\|/g, '\\|').replace(/\n/g, ' ');
const markdown = [
  '# Kurukoo Outcome-Completeness Matrix',
  '',
  `Generated for country \`${country}\` at ${summary.generatedAt}.`,
  '',
  '> This matrix is generated from the canonical skill-flow, capability, feature-flag, Chat, Economic Request, discovery, notification and execution boundaries. It distinguishes repository implementation from external activation and does not claim provider delivery.',
  '',
  `Summary: **${summary.skillCount} skills**, **${summary.familyCount} families**, **${summary.missingImplementationCount} missing repository flow definitions**, **${summary.rowsWithExternalActivationDependencies} rows with explicit activation boundaries**.`,
  '',
  `| ${columns.map(([name]) => name).join(' | ')} |`,
  `| ${columns.map(() => '---').join(' | ')} |`,
  ...rows.map((row) => `| ${columns.map(([, getter]) => escapeCell(getter(row))).join(' | ')} |`),
  '',
  '## Status vocabulary',
  '',
  '| Status | Meaning |',
  '| --- | --- |',
  '| `IMPLEMENTED_AND_VERIFIED` | Repository owner and flow are present with no additional capability-specific external activation boundary detected by the generator. |',
  '| `REPOSITORY_READY_EXTERNAL_ACTIVATION` | Repository-side flow is present, but payment, discovery, execution, notification or provider evidence remains deployment-dependent. |',
  '| `FOUNDATION_ONLY` | Reserved for future rows where a boundary exists but the canonical flow is intentionally incomplete. |',
  '| `MISSING_REPOSITORY_IMPLEMENTATION` | No canonical skill-flow definition was found. |',
  '',
].join('\n');
fs.writeFileSync(path.join(outputDir, 'outcome-completeness.md'), markdown + '\n');
console.log(JSON.stringify(summary, null, 2));

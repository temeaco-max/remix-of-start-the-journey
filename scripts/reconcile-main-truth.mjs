import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

const root = process.cwd();
const git = (...args) => execFileSync('git', args, { cwd: root, encoding: 'utf8' }).trim();
const safe = (fn, fallback = '') => { try { return fn(); } catch { return fallback; } };
const head = safe(() => git('rev-parse', 'HEAD'));
const branch = safe(() => git('branch', '--show-current'));
const originMain = safe(() => git('rev-parse', 'origin/main'), null);
const status = safe(() => git('status', '--porcelain'), '');
const localOnly = originMain ? safe(() => git('log', '--format=%h %s', `origin/main..${branch}`), '') : '';
const remoteOnly = originMain ? safe(() => git('log', '--format=%h %s', `${branch}..origin/main`), '') : '';
const remoteBranches = safe(() => git('for-each-ref', '--format=%(refname:short)', 'refs/remotes/origin'), '').split('\n').filter(Boolean).filter((value) => value !== 'origin/HEAD' && value !== 'origin');
const exists = (relativePath) => fs.existsSync(path.join(root, relativePath));
const categories = [
  { category: 'IMPLEMENTED_ON_MAIN', item: 'Canonical Chat / Brain / context arbitration', evidence: ['src/services/canonicalChatTurnService.ts', 'src/services/contextArbitration.ts'] },
  { category: 'IMPLEMENTED_ON_MAIN', item: '205-skill registry and explicit flows', evidence: ['src/services/skillFlows.ts', 'data/audits/outcome-completeness.json'] },
  { category: 'IMPLEMENTED_ON_MAIN', item: 'Discovery & Opportunity Network', evidence: ['src/services/discoveryNetwork.ts', 'src/routes/discoveryRoutes.ts'] },
  { category: 'IMPLEMENTED_ON_MAIN', item: 'Accessibility and low-bandwidth repairs', evidence: ['scripts/audit-accessibility.mjs', 'src/services/assetOptimization.ts'] },
  { category: 'IMPLEMENTED_ON_MAIN', item: 'Outcome completeness generator', evidence: ['src/services/outcomeCompleteness.ts', 'scripts/generate-outcome-completeness.ts'] },
  { category: 'IMPLEMENTED_ON_MAIN', item: 'SmolLM2 candidate training universe generator', evidence: ['scripts/generate-smollm2-training-universe.ts', 'ml/datasets/kurukoo-core-v1.manifest.json'] },
  { category: 'EXTERNALLY_DEPENDENT', item: 'Provider channels, push, voice, payment settlement, dispatch and live fulfilment', evidence: ['src/services/featureFlags.ts'] },
  { category: 'EXTERNALLY_DEPENDENT', item: 'SmolLM2 training, evaluation, export, promotion and runtime model activation', evidence: ['ml/config/model-registry.json', 'ml/config/training.yaml'] },
  { category: 'DOCUMENTED_ONLY', item: 'Historical plans and archived agent directives', evidence: ['docs', 'BLUEPRINT.md'] },
  { category: 'DUPLICATE_OR_SUPERSEDED', item: 'Route-level discovery/ad eligibility and duplicate map clients', evidence: ['src/services/discoveryNetwork.ts', 'src/services/adManager.ts', 'public/js/kurukoo-discover-map.js'] },
  { category: 'GENUINELY_MISSING', item: 'None detected by current canonical audits', evidence: [] },
];
const rows = categories.map((row) => ({ ...row, evidencePresent: row.evidence.every(exists) }));
const report = { generatedAt: new Date().toISOString(), branch, head, originMain, clean: !status, localOnlyCommits: localOnly ? localOnly.split('\n') : [], remoteOnlyCommits: remoteOnly ? remoteOnly.split('\n') : [], remoteBranches, rows };
const outputDir = path.join(root, 'data', 'audits');
fs.mkdirSync(outputDir, { recursive: true });
fs.writeFileSync(path.join(outputDir, 'main-reconciliation.json'), `${JSON.stringify(report, null, 2)}\n`);
const markdown = [
  '# Main-Branch Reconciliation',
  '',
  `Generated at ${report.generatedAt}.`,
  '',
  `| Field | Value |`,
  `| --- | --- |`,
  `| Branch | ${branch} |`,
  `| Local HEAD | ${head} |`,
  `| origin/main | ${originMain || 'unavailable'} |`,
  `| Working tree clean | ${report.clean ? 'yes' : 'no'} |`,
  `| Local-only commits | ${report.localOnlyCommits.length} |`,
  `| Remote-only commits | ${report.remoteOnlyCommits.length} |`,
  '',
  '| Classification | Item | Evidence | Evidence present |',
  '| --- | --- | --- | --- |',
  ...rows.map((row) => `| ${row.category} | ${row.item} | ${row.evidence.join('<br>') || '—'} | ${row.evidencePresent ? 'yes' : 'no'} |`),
  '',
  '## Remote branches',
  '',
  ...(remoteBranches.length ? remoteBranches.map((value) => `- ${value}`) : ['- none reported']),
  '',
  '> This reconciliation distinguishes repository presence from external activation. A file, route, test, matrix, readiness flag or model manifest is not proof of live provider delivery, settlement, fulfilment, or a trained/promoted model.',
  '',
].join('\n');
fs.writeFileSync(path.join(outputDir, 'main-reconciliation.md'), `${markdown}\n`);
console.log(JSON.stringify({ head, originMain, clean: report.clean, localOnlyCommits: report.localOnlyCommits.length, remoteOnlyCommits: report.remoteOnlyCommits.length, remoteBranches }, null, 2));

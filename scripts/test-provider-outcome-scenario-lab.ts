import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const outputDir = path.join(root, 'data', 'scenario-lab');
const manifestPath = path.join(outputDir, 'provider-outcome-scenario-lab.manifest.json');
const scenarioPath = path.join(outputDir, 'provider-outcome-scenarios.jsonl');
const trainingPath = path.join(root, 'ml', 'datasets', 'kurukoo-provider-outcome-lab-v1.all.jsonl');
const resultPath = path.join(outputDir, 'provider-outcome-execution-results.jsonl');
if (!fs.existsSync(manifestPath) || !fs.existsSync(scenarioPath) || !fs.existsSync(trainingPath)) throw new Error('Scenario laboratory artifacts are missing. Run npm run scenario-lab:generate first.');
const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
const scenarios = fs.readFileSync(scenarioPath, 'utf8').trim().split('\n').filter(Boolean).map(line => JSON.parse(line));
const training = fs.readFileSync(trainingPath, 'utf8').trim().split('\n').filter(Boolean);
if (manifest.generatedCount < 10000) throw new Error(`Expected at least 10,000 generated scenarios, got ${manifest.generatedCount}`);
if (manifest.skillCount < 200 || manifest.coverage.skills < 200) throw new Error(`Expected the canonical skill universe, got ${manifest.skillCount}`);
if (manifest.familyCount < 40) throw new Error(`Expected broad family coverage, got ${manifest.familyCount}`);
for (const market of ['ng', 'gb', 'ca']) if (!manifest.coverage.markets.some((value: string) => value === market || value.startsWith(`${market}-`))) throw new Error(`Missing market coverage: ${market}`);
for (const channel of ['web_chat', 'pwa', 'whatsapp', 'telegram', 'sms', 'ussd', 'email', 'voice', 'linked_device', 'qr_context']) if (!manifest.coverage.channels.includes(channel)) throw new Error(`Missing channel coverage: ${channel}`);
if (manifest.coverage.lifecycleVariants.length < 15) throw new Error('Lifecycle failure/recovery coverage is too narrow.');
if (manifest.coverage.linkedDevices < 1 || manifest.coverage.qrContexts < 1) throw new Error('Linked-device or QR coverage is missing.');
if (training.length !== scenarios.length) throw new Error('SmolLM2 provider-outcome corpus count does not match scenario count.');
for (const row of scenarios.slice(0, 50)) {
  if (!row.scenarioId || !row.skill || !row.market || !row.channel || !row.readinessClassification) throw new Error('Scenario row is missing required readiness fields.');
  if (!Array.isArray(row.canonicalServices) || !row.canonicalServices.includes('canonicalChatTurnService')) throw new Error('Scenario row does not identify the canonical Chat owner.');
  if (!row.provenance?.synthetic || row.provenance.productionUserData) throw new Error('Scenario provenance is not synthetic-only.');
}
if (process.env.KURUKOO_REQUIRE_SCENARIO_EXECUTION === 'true') {
  if (!fs.existsSync(resultPath)) throw new Error('Scenario execution results are missing. Run npm run scenario-lab:execute first.');
  const results = fs.readFileSync(resultPath, 'utf8').trim().split('\n').filter(Boolean).map(line => JSON.parse(line));
  if (results.length < manifest.skillCount) throw new Error(`Expected at least one canonical route probe per skill, got ${results.length}`);
  if (results.some(row => row.status === 'failed')) throw new Error('Canonical scenario route probe contains failures.');
}
console.log(`Provider outcome scenario laboratory regression passed: ${scenarios.length} scenarios, ${manifest.skillCount} skills, ${manifest.familyCount} families, ${manifest.coverage.markets.length} market configurations, ${manifest.coverage.channels.length} channels, ${manifest.coverage.lifecycleVariants.length} lifecycle variants.`);

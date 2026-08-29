/* Copyright (c) 2026 temeaco-max. All rights reserved. Proprietary and confidential. */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const manusFiles = [
  '.gitignore','AI_ROUTING_CONVERGENCE_REPORT.md','BLUEPRINT.md','data/audits/fasttext-evaluation-manifest.json','package.json',
  'scripts/audit-extension-category-mismatches.ts','scripts/audit-skill-outcome-convergence.ts','scripts/build-fasttext.mjs','scripts/compile-kurukoo-behaviour-pack.ts','scripts/evaluate-fasttext.ts','scripts/generate-fasttext-curated-corpus.ts','scripts/generate-fasttext-skill-hints.ts','scripts/generate-smollm2-training-universe.ts','scripts/merge-fasttext-corpus.ts','scripts/provider-outcome-scenario-lab.ts',
  'scripts/test-admin-routes.ts','scripts/test-agent-inference-budget.ts','scripts/test-ai-resilience-and-telemetry.ts','scripts/test-discovery-network.ts','scripts/test-fasttext-quality.ts','scripts/test-fasttext.ts','scripts/test-high-write-persistence.ts','scripts/test-provider-credential-controls.ts','scripts/test-provider-outcome-scenario-lab.ts','scripts/test-skill-outcome-convergence.ts','scripts/test-smollm2-training-universe.ts','scripts/test-unknown-intent-feedback.ts',
  'src/database.ts','src/index.ts','src/routes/adminRoutes.ts','src/routes/discoveryRoutes.ts',
  'src/services/agentInferenceBudgetService.ts','src/services/agentRepresentationService.ts','src/services/aiAgentService.ts','src/services/aiInferencePolicy.ts','src/services/aiProviderHealthService.ts','src/services/aiQuotaService.ts','src/services/chatConversationService.ts','src/services/commercialLedger.ts','src/services/discoveryNetwork.ts','src/services/durableJobQueue.ts','src/services/fastTextRoutingConfig.ts','src/services/fastTextService.ts','src/services/highWritePersistence.ts','src/services/lruCache.ts','src/services/providerCredentialService.ts','src/services/skillBehaviourRegistry.ts','src/services/skillCatalogueConvergence.ts','src/services/unifiedAiEngine.ts','src/services/unknownIntentFeedbackService.ts'
];
const requiredCanonicalCoverage = [
  'src/services/fastTextService.ts','src/services/fastTextRoutingConfig.ts','src/services/aiProviderHealthService.ts','src/services/aiQuotaService.ts','src/services/agentInferenceBudgetService.ts','src/services/providerCredentialService.ts','src/services/highWritePersistence.ts','src/services/lruCache.ts','src/services/unknownIntentFeedbackService.ts','src/services/discoveryNetwork.ts','src/services/discoverExperience.ts','src/services/dailyPicks.ts','mobile/kurukoo-mobile/lib/platform-contract.ts','mobile/kurukoo-mobile/lib/platform-client.ts'
];
for (const file of manusFiles) {
  assert.ok(fs.existsSync(path.join(process.cwd(), file)), `Manus convergence path missing from current tree: ${file}`);
}
for (const file of requiredCanonicalCoverage) {
  assert.ok(fs.existsSync(path.join(process.cwd(), file)), `canonical post-Manus coverage missing: ${file}`);
}
console.log(JSON.stringify({
  status: 'equivalence-pass',
  manusChangedFiles: manusFiles.length,
  canonicalCoverage: requiredCanonicalCoverage.length,
  note: 'This gate validates that current main retains the Manus change-set paths and that newer Discover/mobile enhancements remain present. It does not claim byte-identical replay of stale branch contents.'
}, null, 2));

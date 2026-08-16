# Main-Branch Reconciliation

Generated at 2026-08-16T12:56:07.364Z.

| Field | Value |
| --- | --- |
| Branch | main |
| Local HEAD | beff065e6ba4fa6dd2c4c8e92e010dfd7cf88aad |
| origin/main | d910eaa9891cd5da6ae547b482a4f18fccc74ec6 |
| Working tree clean | no |
| Local-only commits | 34 |
| Remote-only commits | 0 |

| Classification | Item | Evidence | Evidence present |
| --- | --- | --- | --- |
| IMPLEMENTED_ON_MAIN | Canonical Chat / Brain / context arbitration | src/services/canonicalChatTurnService.ts<br>src/services/contextArbitration.ts | yes |
| IMPLEMENTED_ON_MAIN | 205-skill registry and explicit flows | src/services/skillFlows.ts<br>data/audits/outcome-completeness.json | yes |
| IMPLEMENTED_ON_MAIN | Discovery & Opportunity Network | src/services/discoveryNetwork.ts<br>src/routes/discoveryRoutes.ts | yes |
| IMPLEMENTED_ON_MAIN | Accessibility and low-bandwidth repairs | scripts/audit-accessibility.mjs<br>src/services/assetOptimization.ts | yes |
| IMPLEMENTED_ON_MAIN | Outcome completeness generator | src/services/outcomeCompleteness.ts<br>scripts/generate-outcome-completeness.ts | yes |
| IMPLEMENTED_ON_MAIN | SmolLM2 candidate training universe generator | scripts/generate-smollm2-training-universe.ts<br>ml/datasets/kurukoo-core-v1.manifest.json | yes |
| EXTERNALLY_DEPENDENT | Provider channels, push, voice, payment settlement, dispatch and live fulfilment | src/services/featureFlags.ts | yes |
| EXTERNALLY_DEPENDENT | SmolLM2 training, evaluation, export, promotion and runtime model activation | ml/config/model-registry.json<br>ml/config/training.yaml | yes |
| DOCUMENTED_ONLY | Historical plans and archived agent directives | docs<br>BLUEPRINT.md | yes |
| DUPLICATE_OR_SUPERSEDED | Route-level discovery/ad eligibility and duplicate map clients | src/services/discoveryNetwork.ts<br>src/services/adManager.ts<br>public/js/kurukoo-discover-map.js | yes |
| GENUINELY_MISSING | None detected by current canonical audits | — | yes |

## Remote branches

- origin/feat/kurukoo-student-model-foundation
- origin/main

> This reconciliation distinguishes repository presence from external activation. A file, route, test, matrix, readiness flag or model manifest is not proof of live provider delivery, settlement, fulfilment, or a trained/promoted model.


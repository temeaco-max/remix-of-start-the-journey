# Kurukoo AI Model Implementation Map

| Existing boundary | Role | Student-model work |
|---|---|---|
| `src/services/internalCoordinator.ts` | Brain policy/capability arbitration | Expand toward universal context arbitration; never bypass canonical services |
| `src/services/coordinatorStore.ts` | Brain event/run persistence | Record model/arbitration provenance where appropriate |
| `src/services/coordinatorLearning.ts` (where present) | Teacher candidate learning | Feed validated learning pipeline, not direct production mutation |
| `src/services/smolLm2Service.ts` | Local SmolLM2 inference | Load versioned Kurukoo student artifact and expose structured semantic inference |
| `src/services/unifiedAiEngine.ts` | Current AI provider composition | Preserve as provider abstraction while routing Brain semantics through canonical model boundary |
| `src/services/mistralService.ts` | Strong teacher/provider | Offline teacher/evaluator adapter where permitted |
| `src/services/groqService.ts` | Strong/high-throughput provider | Offline teacher/evaluator adapter where permitted |
| `src/services/agentRuntime.ts` | Bounded autonomous runtime | Consume Brain decisions; never receive raw model authority |
| `src/services/aiAgentService.ts` | Agent-facing AI behavior | Converge on Brain/model boundary |
| `ml/scenarios` | Scenario universe | Generate combinatorial Kurukoo interactions |
| `ml/datasets` | Immutable training datasets | Validate, curate, deduplicate and balance |
| `ml/teachers` | Teacher adapters | Generate/critique candidate examples |
| `ml/training` | Student training | LoRA/QLoRA |
| `ml/evaluation` | Promotion gate | Golden, arbitration, adversarial and resource evaluation |
| `ml/export` | Deployment packaging | Quantized/versioned artifacts |
| `ml/registry` | Model lifecycle | Candidate → shadow → canary → active → retired |

## Important

The `ml/` workspace is offline infrastructure. Production must consume only a versioned model artifact through the existing runtime boundaries.

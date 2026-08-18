# Kurukoo AI Model Implementation Map

| Existing boundary | Role | Student-model work |
|---|---|---|
| `src/services/internalCoordinator.ts` | Brain policy/capability arbitration | Expand toward universal context arbitration; never bypass canonical services |
| `src/services/coordinatorStore.ts` | Brain event/run persistence | Record model/arbitration provenance where appropriate |
| `src/services/coordinatorLearning.ts` (where present) | Teacher candidate learning | Feed validated learning pipeline, not direct production mutation |
| `src/services/smolLm2Service.ts` | Local SmolLM2 inference | Load versioned Kurukoo student artifact and expose structured semantic inference |
| `src/services/unifiedAiEngine.ts` | Current AI provider composition | Preserve as the existing provider abstraction; do not create a second production AI router |
| `src/services/mistralService.ts` | Strong teacher/provider | Offline teacher/evaluator adapter where permitted |
| `src/services/groqService.ts` | Strong/high-throughput provider | Offline teacher/evaluator adapter where permitted |
| `ml/teachers` | Teacher adapters | Use the existing teacher scripts with a configured provider pool: Gemini, Mistral, Groq, OpenRouter, Hugging Face and OpenAI. `auto` mode may prefer free/low-cost providers first, but never assumes a provider is free; provider quotas, billing, model availability and terms remain authoritative |
| `ml/scenarios` | Scenario universe | Generate combinatorial Kurukoo interactions |
| `ml/datasets` | Immutable training datasets | Validate, curate, deduplicate and balance |
| `ml/training` | Student training | LoRA/QLoRA |
| `ml/evaluation` | Promotion gate | Golden, arbitration, adversarial and resource evaluation |
| `ml/export` | Deployment packaging | Quantized/versioned artifacts |
| `ml/registry` | Model lifecycle | Candidate → shadow → canary → active → retired |
| `src/services/agentRuntime.ts` | Bounded autonomous runtime | Consume Brain decisions; never receive raw model authority |
| `src/services/aiAgentService.ts` | Agent-facing AI behavior | Converge on Brain/model boundary |

## Important

The `ml/` workspace is offline infrastructure. Production must consume only a versioned model artifact through the existing runtime boundaries.

Teacher selection is intentionally kept inside the existing teacher entrypoints rather than introducing a new production service. The configured provider order and `KURUKOO_TEACHER_FREE_FIRST` setting are cost-efficiency inputs only. A failed, rate-limited or unavailable provider falls through to the next configured teacher where possible; candidate output remains untrusted until the existing curation/admission gate explicitly accepts it.

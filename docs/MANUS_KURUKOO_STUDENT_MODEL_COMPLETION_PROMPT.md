# Manus Completion Directive — Kurukoo Student Model + Brain

You are continuing implementation in `temeaco-max/kurukoo` on branch `feat/kurukoo-student-model-foundation`.

## Mission

Take the repository from the current Brain/coordinator + generic SmolLM2 + teacher-artifact foundation to a **fully implemented, locally trainable, Kurukoo-specialised, deployment-ready SmolLM2 student model integrated into the canonical Brain**, while completing the universal conversational context-arbitration layer.

This is NOT a new isolated product phase. It is convergence/completion of the existing architecture.

## Read first

Read and reconcile, in this order:

1. `BLUEPRINT.md`
2. `BLUEPRINT_IMPLEMENTATION_ADDENDUM.md`
3. `BLUEPRINT_AI_MODEL_ADDENDUM.md`
4. `docs/KURUKOO_AI_MODEL_SYSTEM.md`
5. `docs/KURUKOO_PRODUCTION_AND_LEARNING_PIPELINES.md`
6. `docs/KURUKOO_AI_MODEL_IMPLEMENTATION_MAP.md`
7. `docs/internal-coordinator-brain.md`
8. `src/services/internalCoordinator.ts`
9. `src/services/coordinatorStore.ts`
10. existing coordinator-learning implementation/files
11. `src/services/smolLm2Service.ts`
12. `src/services/unifiedAiEngine.ts`
13. `src/services/mistralService.ts`
14. `src/services/groqService.ts`
15. `src/services/agentRuntime.ts`
16. `src/services/aiAgentService.ts`
17. canonical skill, Economic Request, memory, notification, reminder, provider, product and chat services.

Do not assume any claim is correct merely because documentation says it is implemented. Reconcile documentation with actual code.

## Architecture to preserve

The canonical production path is:

`Channel → Conversation → Brain/context arbitration → deterministic state + Kurukoo-SmolLM2 → confidence/provenance/policy arbitration → Skill/Agent/Native Assistance → Canonical Object → Execution → Evidence → Notification/Continuation → Conversation`

The Brain decides meaning and next step. Canonical services own state mutation, authorization, evidence and idempotency.

The learning path is separate:

`Kurukoo repository/ontology → scenario universe → validation/redaction → teacher generation/critique → curation/deduplication/balancing → immutable dataset → LoRA/QLoRA → evaluation → export/quantization → model registry → shadow/canary → production`

## Student model

Use `HuggingFaceTB/SmolLM2-1.7B-Instruct` as the initial student. Do not replace it with a larger production model merely because a larger model is available.

Train it to specialise in Kurukoo's:

- ontology and vocabulary;
- intent interpretation;
- context arbitration;
- topic switching/resumption;
- active-request continuity;
- entity and requirement extraction;
- natural clarification;
- conversational repair;
- native assistance;
- Economic Requests;
- provider/network/Radar/Pulse;
- products/cart/checkout;
- agents and goals;
- notifications/reminders;
- Topics;
- Points/subscriptions/account semantics;
- truthfulness and external-boundary semantics;
- safety/policy boundaries;
- Kurukoo conversational style.

The model must learn how Kurukoo works, not memorise live user state. Live facts remain in canonical services.

## Teacher models

Existing teacher infrastructure is to be reused and completed. Strong models available during development (Mistral, Gemini, Groq or other permitted providers) may generate/critique training material. They are offline teachers/evaluators, not production authorities.

Teacher outputs must carry provenance and remain untrusted until validation. No teacher response may directly execute a capability or mutate production state.

## Scenario universe

Build a generator capable of exploring a scenario universe exceeding 100 million combinations where useful. Do NOT blindly materialise 100M near-duplicate training records.

Generate combinations across:

- user/profile state;
- conversation state;
- multiple simultaneous long-lived contexts;
- active Economic Requests;
- pending questions;
- memory;
- reminders;
- notifications;
- safety;
- agents/goals;
- providers/network/Radar;
- products/cart;
- Topics;
- channel/session;
- timing/location;
- ambiguity;
- corrections;
- interruptions;
- topic switches;
- delayed answers;
- unavailable integrations;
- partial execution;
- evidence state;
- adversarial and malformed language;
- natural multilingual/slang/typo variation where supported by product requirements.

Each scenario must have an expected canonical outcome and provenance.

## Mikel invariant

Never resolve a pending request field merely because it is the next missing field.

For example:

`I need a plumber in Lagos.`

`What is your name?`

`Mikel`

The system must recognise that `Mikel` may be identity information, preserve the plumber request, and continue naturally. This must be a golden and adversarial evaluation case.

## Training implementation

Implement a reproducible Python training workspace under `ml/`.

Use parameter-efficient training first (LoRA/QLoRA). Pin compatible versions after selecting the actual training environment. Record base-model revision, dataset version, config, seed, hardware profile, code revision and artifact hashes.

Support:

- dataset loading;
- staged training;
- checkpoints/resume;
- adapter export;
- optional adapter merge;
- quantized deployment export;
- model manifest generation.

Do not put training libraries into the production runtime.

## Dataset quality

Every training example must pass:

- schema validation;
- provenance;
- privacy/redaction;
- canonical ontology validation;
- expected-outcome validation;
- contradiction checks;
- duplicate/near-duplicate filtering;
- balance checks;
- teacher quality checks where applicable.

Separate temporary teacher artifacts from durable curated dataset versions.

## Training stages

Implement and document:

1. ontology/domain adaptation;
2. semantic intent/entity/requirement learning;
3. context arbitration;
4. interleaving/resumption and conversational repair;
5. capability semantics;
6. truthfulness/safety/policy;
7. style/preference alignment;
8. regression hardening.

Do not assume every stage requires a separate model or adapter. Use the simplest reproducible structure that gives measurable improvement.

## Brain integration

Upgrade the Brain so the model provides structured semantic proposals rather than free-form authority.

At minimum support:

- candidate intent;
- candidate context owners;
- entities;
- pending-question answer assessment;
- topic-switch detection;
- resumption target;
- confidence;
- clarification-needed signal.

The Brain must arbitrate those proposals against actual state and policy.

Low confidence must preserve existing contexts and ask a natural clarification question.

## Evaluation

Build a real release gate covering:

- intent accuracy;
- context-owner accuracy;
- Mikel-class ambiguity;
- interleaving/resumption;
- clarification naturalness;
- request continuity;
- capability selection;
- Economic Request lifecycle;
- memory boundaries;
- reminders/notifications;
- agents;
- provider/network state;
- products;
- truthfulness;
- safety;
- adversarial inputs;
- regression against current behaviour;
- latency;
- RAM/CPU footprint.

The new model must beat or materially improve the baseline on the defined acceptance suites before promotion.

Do not create a giant pile of disconnected test files. Build reusable evaluation infrastructure under `ml/evaluation` and connect it to existing acceptance infrastructure where appropriate.

## Model registry/deployment

Implement:

`candidate → shadow → canary → active → retired`

with:

- immutable artifact hashes;
- dataset/training references;
- evaluation references;
- runtime compatibility;
- promotion history;
- rollback target.

Production must load a versioned model through the canonical SmolLM2/runtime boundary. No model may self-promote.

## Runtime scaling

Design for large user populations without making one model process a singleton bottleneck.

- deterministic paths should avoid inference;
- SmolLM2 handles high-volume semantic work;
- stronger models are escalation/teacher paths;
- inference can scale horizontally;
- model loading must be bounded and shared per worker;
- timeouts/backpressure must be explicit;
- model version must be observable.

Do not add infrastructure merely for theoretical scale; make the runtime boundary scalable without requiring an architectural rewrite.

## External model keys

Do not stop implementation because a teacher API key is unavailable. The provider adapter, dataset contract, prompt, local deterministic/synthetic generation path and replayable fixture must still be implemented. When keys are available, use them to improve data quality. Missing external access is a deployment limitation, not permission to leave the architecture unfinished.

## Repository hygiene

- Do not create a second Brain.
- Do not create a second AI router.
- Do not create a second model runtime.
- Do not create category-specific transaction engines.
- Reuse existing canonical services.
- Do not create another isolated phase/branch architecture.
- Keep the `ml/` training system separate from production runtime.
- Update documentation as implementation becomes true.

## Definition of total completion

Do not stop at scaffolding.

Completion requires:

1. scenario generation works;
2. dataset validation/curation works;
3. teacher adapters work where credentials exist and local/replay paths work without them;
4. LoRA/QLoRA training runs reproducibly;
5. a real Kurukoo-specialised SmolLM2 artifact is produced;
6. evaluation runs and produces a release result;
7. quantized deployment artifact is produced;
8. model registry records it;
9. canonical runtime loads it;
10. Brain uses it for structured semantic arbitration;
11. canonical services execute resulting actions;
12. shadow/canary/rollback works;
13. natural interleaving works in real Chat;
14. no existing functionality regresses;
15. documentation reflects actual repository truth.

## Final working rule

Build, connect and repair. Do not merely prove that files exist. Do not stop at tests or reports. When a missing implementation is discovered, implement it through the existing canonical boundary. Use tests as evidence of correctness after building, not as a substitute for building.

# Kurukoo native intelligence completion contract

This document defines the operational completion boundary for Kurukoo's native conversational intelligence. It records the implemented learning path and prevents development, simulation, or offline-evaluation evidence from being described as live model delivery.

## Canonical learning and authority path

```text
scenario laboratory
  -> provider-backed teacher candidates (untrusted)
  -> canonical curation review queue
  -> explicit deterministic golden corpus
  -> accepted synthetic corpus
  -> guarded LoRA / QLoRA candidate training
  -> artifact verification and independent evaluation
  -> registry: candidate -> shadow -> canary -> production
  -> existing SmolLM2 runtime boundary
  -> observed failures and uncertainty -> next learning cycle
```

The learning path does **not** replace Kurukoo's Brain, context arbitration, capability selection, policy checks, progressive identity, canonical services, executor, evidence boundary, or recovery flow. A conversational student improves language behaviour only; it does not gain independent authority to create commitments or mutate canonical state.

## Teacher and candidate boundary

The supported teacher pool is Gemini, Mistral, Groq, OpenRouter, Hugging Face, and OpenAI. `KURUKOO_TEACHER_FREE_FIRST=true` orders configured free or low-cost candidates first, but no provider is represented as free without real account evidence. The generator records provider order, selected provider/model, and fallback errors in every candidate provenance record.

Run the bounded candidate stage with:

```bash
KURUKOO_TEACHER_FREE_FIRST=true KURUKOO_TEACHER_LIMIT=12 npm run ml:teacher-candidates
npm run ml:import-teacher-candidates
```

Teacher output is candidate-only. The importer writes it to the existing canonical curation queue with `reviewStatus: pending`, `reviewed: false`, and `accepted: false`. It cannot become training data through a hidden fallback, and it cannot mutate production, user, or economic state.

## Explicit accepted-corpus policy

`npm run ml:seed-golden` materializes `kurukoo-deterministic-golden-v1`, an intentionally small, byte-stable synthetic seed corpus. Each example carries deterministic-policy provenance, explicit review and acceptance flags, quality scores, and synthetic/no-personal-data declarations. The policy is limited to hand-authored, contract-tested examples; it does **not** auto-accept teacher output.

`npm run ml:curate` continues to admit examples only when the existing strict curation gate finds explicit review and acceptance, quality thresholds, low hallucination and premature-action rates, required message content, and required coverage. A ready corpus means **ready for guarded training**, not that a student is trained, deployed, or production-authoritative.

## Student, registry, and runtime boundary

The trainer refuses unapproved rows. It emits a candidate artifact only and marks it `productionEnabled: false`. A runtime model reference is optional and must be explicitly declared in the artifact manifest; an adapter or artifact directory is never treated as a runtime-loadable model by implication.

The model registry permits only `candidate -> shadow -> canary -> production` progression. Every non-retired promotion requires a passed evaluation with thresholded truthfulness, safety, context retention, goal retention, failure recovery, action discipline, hallucination rate, premature-action rate, latency, and cost. Promotion is blocked if any required metric is absent or outside its configured threshold. Production selection additionally requires `productionEnabled: true` in the registry.

The existing `smolLm2Service` remains the sole student-model runtime boundary. `KURUKOO_SMOLLM2_MODEL_STAGE` may request `base`, `candidate`, `shadow`, `canary`, or `production`; the registry adapter resolves only a valid, approved, runtime-loadable entry. Missing, malformed, unapproved, or non-runnable registry records fail closed to the configured base SmolLM2 model and expose a machine-readable fallback reason.

## Operator-invoked complete cycle

The cycle is explicit and is not a background service:

```bash
KURUKOO_TEACHER_FREE_FIRST=true \
KURUKOO_TEACHER_LIMIT=12 \
KURUKOO_ENABLE_TRAINING=false \
python3 ml/run_learning_cycle.py
```

The runner records scenario generation, teacher candidates, queue import, offline teacher evaluation, deterministic seed materialization, curation, training status, registry status, failed stages, and final state in `artifacts/learning-cycle/latest.json`. It returns nonzero for a failed stage or a blocked corpus. With an accepted corpus and training intentionally disabled it reports `ready_for_training`; it never silently claims training, promotion, production activation, or live serving.

## Completion criteria

Native intelligence is complete only when a Kurukoo-trained candidate has a reproducible artifact and demonstrates all of the following against the base model:

1. It improves the required conversational dimensions under independent evaluation.
2. It passes 5, 10, 20, 40, 80, and 81-turn natural, interruption, correction, ambiguity, multi-goal, privacy, safety, and authority regressions.
3. It preserves canonical truth, authorization, evidence, and progressive-identity boundaries.
4. It passes the complete registry promotion thresholds, shadow observation, canary observation, and production rollback tests.
5. It has a real runtime-loadable reference and can be switched or rolled back solely through the existing SmolLM2 boundary.
6. Observed, provenance-bearing failures feed back into the next curation cycle without teacher candidates being auto-admitted.

Until those conditions are met, the system may truthfully claim a **guarded learning substrate** and **ready-for-training corpus**, but not a production-trained or production-serving Kurukoo student model.

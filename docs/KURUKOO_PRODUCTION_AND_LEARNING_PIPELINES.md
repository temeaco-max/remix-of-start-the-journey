# Kurukoo Production + Learning Pipelines

## Canonical production pipeline

```text
Channel
  -> Conversation/session
  -> Brain/context arbitration
  -> state + memory + Kurukoo-SmolLM2 proposal
  -> policy/provenance/confidence arbitration
  -> canonical skill / agent / native assistance
  -> canonical object
  -> execution boundary
  -> evidence
  -> notification/continuation
  -> conversation
```

## Canonical learning pipeline

```text
approved learning signals
  -> privacy/redaction
  -> scenario/example normalization
  -> deterministic validation
  -> teacher generation/critique
  -> curation + deduplication + balancing
  -> immutable dataset version
  -> LoRA/QLoRA training
  -> offline evaluation
  -> adversarial/regression evaluation
  -> quantization/export
  -> model manifest
  -> model registry
  -> shadow/canary
  -> production
```

## Boundaries

The production pipeline must not import training libraries or generate model weights. The learning pipeline must not directly mutate production state.

The Brain may consume a model artifact but remains the authority for arbitration and delegates state changes to canonical services.

## Scaling model

Registered-user count is not equivalent to concurrent inference. The inference tier must be independently horizontally scalable. Deterministic operations should avoid model inference where possible. SmolLM2 handles high-volume semantic work; stronger teachers/escalation models are reserved for difficult or learning cases.

## Model lifecycle

```text
base model
  -> adapter training
  -> Kurukoo-SmolLM2 candidate
  -> evaluation
  -> registry
  -> shadow
  -> canary
  -> production
  -> observed failures/uncertainty
  -> teacher learning
  -> next dataset
  -> next model
```

## No architectural drift

This document is the canonical pipeline contract for this work. New implementations must extend these boundaries rather than creating a second AI router, second model runtime, second learning store or second Brain.

## Conversational Intelligence Laboratory extension

The existing scenario laboratory is now trajectory-based rather than single-turn outcome-only. It generates **24,000 synthetic trajectories** from the canonical 205-skill and 46-family registries, across Nigerian, British and Canadian market configurations, six supported actor types, ten channels, and twenty lifecycle variants. Each trajectory is deterministic and includes a 5-, 10-, 20-, 40-, 80- or 81-turn horizon, multiple simultaneously active goals, interruptions, pivots, corrections, postponement, resumption, cancellation, relative references, colloquial/noisy language, and canonical truth-boundary reminders. The current generated set contains 943,188 total turns and averages 39.30 turns per trajectory.

The trajectory manifest defines evaluation dimensions for naturalness, context retention, goal retention, interruption handling, correction handling, clarification quality, ambiguity handling, relative-reference resolution, multi-goal tracking, action-transition accuracy, canonical schema adherence, hallucination rate, unnecessary-question rate, premature-action rate, memory contamination, safety compliance, latency, token usage, inference cost, and failure recovery. It also defines failure ownership labels for model capability, prompt/context construction, memory assembly, intent arbitration, slot extraction, canonical action proposal, UI/card transition, and deterministic backend state.

`scripts/benchmark-conversational-trajectories.ts` is the provider-neutral evaluator. It consumes the existing core corpus and scenario-lab corpus, runs structural contract checks, optionally probes the existing unified AI boundary, reports latency and provider/model attribution, and clusters failures by ownership label. Local or hosted models are opt-in candidates only. The evaluator never calls canonical mutation services and never treats teacher output as state, evidence, provider availability, payment, delivery, verification, or completion.

Mistral teacher evaluation is available only behind explicit benchmark opt-in and only after the existing protected connection check succeeds. The teacher receives synthetic trajectory text and is instructed to return critique only. It has no tools, no canonical identity, no database mutation path, and no production routing authority. When Mistral is not configured or not verified, the benchmark reports that state without assuming quotas or free allowances. Qwen, Llama and other candidates are represented as provider-neutral readiness slots and are not claimed available unless independently configured and probed.

The current local benchmark observed the SmolLM2 runtime boundary as unavailable in this environment, so unified AI truthfully fell back to `Kurukoo Template`. The sampled fallback scored **0.67** on the heuristic rubric and clustered failures mainly under prompt/context construction, especially context retention, multi-goal tracking, relative-reference resolution and latency. This is a measured diagnostic result, not a human naturalness score and not a claim that SmolLM2 itself was available.

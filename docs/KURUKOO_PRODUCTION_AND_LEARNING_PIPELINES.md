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

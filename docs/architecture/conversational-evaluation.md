# Kurukoo Conversational Evaluation Contract

This document defines the shared evaluation boundary for Kurukoo's conversational intelligence.

## Purpose

Kurukoo must evaluate complete conversations, not only intent labels or single-turn routes. The evaluator is read-only: it does not own routing, memory, Economic Requests, providers, agents, payments, or execution.

## Canonical flow

```text
Conversation trajectory
→ model response
→ conversation quality assessment
→ context/action/reference evaluation
→ trajectory score
→ model comparison or training candidate
```

## Dimensions

The evaluator measures:

- naturalness;
- context preservation;
- action discipline;
- reference handling;
- recovery/context continuity.

Existing canonical services remain the authority for actual state and evidence.

## Model independence

The same evaluator can score SmolLM2, Mistral, Ministral, Qwen, Gemini, Groq, or another configured model. Model choice is an empirical deployment decision rather than an architectural dependency.

## Conversation requirements

Trajectories should include:

- ordinary conversation;
- vague problem descriptions;
- exploration before action;
- explicit action;
- interruptions;
- corrections;
- relative references;
- multiple active contexts;
- resumed goals;
- cancellation and reversal;
- unavailable external capabilities;
- recovery and follow-up.

## Truthfulness

A model score cannot override canonical evidence. A fluent response that invents a provider, price, payment, availability, delivery, completion or external communication is a failure even if the conversation sounds natural.

## Reproduction

From the repository root:

```bash
npx tsx scripts/test-conversation-evaluation.ts
npx tsx scripts/test-conversational-generation.ts
npx tsx scripts/benchmark-conversational-models.ts
```

Actual local/hosted model availability determines which benchmark paths can execute. Unconfigured providers must be reported as unavailable rather than simulated.

# Kurukoo Native Intelligence Completion Contract

This document records the operational completion boundary for Kurukoo's native conversational intelligence.

## Canonical path

```text
scenario laboratory
  -> teacher generation / critique
  -> explicit curation
  -> immutable accepted corpus
  -> LoRA / QLoRA training
  -> offline conversational evaluation
  -> adversarial / regression evaluation
  -> artifact manifest
  -> model registry: candidate
  -> shadow
  -> canary
  -> production
  -> observed failures / uncertainty
  -> next learning cycle
```

External provider credentials and compute are deployment inputs, not architectural blockers. Missing credentials must produce explicit readiness states rather than silently changing the meaning of a run.

## Teacher pool

The teacher pool may include Gemini, Mistral, Groq, OpenRouter, Hugging Face and OpenAI. `KURUKOO_TEACHER_FREE_FIRST=true` prefers configured free/low-cost candidates, but no provider is assumed to be free; provider quotas, billing, availability and account policy remain authoritative.

## Candidate boundary

Teacher output is untrusted candidate material. It cannot mutate Kurukoo state and cannot become a training example unless the existing curation contract is satisfied. Production user data and personal data are excluded.

## Student boundary

The training entrypoint refuses non-approved corpora and never activates or promotes a model automatically. The model registry is an operational lifecycle record only; promotion requires an independent evaluation manifest proving truthfulness, safety, context retention, goal retention and recovery gates.

## Runtime boundary

Kurukoo's Brain/context arbitration, canonical services, capability executor, authorization, evidence and truth boundaries remain authoritative regardless of which conversational model is active.

A trained student model is therefore an improvement in language/behaviour competence, not a replacement for Kurukoo's OS authority.

## Completion criteria

The native intelligence programme is complete only when a Kurukoo-trained candidate:

1. beats the base-model benchmark on the required conversational dimensions;
2. passes adversarial and regression suites;
3. preserves canonical truth boundaries;
4. is registered with a complete manifest;
5. survives shadow/canary observation;
6. can be activated and rolled back without changing canonical OS services;
7. feeds observed failures back into the next teacher/curation cycle.

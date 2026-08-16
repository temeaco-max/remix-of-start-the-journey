# Kurukoo AI Capability Orchestration

The conversational model does not need to know Kurukoo's internal service graph. It receives a bounded capability handoff derived from the existing canonical routing result.

## Flow

```text
user language
  -> Brain / context arbitration
  -> canonical intent/capability routing
  -> AI capability orchestration bridge
  -> conversational model may talk / clarify / propose
  -> universal Chat action protocol
  -> canonical domain service
  -> state / execution / evidence
  -> conversational presentation / continuation
```

## Invariant

`aiCapabilityOrchestrator.ts` is read-only. It does not execute an action, mutate state, authorize payment, select a provider, or replace the capability registry.

Its output is a bounded proposal containing:

- canonical capability name;
- canonical action when known;
- preserved context/object identity when available;
- extracted entities from the existing router;
- confidence;
- action posture;
- confirmation requirement;
- context-preservation requirement;
- mandatory canonical validation.

The downstream universal Chat action protocol remains the only execution boundary.

## Conversation modes

- `none`: ordinary conversation; the model talks naturally.
- `clarify`: the model asks for the missing information rather than executing.
- `propose`: the model may explain or propose the canonical capability/action, subject to validation and confirmation.
- `control`: an existing goal/request may be controlled only after exact owner/context validation.

The capability bridge therefore complements, rather than replaces, conversational intelligence and canonical state ownership.

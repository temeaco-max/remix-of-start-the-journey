# Kurukoo Capability Model

## Product rule

Kurukoo is capability-composable rather than feature-closed. The canonical product surface is one conversational control plane that composes reusable capabilities across people, providers, products, connected resources, channels, agents and external services.

## Terminology

**Skill** = a user-facing goal or use-case composition. Examples include finding a worker, ordering food, arranging transport, repairing a device or managing a reminder.

**Capability** = a reusable power that can be composed into many skills. Examples include discovery, availability, verification, quote, reservation, payment, fulfilment, evidence, communication, scheduling, memory, observation, control, coordination and execution.

**Action** = a concrete operation against a capability. Interaction policy is evaluated at this level because `inspect` and `authorize`, or `view` and `execute`, do not have the same risk or confirmation requirements.

**Canonical owner** = the domain service that owns mutation, authorization, evidence and lifecycle truth.

**Connected resource** = an owner-authorized external thing—phone, TV, camera, CCTV, laptop, vehicle, IoT device, service account or similar—that exposes capabilities through an approved adapter.

## Canonical composition

```text
user request
  -> conversational understanding
  -> interaction policy
  -> skill / goal
  -> capability composition
  -> action selection
  -> canonical owner
  -> external adapter / provider / connected resource
  -> execution
  -> evidence
  -> outcome
  -> continuation / memory / notification
```

## Endless-capability rule

A new pain point should first be mapped onto existing skills, capabilities, actors, objects, lifecycle states, evidence, execution and presentation surfaces. A new canonical owner is justified only when the semantics cannot be represented safely by existing primitives.

Do not create a vertical subsystem simply because a new use-case appears.

## Safety and truth

Capability composition does not grant execution authority. Interaction policy, exact owner/object identity, authentication, confirmation, idempotency and external activation remain enforced at the canonical execution boundary.

Repository readiness, development simulation and real external execution remain separate states.

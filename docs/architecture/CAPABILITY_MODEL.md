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

Every known canonical skill is registered automatically as `skill.<name>` over the atomic capability foundation. Downstream systems therefore resolve agent eligibility, capability discovery and orchestration from the same composition fabric instead of maintaining vertical allow-lists.

## Atomic capability foundation

The reusable foundation includes economic powers such as discovery, availability, quote, verification, reservation, payment, escrow, contract, fulfilment, tracking, evidence, cancellation, dispute and completion, plus universal powers such as observe, view, control, communicate, notify, schedule, remember, delegate, coordinate, locate, authenticate, authorize, execute, recover and audit.

A skill can compose several of these powers. A connected resource exposes some of them. An agent can coordinate them. A canonical owner still governs actual state mutation and evidence.

## Connected resource convergence

```text
connect
  -> owner / trust
  -> pending
  -> device-paired
  -> active
  -> exposed capabilities
  -> conversational context
  -> interaction policy
  -> canonical execution
```

Pending or revoked resources cannot be treated as active. Resource identity and permissions remain owner-scoped. Read-only viewing is distinct from state-changing control.

## Agents

The autonomous runtime derives whether a goal is composable from the canonical skill/capability fabric rather than a hand-maintained list of economic skills. Agent runtime owns goal scheduling, autonomy, pause/resume/cancel, quotas and notifications; canonical domain owners continue to own payment, provider, execution and evidence state.

## Endless-capability rule

A new pain point should first be mapped onto existing skills, capabilities, actors, objects, lifecycle states, evidence, execution and presentation surfaces. A new canonical owner is justified only when the semantics cannot be represented safely by existing primitives.

Do not create a vertical subsystem simply because a new use-case appears.

## Safety and truth

Capability composition does not grant execution authority. Interaction policy, exact owner/object identity, authentication, confirmation, idempotency and external activation remain enforced at the canonical execution boundary.

Repository readiness, development simulation and real external execution remain separate states.

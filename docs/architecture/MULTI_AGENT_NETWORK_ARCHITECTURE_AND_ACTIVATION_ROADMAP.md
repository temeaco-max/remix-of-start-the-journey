# Kurukoo Multi-Agent Network Architecture and Activation Roadmap

**Status:** Repository-side target architecture and activation plan
**Date:** 18 August 2026
**Scope:** Bridge the current canonical Chat, Brain, agent, network and Economic Request foundations to a production-operated multi-agent fulfilment network.

## Product target

Kurukoo is a **conversational operating system for coordinating everyday intentions with people, services, products, places and bounded agents**. The system may help directly, preserve context, discover options, coordinate participants, prepare an Economic Request or continue work over time. External fulfilment remains conditional on availability, authorization, evidence, configured providers and real-world confirmation.

The target is not a second Chat engine or a giant autonomous model that owns state. The target is one conversational control surface connected to canonical domain services through typed, auditable plans.

## Current baseline

The repository already contains the essential control-plane pieces: `canonicalChatTurnService`, context arbitration, deterministic/FastText routing, `unifiedAiEngine`, local SmolLM2 boundaries, memory provenance, notification queues, Economic Requests, discovery and opportunity foundations, provider evidence, bounded `agentRuntime`, `internalCoordinator`, feature flags and external-adapter seams. These are meaningful foundations, but they are not equivalent to an activated provider network, production settlement system, delivery operation or live external channel.

The current deployment remains a single-process `sql.js` architecture. That is suitable for local proving and bounded repository validation. Production operation requires durable storage, background-worker hosting, observability, secrets management, rate limits, queue durability, provider contracts, data retention decisions and operational ownership.

## Target logical architecture

```text
User / channel / device
        |
        v
Conversation gateway
  - identity and trust context
  - channel evidence
  - request correlation
        |
        v
canonicalChatTurnService
  - priority and safety policy
  - bounded working context
  - exact object/action preservation
        |
        v
Brain / context arbitration
  - conversation vs capability
  - interruption and resumption
  - context stack selection
  - executable plan proposal
        |
        +--------------------------+
        |                          |
        v                          v
Deterministic routing          unifiedAiEngine
FastText / intent aliases      SmolLM2 or approved hosted provider
        |                          |
        +------------+-------------+
                     v
Universal capability protocol
  - typed inputs
  - permission/risk
  - consent/confirmation
  - lifecycle/evidence
  - activation/external dependency
                     |
                     v
Canonical domain services
  Memory | Tasks | Reminders | Notifications | Discovery | Presence
  Agents | Economic Request | Provider | Product | Cart | Payment
  Channels | Trust | Evidence | Dispatch | Connected resources
                     |
                     v
Execution coordinator
  - policy-approved plan steps
  - idempotency and retries
  - budgets and concurrency
  - pause/resume/cancel
  - human confirmation gates
                     |
                     v
External adapters and network participants
  WhatsApp | Telegram | SMS | Email | FCM | Voice | Payment
  Provider systems | Inventory | Dispatch | Maps | WebRTC | MQTT
                     |
                     v
Evidence and outcome projection
  - accepted / waiting / needs-user / blocked / failed
  - externally-pending / completed only with evidence
  - notification and conversation continuation
```

## Typed control-plane contracts

Every cross-service action should travel as an immutable, traceable plan rather than an unstructured model instruction.

| Contract | Required fields | Owner |
|---|---|---|
| `ConversationTurn` | `conversationId`, `actorId`, `channel`, `message`, `activeContexts`, `trustState`, `locale` | `canonicalChatTurnService` |
| `ContextDecision` | `selectedContext`, `preservedContexts`, `reason`, `confidence`, `requiresClarification`, `exactObjectRefs` | Brain/context arbitration |
| `CapabilityPlan` | `planId`, `capability`, `steps`, `risk`, `permissions`, `consent`, `confirmation`, `budget`, `activation` | universal capability protocol |
| `PlanStep` | `stepId`, `canonicalOwner`, `inputRefs`, `dependsOn`, `idempotencyKey`, `timeout`, `retryPolicy` | execution coordinator |
| `CapabilityResult` | `status`, `canonicalObjectRef`, `evidence`, `nextAction`, `resumeTarget`, `externalDependency`, `failureCode` | canonical service |
| `AgentGoal` | `goalId`, `ownerId`, `objective`, `scope`, `allowedTools`, `budget`, `schedule`, `pauseState`, `riskClass` | `agentRuntime` |
| `ProviderEvidence` | `source`, `providerRef`, `claim`, `capturedAt`, `freshness`, `verificationState`, `scope` | provider/evidence boundary |
| `NetworkEvent` | `eventId`, `type`, `actor`, `objectRef`, `occurredAt`, `visibility`, `provenance` | event/audit boundary |

The model may propose a plan, but it must not directly mutate these contracts. Canonical services remain the owners of authorization, state transition, evidence and external execution.

## Multi-agent operating model

Kurukoo should use **specialized bounded agents**, not a collection of independent assistants. Every agent reuses the same Brain, capability protocol, memory boundary, notification authority and execution coordinator.

| Agent role | Responsibility | Never owns |
|---|---|---|
| Conversation Agent | Natural dialogue, clarification and context continuity | Canonical state mutation or payment |
| Request Coordinator | Break an Economic Request into approved steps and monitor progress | Provider truth or settlement evidence |
| Discovery Agent | Query source-attributed discovery and opportunity entities | Provider verification or availability claims |
| Provider Liaison | Request availability, quotes or confirmation through approved channels | Identity verification or payment release |
| Fulfilment Monitor | Track accepted steps, timeouts, dispatch and completion evidence | Fabricating completion |
| Personal Continuity Agent | Reminders, memory proposals, resumption and notification wording | Retention decisions or safety escalation |
| Trust and Safety Agent | Detect risk, require consent and route emergency policy | Replacing canonical emergency services |
| Operations Agent | Summarize queues, exceptions, readiness and audit signals for staff | Self-approving campaigns, evidence or refunds |

## Activation roadmap

### Milestone 0 — Repository truth and production boundary

**Outcome:** The repository clearly distinguishes implemented, feature-flagged, provider-dependent, foundation-only and externally activated capabilities. Homepage, Blueprint, admin and Chat copy use the same qualification language.

**Exit evidence:** build/lint pass; route, security, PWA, accessibility and CSS audits pass; feature-flag registry is documented; no UI claims external success without evidence; production configuration and secrets checklist exists.

### Milestone 1 — Durable control plane

**Outcome:** Move canonical user/application state from process-local `sql.js` to durable production storage, while retaining a local proving mode. Add durable jobs, queue ownership, idempotency, dead-letter handling, audit retention and structured telemetry.

**Exit evidence:** restart-safe Chat continuity, durable notification/task/agent jobs, bounded retries, replay-safe capability plans, migration and backup/restore runbook, queue and database alerting.

### Milestone 2 — Trust, identity and channel activation

**Outcome:** Establish guest, account, trusted device, email, phone and linked-channel evidence as separate states. Activate one external channel at a time, beginning with the lowest operational risk and strongest delivery observability.

**Exit evidence:** provider credentials in managed secrets, verified callback/webhook, consent and retention review, delivery and failure evidence, abuse/rate-limit controls, admin readiness view and user-facing truthful state.

### Milestone 3 — Provider and discovery liquidity

**Outcome:** Onboard a bounded pilot cohort of real providers and discovery sources. Keep discovered entities separate from claimed providers until evidence supports the lifecycle transition.

**Exit evidence:** source provenance, freshness, availability capture, provider claim/onboarding, verification workflow, approximate-location privacy, invitation attribution, response SLAs and exception handling.

### Milestone 4 — Economic Request execution

**Outcome:** Operate one narrow request category end to end: capture → matching → quote → confirmation → payment boundary → fulfilment → evidence → dispute/cancellation → memory/continuation.

**Exit evidence:** real provider and inventory evidence, payment provider test and production modes, webhook verification, refund/dispute process, reconciliation, operator escalation and user-visible outcome proof.

### Milestone 5 — Bounded autonomous goals

**Outcome:** Allow selected first-class agents to monitor and advance approved goals under budgets, schedules, tool allowlists and explicit pause/confirmation policy.

**Exit evidence:** owner-scoped goal controls, step-level audit, pause/resume/cancel, retry budgets, notification policy, human escalation, cost ceiling, adversarial tests and production operator kill switch.

### Milestone 6 — Multi-agent network scale

**Outcome:** Add more providers, categories, channels and agent roles without creating parallel routers, memories, payment engines or Chat surfaces.

**Exit evidence:** capability registry coverage, cross-agent plan composition, tenant/role isolation, load/soak testing, provider SLA monitoring, regional configuration, localization, incident response and cost controls.

## Activation gate matrix

| Capability | Repository state | Activation requirement |
|---|---|---|
| Web Chat | Active canonical channel | Production hosting, durable state and operational monitoring |
| Local SmolLM2 | Repository-proven, optional | Resource benchmark, model cache strategy and deployment review |
| Hosted AI | Provider-neutral adapter | Key, privacy/retention decision, quota/cost policy and independent validation |
| Mistral voice/transcription | Adapter/readiness boundary | Key, model access, audio privacy review and real request validation |
| WhatsApp/Telegram/SMS/USSD | Channel seams and tests | Provider account, verified callbacks or linked-device security review, delivery evidence |
| FCM/push | Internal queue and token boundary | Firebase credentials, device registration, permission and physical-device delivery proof |
| Payments | Sandbox/request boundaries | Production keys, signed webhooks, settlement, refund and dispute evidence |
| Provider network | Discovery/opportunity/provider lifecycle | Real participant onboarding, evidence, availability and fulfilment operations |
| Private-number masking | Local proxy foundation | Routable telephony provider, legal/privacy review and call/SMS evidence |
| WebRTC | Signalling foundation | Approved relay/STUN/TURN, consent, browser interoperability and operations |
| MQTT/IoT | Connected-resource foundation | Broker, secure identity, durable state sync and device operations |

## Production-readiness definition

Kurukoo is **repository-side ready for external activation** when the canonical services, adapters, feature flags, failure paths, readiness telemetry, admin controls, documentation and tests are complete. It is **production-activated** only after the relevant provider, infrastructure, legal, privacy, operational and real-world evidence gates have been independently satisfied. These statuses must not be conflated in the UI, roadmap or investor material.

## References

1. [Current product truth](./CURRENT_PRODUCT_TRUTH.md)
2. [Blueprint truth index](./BLUEPRINT_TRUTH.md)
3. [Active agent boundaries](./ACTIVE_AGENT_BOUNDARIES.md)
4. [Capability matrix](./CAPABILITY_MATRIX.md)
5. [Kurukoo OS surface screen-set handoff](../design/kurukoo-os-surface-screen-set-handoff.md)

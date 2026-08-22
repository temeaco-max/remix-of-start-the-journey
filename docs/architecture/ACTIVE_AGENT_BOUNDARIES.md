# Kurukoo Active Agent Boundaries

This file prevents parallel agents from pulling the platform architecture in conflicting directions.

## Locked product principle

Kurukoo Chat is the conversational operating layer. Natural language is the primary UI. Skills/capabilities are canonical functions beneath the conversation.

## Conversational intelligence owner

`src/services/conversationalGenerationService.ts` is the canonical conversational generation boundary.

Ordinary Chat uses generation mode `generate`.

Seeded/canonical responses are only valid for explicit `present` or `deterministic` modes.

Do not reintroduce router-authored/canned responses as the primary ordinary-chat experience.

## Brain/context owner

`contextArbitration` decides conversational relationship and protects active contexts. It does not generate user-facing prose and does not mutate domain state.

## Semantic dispatch owner

`intentRouter` is a semantic/capability dispatcher and legacy deterministic fallback. It is not the conversational response owner.

Existing explicit skill/action branches remain canonical until deliberately consolidated.

## State and execution owners

Canonical domain services own:

- identity/authentication;
- memory persistence;
- Economic Requests;
- providers/discovery;
- products/orders/cart;
- reminders;
- subscriptions/billing;
- Points/referrals/QR;
- agents and goal state;
- payment/escrow;
- execution;
- evidence;
- notifications;
- safety;
- external integration boundaries.

The model never becomes the source of truth for these.

## Model layer

`unifiedAiEngine` remains the provider-neutral model execution boundary.

Local SmolLM2, hosted Mistral/Gemini/Groq and future compact/student models all use the same Kurukoo conversational contract.

Model choice must be based on quality/cost/latency/resource evidence.

## UI

Cards/actions are presentation/control surfaces within the conversation. They are not separate conversation modes.

## Multi-agent working rule

Before editing a shared conversational file:

1. re-read the latest `main` version;
2. preserve newer work already present;
3. make the smallest coherent change;
4. do not recreate parallel logic;
5. record architectural changes in the relevant contract document.

When workstreams overlap, consolidation wins over duplicate implementation.

## Current deliberate workstream separation

### Conversational/model work

Owned by the conversational intelligence implementation and evaluation track:

- conversation generation;
- model arbitration;
- SmolLM2/Mistral evaluation;
- trajectory generation;
- conversational quality;
- context/reference handling.

### Operations/readiness work

Can proceed independently:

- deployment/runtime readiness;
- health/readiness;
- worker reliability;
- backups/recovery;
- cost ceilings;
- infrastructure security;
- production configuration;
- observability.

### Product/domain work

Can proceed when it uses existing canonical owners and does not change the conversation contract:

- provider/external activation;
- content/Topics;
- discovery data;
- referrals/Points;
- market/locale configuration;
- UI implementation;
- admin/control surfaces.

## Refactoring rule

Do not rename or remove a component solely because its name no longer perfectly describes its logical role if doing so would destabilize active work.

Prefer repurposing and documenting the role first. Perform disruptive renames only when all callers can be migrated coherently in one controlled change.


## Whole-system proving status — 17 August 2026

The bounded agent runtime remains the sole owner of long-running agent goals. The interaction policy now classifies agent control actions before ordinary routing; pause, resume and cancel resolve the exact owner-scoped goal and do not use recency to substitute another goal. Ordinary conversation can pivot away from a goal and later resume it through preserved conversation, goal and canonical-object identity.

The whole-system proving pass verified persistent owned goals, idempotency, bounded tools, waiting and worker re-entry, cancellation, disabled mode, high-risk denial, natural-language pause/resume/cancel, and no duplicate runtime. Background execution remains quota-, feature-flag-, evidence- and notification-bounded. A model proposal cannot mutate goal state directly, and no external completion is claimed without canonical evidence.

## Canonical external-agent coordination foundation — 22 August 2026

Kurukoo now has a **minimal, provider-neutral foundation** for treating an authorized external software agent as a future execution participant. This is not an external-agent marketplace, a second agent runtime, an external dispatch integration, or a claim of live interoperability. Kurukoo remains the authority for identity, Memory, conversation, authorization, Economic Request lifecycle, payment, canonical state, evidence truth, and continuation.

### Canonical contract

`src/services/externalAgentContract.ts` defines the versioned `kurukoo.external-agent/v1` manifest and callback contracts. The manifest represents a stable participant identifier, protocol/version and replaceable transport, declared capabilities and actions, required inputs/expected outputs, availability/constraints, cost model, authentication method, callback or polling capability, and privacy/security restrictions. The same contract can be placed behind HTTP, a signed webhook, MCP, or another business API without changing canonical request semantics.

The contract is deliberately narrow. Its strict validator rejects unknown fields, requires signed webhook declarations, enforces `delegationAllowed: false`, limits sizes and collections, accepts only structured scalar evidence metadata, and does not contain a general instruction field. A declaration expresses **what an agent says it can do**; it does not prove that the participant is trusted, that an action ran, or that an outcome is true.

| State | Canonical meaning | What it does not mean |
| --- | --- | --- |
| `capabilityDeclared` | A manifest lists a capability and constraints. | The participant is verified or available for execution. |
| `agentVerified` | The existing provider-verification lifecycle has marked the software-service identity verified. | A capability, request, callback, or outcome has been verified. |
| `actionExecuted` | A canonical execution record has advanced through the existing connector lifecycle. | A reported completion is a verified result. |
| `outcomeVerified` | A canonical reviewer has accepted the relevant evidence. | External software self-attestation. |

### Discovery, authority, and execution

`src/services/externalAgentCoordination.ts` provides a small registry and discovery projection. Discovery returns declared capabilities, constraints, availability, required inputs, expected outputs, cost model, protocol, and trust state while keeping `capabilityDeclared`, `agentVerified`, `actionExecuted`, and `outcomeVerified` explicitly separate.

Authorization is an owner-scoped, request-scoped grant. It is bounded by participant, capability, declared action, expiry, optional spending ceiling/currency metadata, mandatory human-approval boundary, revocation, and a fixed delegation depth of zero. It fails closed if the Economic Request owner, participant identity, declared capability/action, verification state, connector authorization, or grant state does not match. The spending ceiling is only a future authorization constraint; this foundation creates **no payment instruction, payment system, or settlement path**.

For economic coordination, preparation adds the selected software service as the existing `external_platform` Economic Request participant and creates an existing `ExecutionRequestRecord` through `executionConnector.ts`. It never becomes the escrow recipient, request owner, or a second request lifecycle. For non-economic work, a future adapter must continue to route through the registered canonical capability/execution boundary rather than this foundation creating a task engine.

```text
User authority + Kurukoo policy
              ↓
Canonical Economic Request or capability execution boundary
              ↓
Existing provider verification + explicit connector authorization
              ↓
External-agent authorization grant (scoped, expiring, revocable)
              ↓
Existing ExecutionRequestRecord (idempotency + correlation)
              ↓
Authorized transport adapter in a future activation
              ↓
Structured progress/evidence claim
              ↓
Canonical evidence review and Kurukoo continuation
```

### Callback and evidence boundary

The callback processor accepts only a **previously transport-authenticated** structured callback. It is not an HTTP endpoint and does not implement a live connector, signature verifier, polling worker, secret store, or webhook listener. A future transport adapter must authenticate the sender before it invokes the processor.

Callbacks are bound to participant, execution, correlation ID, authorization, and action scope. They use event ID and payload hashing plus execution/idempotency-key receipts to reject replays, altered duplicate events, and duplicate callbacks. `accepted`, `rejected`, `in_progress`, and `failed` map only through legal transitions of the existing execution lifecycle. A `completion_claimed` callback records `unverified_participant` evidence with `pending_review`; it keeps the execution in progress. `executionConnector.ts` now requires a reviewer-verified `external_agent_completion_claim` before an external-agent execution can transition to `succeeded`.

> **External claim is not verified outcome.** An external participant can report progress or completion evidence, but only the canonical evidence-review boundary may validate that evidence and permit a succeeded execution state.

### Reused canonical primitives

| Foundation concern | Reused Kurukoo primitive | Reuse decision |
| --- | --- | --- |
| Conversational authority and continuation | `agentRuntime.ts`, canonical conversation/context arbitration, notification continuation | No second runtime, conversation, or Memory model. |
| Capability discovery and action vocabulary | `universalCapabilityProtocol.ts`, capability registry, canonical capability executor | External declarations complement rather than replace canonical capability validation. |
| Participant identity and verification | `memory_profiles`, `providerEntity.ts`, `providerVerificationLifecycle.ts` | Software services use the existing provider entity and verification lifecycle; no agent identity system was added. |
| Economic request and participant membership | `skillFlows.ts`, `economicParticipants.ts` | The external participant is represented as the existing `external_platform` role on the existing Economic Request. |
| Dispatch, correlation, idempotency, and transport | `executionConnector.ts`, `provider_execution_connectors` | The external-agent foundation creates the existing execution record and requires separately authorized connectors. |
| Evidence and completion truth | `ExecutionEvidence`, `recordExecutionEvidence`, `reviewExecutionEvidence` | Claims remain pending review; verified evidence is required before external-agent success. |
| Privacy and communication | existing privacy bridge and canonical communication/notification boundaries | No direct external contact sharing or new communication stack. |

### Security red team findings and controls

| Threat | Foundation control | Remaining activation requirement |
| --- | --- | --- |
| Forged participant identity | Stable participant-to-existing-provider binding; verified provider lifecycle; connector authorization. | Real transport credential onboarding and independent identity verification. |
| Replay or duplicated callback | Event receipt hash, unique execution/idempotency receipt, idempotent evidence ID. | Transport nonce/signature verification by the future adapter. |
| Stale credentials or authority | Expiring, revocable, owner- and request-scoped grants; connector revocation already fails closed. | Credential rotation and secret custody in a production adapter. |
| Unauthorized capability escalation | Manifest action allowlist, grant action allowlist, participant verification, existing connector authorization. | Connector-specific least-privilege scope review. |
| Malicious agent instructions or prompt injection | Strict allowlisted fields; structured evidence only; no generic instruction field; no direct model or state mutation path. | Content scanning and domain-specific artifact validation where future adapters ingest files. |
| Callback forgery | Processor refuses unverified transport and requires exact participant/execution/correlation binding. | Signed webhook, mTLS, or OAuth verification at the adapter ingress. |
| Data exfiltration | Privacy/security declaration, existing privacy bridge, no raw credential transport in this contract. | Data minimization review and production retention enforcement per connector. |
| Payment abuse | No payment action is created; grant ceiling is metadata only; canonical payment/escrow controls remain separate. | Separate payment approval and regulated provider activation. |
| Infinite loops or recursive delegation | Maximum delegation depth is permanently zero; no worker or recursive dispatch loop is introduced. | Per-adapter rate limiting and operational quotas before live activation. |
| False completion claim | Completion is evidence pending review, and succeeded state is blocked until canonical evidence review. | Human/automated review policy tailored to the external domain. |

### Focused verification

`npm run test:external-agent-foundation` covers capability discovery, the distinction between declaration and verification, participant authentication precondition, request ownership, authorization scope, mandatory confirmation, declared-action rejection, idempotent execution creation, progress, completion claim, evidence submission/review, duplicate callback protection, revocation, expiry, recursive-delegation rejection, and malformed/instruction-like payload rejection. It uses only the existing deterministic dummy connector and a simulated participant; it does not connect to any real external agent.

| Verification surface | Status | Basis |
| --- | --- | --- |
| Repository | **VERIFIED** | Strict TypeScript compilation and deterministic foundation regression coverage. |
| Runtime | **PARTIAL** | The same local execution/verification/evidence boundaries are exercised with the existing dummy connector only. |
| Real-world interoperability | **UNVERIFIED** | No external agent, credential, webhook ingress, polling service, physical system, or production connector was configured. |

No obsolete or duplicate agent runtime, request lifecycle, identity, communication, payment, or notification code was discovered in this foundation pass. No permanent branch is part of this work.

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

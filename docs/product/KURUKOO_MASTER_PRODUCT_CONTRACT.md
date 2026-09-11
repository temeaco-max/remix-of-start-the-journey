# Kurukoo Master Product Contract

Status: LOCKED — 2026-09-11
Owner: Kurukoo product + engineering

## Product definition

**Kurukoo — AI that gets things done.**

Primary user mental model:

> Tell Kurukoo what needs doing.

Kurukoo is a personal execution layer that can coordinate digital execution, physical execution, or a hybrid of both. The network is infrastructure; it is not the consumer-facing definition.

## Non-negotiable product loop

**Tell → Understand → Find/Plan → Choose → Approve → Do → Show proof → Done**

Execution routes:

- Digital: Tell → Understand → Plan → Access → Act → Verify → Done
- Physical: Tell → Understand → Discover → Compare → Approve → Coordinate → Fulfil → Verify → Done
- Hybrid: Tell → Understand → Plan → Digital + Physical execution → Coordinate → Verify → Done
- User-assisted: Tell → Understand → Prepare → Ask user → User acts → Continue → Verify

Kurukoo must never claim completion without a truthful completion state and available evidence when evidence is expected.

## Execution resources

Providers are one execution resource, not the fundamental product unit. Execution resources may include:

- people and local professionals;
- businesses and inventory;
- websites, browser workflows and APIs;
- connected apps and accounts;
- Kurukoo agents and approved third-party agents;
- communication channels;
- logistics and other physical infrastructure;
- devices and future robotics/IoT integrations.

The internal model is:

**Intent → Context → Capability → Execution resource → Consent → Action → Evidence → Outcome → Memory/Trust**

## Six product surfaces

1. **Assist** — conversation-first control surface.
2. **Discover** — people, providers, businesses, products, places, services, opportunities, information, creators and agents.
3. **Execute** — digital agents, browser automation, providers, businesses, communication and transactions.
4. **Work** — everything Kurukoo is currently doing, waiting on, or has completed for the user.
5. **Memory** — user-controlled continuity, preferences, relationships and ongoing intentions.
6. **Trust** — identity, permissions, approvals, evidence, reputation, transaction history, audit and disputes.

Existing Home, Explore, Nearby, Topics, Opportunities, Providers, Businesses, Creators, Agents, Activity, Wallet, Points, Resources and other surfaces are capabilities within these layers, not separate product identities.

## Global core / local execution

The core model is global:

- conversation;
- intent and context;
- planning;
- memory;
- permissions and consent;
- Work state;
- agent runtime;
- evidence;
- trust;
- execution graph.

Country/region adapters provide local execution mechanisms: payments, identity, language, providers, logistics, communications, government systems and regulation.

Nigeria is an execution environment, not the definition of the product. The same core must be deployable in the UK, Ghana, US, India and other markets without forking the product model.

## Frontend/backend lock

From this date, every user-facing capability is implemented as a paired vertical slice:

**Frontend surface → canonical backend capability → persistence/state → execution → evidence → UI outcome**

No frontend-only fake flows are accepted as complete. No backend-only capability is considered product-complete without an appropriate user surface.

The frontend repository is `temeaco-max/remix-of-start-the-journey` and the canonical backend repository is `temeaco-max/kurukoo`. `main` is the integration truth for both repositories.

## Truth rules

Never fabricate:

- providers;
- availability;
- pricing;
- payments;
- external integrations;
- agent actions;
- completion evidence;
- rankings or metrics.

Preview/demo data must be explicitly represented as such.

## UX rule

Users should experience one Kurukoo, not its architecture. Internal concepts such as Economic Request, execution graph, capability protocol, evidence gate and provider taxonomy remain implementation concepts unless a status explanation genuinely helps the user.

The frontend should be judged by one question:

> Does this surface help the user move from intention to outcome?

## Build rule for today's completion push

Work is organised by outcome verticals, and each vertical includes both frontend and backend work in the same implementation cycle:

1. conversational request;
2. understanding/context;
3. discovery or planning;
4. option presentation;
5. consent;
6. execution/coordination;
7. evidence;
8. Work/Activity state;
9. recovery/escalation;
10. tests and truthful empty/error states.

Do not spend implementation cycles creating architecture documents instead of user-visible capability. Contracts are guardrails; the product is the working vertical slice.

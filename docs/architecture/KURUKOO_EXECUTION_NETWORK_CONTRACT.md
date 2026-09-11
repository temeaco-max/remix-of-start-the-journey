# Kurukoo Execution Network Contract

**Status:** Active implementation contract — September 2026
**Product definition:** Kurukoo is the execution network for people and AI.
**Consumer promise:** AI that gets things done.
**Internal principle:** Turn legitimate requests into verified outcomes using the best available software, AI, people, providers, services and connected resources.

## 1. Product boundary

Kurukoo is not defined by a model, app, agent, marketplace, provider directory, or individual vertical. Those are implementation means. The canonical product object is a **request-to-outcome journey**.

The user experience is intentionally simple:

`ASK → DECIDE → DONE`

The service internally composes:

`UNDERSTAND → CONTEXT → PLAN → DISCOVER → MATCH → QUOTE/NEGOTIATE → CONSENT → EXECUTE → EVIDENCE → OUTCOME → REMEMBER`

No user-facing surface should require knowledge of this internal sequence unless the user needs that information to make a decision or understand a failure.

## 2. Canonical execution model

Every consequential journey must preserve these facts:

- exact request/context identity;
- owner and authorization scope;
- requested outcome;
- capabilities and providers considered;
- current lifecycle state;
- user consent/confirmation where required;
- external dependency state;
- execution identity and idempotency;
- evidence provenance;
- outcome/verification state;
- next permitted action;
- failure, recovery and dispute state.

Kurukoo must never convert an internal record, estimate, memory fact, model output, provider profile, or illustrative UI object into a claim that an external event happened.

## 3. The 39 execution-network pillars

The following pillars are now the canonical implementation checklist. Existing Kurukoo services are reused first; each pillar is either implemented, plumbed through an existing owner, or explicitly blocked only by an external activation dependency.

| # | Pillar | Canonical owner / reuse | State |
|---|---|---|---|
| 1 | Provider-neutral execution | `skillFlows`, `universalCapabilityProtocol`, Economic Requests | PLUMBED |
| 2 | Human + AI execution | providers, agents, physical participants, execution services | PLUMBED |
| 3 | Provider network | provider discovery, verification, Economic Requests | PLUMBED |
| 4 | Open provider model | provider/capability portfolio and onboarding boundaries | PLUMBED |
| 5 | Demand/supply coordination | Economic Requests + discovery + opportunity feed | PLUMBED |
| 6 | Execution graph | request → participant → execution → evidence lifecycle | PLUMBED |
| 7 | Outcome-oriented execution | outcome context/completeness + Economic Request lifecycle | IMPLEMENTED |
| 8 | Evidence-first completion | execution evidence + outcome completeness | IMPLEMENTED |
| 9 | Execution reputation | trust/provider verification/review surfaces | PLUMBED |
| 10 | Negotiated fulfilment | offer/quote/selection boundaries | PLUMBED |
| 11 | Multi-party orchestration | Economic participants + execution requests | IMPLEMENTED |
| 12 | Offline-world state | presence/physical execution participant boundaries | PLUMBED |
| 13 | Geography-native execution | discovery/location/nearby pulse | IMPLEMENTED |
| 14 | Africa-native execution | channels, provider model, local execution adapters | PLUMBED |
| 15 | Multi-channel execution | canonical channel registry + channel adapters | IMPLEMENTED |
| 16 | Identity-minimised context | canonical identity + owner-scoped memory/context | IMPLEMENTED |
| 17 | Model-independent intelligence | AI adapters + canonical capability layer | IMPLEMENTED |
| 18 | Agent-of-agents | agent runtime + delegation + capability registry | IMPLEMENTED |
| 19 | Execution API | canonical capability action boundary + MCP boundary | PLUMBED |
| 20 | Universal execution protocol | universal capability protocol | IMPLEMENTED |
| 21 | Capability-not-app abstraction | atomic capabilities + skill composition | IMPLEMENTED |
| 22 | Provider competition | discovery + offer/selection model | PLUMBED |
| 23 | Opportunity engine | evidence-backed proactive opportunity feed | IMPLEMENTED |
| 24 | Provider OS | provider operations, communication, work and payout boundaries | PLUMBED |
| 25 | Outcome-learned capabilities | evidence/outcome history + trust boundaries | PLUMBED |
| 26 | Economic neutrality | provider-neutral matching and canonical request ownership | PLUMBED |
| 27 | Execution-native advertising | advertising is separate from canonical fulfilment authority | PLUMBED |
| 28 | Contributor network | contributor/task/reward system | PLUMBED |
| 29 | Assistance + marketplace convergence | native assistance + Economic Requests | IMPLEMENTED |
| 30 | Transaction trust | authorization, verification, evidence, audit, dispute | IMPLEMENTED |
| 31 | Outcome protection | failure/recovery/dispute boundaries; guarantees remain future external activation | PLUMBED |
| 32 | Cost-adaptive intelligence | model router, FastText/local models, hosted adapters | IMPLEMENTED |
| 33 | Event-driven execution | events, durable jobs, background services | IMPLEMENTED |
| 34 | Economic Request primitive | canonical Economic Request lifecycle | IMPLEMENTED |
| 35 | Beyond personal AI | shared execution network across people, providers and agents | PLUMBED |
| 36 | Cross-agent interoperability | MCP + canonical capability action boundary | PLUMBED |
| 37 | Progressive-disclosure UX | Chat-first entry + Work/Activity supporting surfaces | IMPLEMENTED |
| 38 | Execution-network effects | provider/demand/outcome graph foundations | PLUMBED |
| 39 | Provider-consumer dual network | consumer requests + provider operations | PLUMBED |

`PLUMBED` means the concept has a canonical owner and an existing integration path; it does **not** mean every external dependency is live. External activation must remain truthful.

## 4. Required lifecycle

For an execution-capable request, the canonical state model is:

`requested → understanding/clarifying → awaiting_match → matched/quoted → awaiting_confirmation → accepted → executing → evidence_pending → completed`

Permitted alternate terminal/recovery states include:

`cancelled`, `failed`, `disputed`, `abandoned`, `unavailable_external_dependency`, `waiting`.

A request may return to a safe waiting/recovery state without creating a duplicate economic object or external effect.

## 5. Network entities

Kurukoo should converge on these interoperable entities rather than creating vertical-specific execution engines:

- **Request** — what the person or authorized agent wants accomplished.
- **Capability** — something that can contribute to accomplishing it.
- **Provider** — a person, business, service, agent, or other authorized execution participant offering a capability.
- **Offer** — a concrete proposed route, price, timing, terms, or availability statement.
- **Consent** — the user's authorization for a consequential action.
- **Execution** — the canonical action/dispatch record.
- **Evidence** — provenance-bearing proof or state observation.
- **Outcome** — the result of the request, distinct from an agent task being completed.
- **Opportunity** — evidence-backed demand/supply coordination that may create a useful next action.

## 6. Interoperability rule

Any AI, client, channel, provider console, or future partner should be able to enter the same canonical execution lifecycle without becoming a new source of truth.

The preferred integration contract is:

1. discover capability;
2. create or resolve exact request context;
3. inspect eligible options;
4. request consent where required;
5. invoke the canonical owner with idempotency;
6. observe lifecycle/evidence;
7. return a truthful outcome;
8. expose recovery/dispute actions when necessary.

MCP and other adapters are transport/integration mechanisms. They must not bypass authorization, payment, evidence, or canonical state ownership.

## 7. Activation truth

The repository is allowed to be execution-ready before every external network is active. The UI and APIs must distinguish:

- `locally_available`
- `repository_ready_external_activation`
- `externally_active_and_verified`
- `unavailable_external_dependency`
- `intentionally_unsupported`

A provider profile is not proof of provider availability. A quote is not a payment. A payment record is not proof of fulfilment. A model response is not evidence of an external action.

## 8. Testing target

The first complete controlled-pilot journey should be:

`natural-language request → canonical request → real/curated eligible option → user selection → consent → provider/execution boundary → response/evidence → truthful outcome → persisted continuity`

The same contract must also support a deliberately unavailable route:

`request → no eligible execution path → deferred/waiting state → user-visible next action → later re-evaluation`

This is the minimum testable expression of the Execution Network thesis.

## 9. Implementation rule

Do not create a second provider engine, request lifecycle, memory authority, agent runtime, notification system, payment authority, discovery engine, or execution engine to satisfy one of these pillars. Extend the existing canonical owner and expose the capability through the universal capability protocol.

## 10. Strategic position

Kurukoo should be able to work with or underneath any personal AI. The long-term target is not to require every person to choose Kurukoo as their only assistant. The target is for an AI or person to be able to say:

> **“Make this happen.”**

and for Kurukoo to resolve the legitimate path to the outcome.

That makes Kurukoo an execution network rather than another model wrapper.

# Kurukoo Build & Convergence Contract

**Status:** canonical implementation direction
**Scope:** applies to all Kurukoo work from this point forward
**Canonical source branch:** `main`

## 1. Product objective

Kurukoo is being built to solve legitimate real-world problems to meaningful outcomes, not to accumulate independent features.

The user should be able to communicate an objective in ordinary language and have Kurukoo:

1. understand what the user is trying to accomplish;
2. determine what information, people, businesses, providers, products, agents, channels or external services are required;
3. use existing canonical capabilities and skills to coordinate the work;
4. obtain consent, authorization, payment or human review where required;
5. execute only through canonical owners and activated integrations;
6. present useful choices, status, evidence and next actions through the common Chat/UI protocol;
7. continue, recover, remind, notify or escalate when the work is long-running or encounters an obstacle;
8. report a truthful outcome or a truthful boundary when completion is not currently possible.

The architecture is the product advantage. The system should absorb complexity so the user does not have to understand Kurukoo's internal subsystems.

## 2. Build principle

> **Connect before creating. Repair before replacing. Reuse before duplicating. Build only when a genuine capability gap exists.**

A proposed change must first be classified as:

- already implemented and usable;
- implemented but disconnected;
- implemented but incomplete or incorrect;
- represented architecturally but awaiting implementation;
- externally dependent and awaiting activation;
- genuinely missing and necessary; or
- unnecessary/redundant and therefore a candidate for removal or repurposing.

A feature must not be added merely because a new user scenario can be named. The question is whether the existing capability model can express and complete the scenario.

## 3. Outcome-first composition

A real-world problem may cross many existing Kurukoo capabilities. For example, a device repair may require diagnosis, location, provider discovery, provider communication, quote comparison, user selection, payment, collection/delivery, repair status, evidence, completion and post-completion support.

This is **one outcome composed from existing capabilities**, not a new "device repair" subsystem.

The same principle applies to food, groceries, transport, sourcing, bookings, business services, security, sports, errands, content, support and future verticals.

Vertical-specific skills may describe the domain, but the execution model remains shared:

```text
user objective
  -> conversation identity
  -> Brain/context arbitration
  -> semantic interpretation
  -> capability + skill selection
  -> clarification when necessary
  -> policy / authority / consent
  -> canonical service owner
  -> provider / product / agent / connector coordination
  -> execution and evidence
  -> user choice and confirmation where required
  -> completion / recovery / continuation
```

## 4. One operating protocol

All capabilities, skills, skill flows, actors, channels, linked devices, agents, Economic lifecycle stages and AI models must derive from the same underlying concepts:

- actor and role;
- locale/market and jurisdiction;
- channel and device surface;
- intent and entities;
- active context and relation;
- capability, skill and action;
- lifecycle state;
- authority, policy, consent and confirmation;
- evidence and truth state;
- activation/readiness state;
- response parts and presentation primitives;
- continuation, resumption and recovery;
- provenance/audit references.

No new subsystem should introduce a competing identity, conversation, memory, location/presence, wallet, request lifecycle, policy engine, transaction engine or action/UI protocol.

## 5. Chat is the universal control surface

Chat is the primary conversational control surface, not a standalone product feature. Rich web/PWA UI, linked devices and constrained channels are different presentations of the same semantic operation.

Chat should be able to:

- answer questions;
- interpret goals;
- ask for missing information naturally;
- create and manage requests;
- present selectable choices/cards;
- show providers, offers, products, locations, progress and evidence;
- collect confirmation/consent;
- coordinate multi-step work;
- resume long-running work;
- handle interruptions and topic switches;
- surface notifications and reminders;
- support posts/topics and other existing content flows;
- provide help/support and rich guidance;
- hand off to external channels or services where activated.

The AI must not invent frontend behavior. It produces bounded semantic/capability descriptors and the existing client renders them through the shared UI protocol.

## 6. AI boundary

SmolLM2 is the intended specialised Kurukoo semantic interpreter when a trained and approved artifact is available. It should understand Kurukoo's ontology, all canonical skills and skill flows, actor roles, channel constraints, lifecycle states, dialect/language variants, ambiguity, interruption, correction, recovery and truthfulness boundaries.

SmolLM2 does not become the source of truth for identity, authority, law, payment, inventory, availability, fulfilment, evidence or model promotion.

Deterministic systems remain where they provide genuine value: validation, safety/domain rules, cheap degraded operation, canonical state ownership and hard execution boundaries. Components should only be retired after measured replacement by a simpler, equally reliable path.

Training must cover the whole Kurukoo ontology rather than only the most visible consumer journeys. Every canonical skill receives actor, channel, lifecycle, normal, ambiguous, interrupted, corrective, unavailable and recovery variants, with locale/dialect coverage appropriate to the markets served.

## 7. Channels and linked devices

Web/PWA, WhatsApp, Telegram, SMS, USSD, email, voice and linked devices are transport/presentation surfaces over the canonical conversation and identity model.

A channel may have presentation constraints, but it must not create a second semantic workflow. Rich cards can degrade to numbered choices or concise text; the underlying capability, action, lifecycle and evidence remain the same.

Linked-device identity must remain evidence-backed. No synthetic identity should be created solely to make a workflow appear to work.

## 8. Discovery and network growth

Discovery is a way to surface useful, evidence-backed opportunities and local context. It is not a second request system and should not become a manually maintained directory of speculative providers.

OpenStreetMap/location data, provider presence, evidence-backed opportunities, contributors and network seeding should feed the existing Discovery/Opportunity architecture where they genuinely support user outcomes. External place data may identify a prospective business, but it must not be presented as a verified Kurukoo provider or as available for fulfilment without the appropriate evidence.

Contributor/referral flows should turn legitimate discovery into an actionable invitation/onboarding path without contaminating provider truth or inventing demand.

## 9. Localisation

Kurukoo should use one universal product architecture with market configuration rather than country-specific application trees. Locale, currency, geography, terminology, legal profile, availability and channel configuration are data/configuration concerns unless a jurisdiction genuinely requires different behaviour.

User-facing language should be short, natural, action-oriented and culturally appropriate. Internal capability names must not leak into the interface.

Dialect understanding belongs in the semantic training/evaluation layer; legal wording, currency, dates, availability and jurisdictional rules remain configuration/policy concerns.

## 10. Blueprint completeness rule

Every Blueprint capability must be traceable to the common operating protocol and to one of these states:

- **implemented and connected**;
- **implemented but needs repair/connection**;
- **repository-ready but externally inactive**;
- **architecturally specified and awaiting implementation**; or
- **superseded/repurposed/removed with a documented reason**.

A document, route, UI card, skill ID, test, feature flag or generated registry entry is not evidence that the corresponding real-world capability is complete.

Conversely, a missing page or specialised UI surface is not automatically an architectural gap if the capability is already correctly exposed through the universal Chat protocol.

## 11. Main-branch convergence

`main` is the canonical integration branch for the platform OS build.

Work should be integrated into `main` in coherent, reviewable commits. Long-lived parallel branches should not become alternative product architectures.

Existing branches/PRs are migration containers only. Before merging them, their contents must be reconciled against the current `main` architecture. Useful work should be integrated; duplicate or superseded work should be discarded; stale branches should then be closed/deleted when safe.

Do not create another feature phase or another parallel Brain/router merely because a gap is discovered.

## 12. Completion standard

The meaningful completion threshold is not "all features have a page" or "all tests pass". Kurukoo is materially converged when an arbitrary legitimate user objective can enter through the common conversation model, traverse the necessary existing capabilities and actors, produce truthful choices and actions, execute through canonical owners, and remain resumable until completion or an explicit, truthful boundary.

After that threshold, work should primarily deepen reliability, scale, localisation, accessibility, operational economics, external activation, provider/network density and execution quality rather than repeatedly inventing new architecture.

# Kurukoo Operating System — Locked Architecture Contract

**Status:** canonical architectural lock
**Purpose:** define the common operating model that all Kurukoo capabilities, skills, channels, linked devices, UI, agents, Economic lifecycle, and AI models must converge on.

## 1. Product principle

Kurukoo exposes one simple relationship to the user while internally coordinating many specialised systems. Chat is the universal conversational control surface, not a separate feature and not a replacement for canonical services.

The intended experience is:

> **Tell Kurukoo what you need. Kurukoo understands, coordinates, acts, communicates progress, handles exceptions, and continues until the matter is resolved or a truthful boundary requires the user or an authorised external party to act.**

The public experience should remain simple, direct, locale-friendly, and action-oriented. Internal architecture must absorb complexity rather than teaching users Kurukoo's subsystem names.

## 2. Locked AI principle

> **AI interprets, reasons, communicates and coordinates. Governed Kurukoo systems establish authority, permission, policy, execution, evidence and accountability.**

The model must never be the source of truth for:

- identity or authentication;
- permissions or consent;
- legal/policy eligibility;
- payment completion;
- provider availability;
- fulfilment completion;
- inventory or dispatch state;
- external delivery;
- evidence;
- audit history;
- model promotion.

AI may propose an action. A canonical owner must authorise and execute it.

## 3. Canonical runtime flow

```text
User / channel / linked device
  -> canonical conversation identity
  -> canonicalChatTurnService
  -> Brain / context arbitration
  -> semantic interpretation (SmolLM2 when available; deterministic fallbacks retained)
  -> capability + action selection
  -> policy / authority / consent checks
  -> canonical service owner
  -> execution / external connector where activated
  -> evidence + audit/provenance
  -> typed Chat capability response
  -> user action or continuation
  -> notification / reminder / agent continuation where required
```

No capability may create a parallel conversational entry point, transaction engine, memory system, policy system, or UI action protocol.

## 4. One capability model

Every capability and every skill must expose the same underlying concepts:

- actor and role;
- channel and linked-device surface;
- intent and entities;
- active context and relation;
- capability/action;
- lifecycle state;
- policy/authority requirements;
- evidence level;
- activation state;
- user-visible response parts;
- available actions;
- continuation/resumption semantics;
- failure and recovery path;
- audit/provenance requirements.

The universal Chat capability/action protocol is the presentation contract for this model.

## 5. Skills are first-class ontology, not merely routing labels

All canonical skills and skill flows must be represented in the SmolLM2 training universe with equal structural weight. A skill is not complete merely because it has an ID or route. Its actor variants, channels, lifecycle, clarification patterns, action vocabulary, failure/recovery cases, evidence boundaries and truthful-unavailable cases must be represented.

Specialised verticals may differ in business rules, but they must compose through the same capability and execution protocol.

## 6. Channels and linked devices

Web/PWA, WhatsApp, Telegram, SMS, USSD, email, voice, and linked devices are transport surfaces over the same semantic conversation and identity model. A user should not have to learn a different Kurukoo product because they changed channel.

Channel limitations may change presentation, not semantics. Rich surfaces may show cards and actions; constrained channels may render the same operation as text, numbered choices, or short confirmations.

Linked-device identity must be evidence-backed. A channel cannot create a synthetic identity merely to complete a workflow.

## 7. UI contract

Chat UI is declarative and capability-driven. The AI does not invent arbitrary frontend code. It returns typed content/action descriptors that the client renders through the shared design system.

Supported presentation primitives should include, as applicable:

- text and structured explanation;
- choice/action buttons;
- request/provider/product cards;
- media/video recommendation cards;
- location/map summaries;
- progress/status/timeline;
- forms or missing-information prompts;
- confirmation/consent surfaces;
- notification/deep-link continuation;
- error/recovery guidance;
- support/help content.

The same semantic response must degrade gracefully across channels.

## 8. Long-running work

If an outcome cannot complete synchronously, the conversation does not end. The canonical state becomes resumable and the user receives a truthful status plus supported next actions. Notifications, reminders and bounded agents resume the same context rather than creating a disconnected workflow.

## 9. Governance hierarchy

```text
Law / applicable regulation
  -> Kurukoo safety & governance policy
  -> user identity, authority and consent
  -> capability policy and risk controls
  -> canonical service invariants
  -> evidence / external result
  -> AI recommendation
```

AI never outranks policy, authorization, canonical state or evidence.

## 10. Completion definition

Kurukoo reaches the conversational operating-system threshold when arbitrary natural interleaving across memory, onboarding, safety, reminders, notifications, Economic Requests, providers, products, posts/topics, agents, Points, subscriptions, support and other canonical skills preserves contexts, chooses the correct capability, presents usable actions, executes only through canonical owners, reports truthful state, and resumes long-running work without requiring users to understand internal subsystems.

After that threshold, remaining work should primarily be implementation depth, reliability, localisation, scale, external integration and real-world activation—not repeated invention of parallel architecture.

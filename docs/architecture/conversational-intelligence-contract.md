# Kurukoo Conversational Intelligence Contract

## Purpose

Kurukoo's conversational model is the language/behaviour layer of the platform, not the authority for canonical state or real-world truth.

The model is responsible for understanding ordinary human language, maintaining conversational continuity, handling ambiguity and interruptions, deciding whether the user is exploring or explicitly asking for action, asking useful clarifying questions, proposing canonical actions, and communicating results naturally.

Canonical Kurukoo services remain authoritative for identity, permissions, consent, memory persistence, Economic Requests, provider state, availability, payment, subscriptions, Points, referrals, QR, agents, execution, evidence, notifications, safety and irreversible actions.

## Canonical turn relationship

```text
User / channel
  -> canonicalChatTurnService
  -> context arbitration
  -> conversational turn contract
  -> model arbitration
  -> local / compact / strong model
  -> canonical skill/capability/service
  -> state / evidence / execution
  -> Chat response and continuation
```

## Conversation modes

The canonical conversational decision boundary recognises:

- `conversation` — ordinary dialogue; no action is implied.
- `exploration` — user is considering, learning, comparing or discussing an option; exploration is not authorization.
- `action` — user explicitly asks Kurukoo to perform an operation.
- `reference` — user refers to an existing object/context such as “that one”, “the other guy” or “go back”.
- `clarification` — the user is asking for clarification or a missing detail must be resolved.
- `control` — the user is explicitly asking to pause, resume, cancel or otherwise control an existing goal/request.

## Conversation-first routing rule

Deterministic aliases remain available for explicit action requests and canonical domain ownership.

However, when conversational policy identifies a turn as ordinary conversation or exploration, the router must not force that turn into a deterministic economic/request flow merely because a skill alias happens to match the text.

Examples:

```text
“I'm thinking about getting a cleaner this weekend.”
-> conversation/exploration
-> natural response
-> no Economic Request created solely from the thought
```

```text
“Please find me a cleaner in Ibadan this weekend.”
-> explicit action
-> find_worker
-> existing Economic Request/provider flow
```

```text
“My phone has been acting weird since yesterday.”
-> conversation/problem exploration
-> conversational response
-> no repair request unless the user progresses to an explicit action
```

## Model contract

Each model turn receives a bounded conversational contract describing the required behaviour for that turn, including:

- model tier;
- action posture;
- protected contexts/goals;
- clarification requirements;
- context-reconciliation requirements;
- truthfulness requirements;
- natural-conversation requirements;
- reference-resolution requirements.

The same contract is used by local SmolLM2 and hosted Mistral adapters so model choice does not create different product semantics.

## Model tiers

The current architecture supports a policy-neutral hierarchy:

- local: low-cost/simple conversational work and offline/degraded operation;
- compact: normal conversational and moderately complex turns;
- strong: multi-context, deep, ambiguous or agentic conversational work.

The architecture must remain provider-neutral and must use empirical quality/latency/cost evidence before promoting a model.

## Truth boundary

A language model must never invent or imply:

- provider availability;
- provider verification;
- price/quote;
- inventory;
- payment success;
- delivery;
- execution;
- completion;
- evidence;
- reminder creation;
- subscription state;
- Points state;
- external communication;
- agent completion.

Only canonical domain services can establish those states.

## Evaluation

The repository contains:

- `test:conversation-quality`
- `test:conversation-trajectories`
- `test:conversation-turn-contract`
- `test:conversation-first-routing`
- `test:conversation-models`

The model benchmark compares configured candidates on naturalness, context preservation, action discipline and conversational quality. A benchmark result is not a claim of production suitability or live provider availability.

# Kurukoo Conversational Intelligence Contract

## Purpose

Kurukoo Chat is the conversational operating layer of the platform. Natural language is the primary user interface; skills and capabilities are the operating-system functions underneath it.

The conversational model is responsible for language and behaviour:

- understanding ordinary human language;
- maintaining conversational continuity;
- handling ambiguity, interruption, correction and relative references;
- distinguishing conversation, exploration and explicit action;
- asking the smallest useful clarification;
- proposing canonical capabilities/actions;
- planning within bounded agentic goals;
- communicating canonical results naturally.

The model is **not** the authority for canonical state or real-world truth.

Canonical Kurukoo services remain authoritative for identity, permissions, consent, memory persistence, Economic Requests, provider state, availability, payment, subscriptions, Points, referrals, QR, agents, execution, evidence, notifications, safety and irreversible actions.

## Locked canonical relationship

```text
User / channel / linked device
  -> canonical identity + conversation
  -> Brain / context arbitration
  -> conversational intelligence
  -> capability decision
      |-> ordinary conversation
      |     -> model response
      |     -> quality / repair / escalation
      |
      |-> assistance / information
      |     -> canonical content/result
      |     -> conversational presentation
      |
      \-> explicit action
            -> canonical capability/skill
            -> canonical domain service
            -> authorization / consent / payment where required
            -> execution / evidence
            -> conversational presentation + cards/actions
  -> continuation / recovery / memory
```

There is one conversational boundary, one canonical Chat turn owner, one capability/action protocol, and canonical domain services remain the state owners.

## Conversation generation modes

The universal conversational generation service has three explicit modes:

### `generate`

The model is the response author.

This is the **default for ordinary Chat**.

Examples:

- `hello`
- `how are you?`
- `I'm frustrated today`
- `my phone has been acting strange`
- `what do you think?`
- `explain that more simply`

A router-produced response is not a substitute for model generation in this mode. An optional legacy `seedResponse` may still be supplied by older callers, but it is ignored unless the caller explicitly selects `present` or `deterministic`.

### `present`

A canonical domain/service result already exists. The model may present that result naturally, but it may not invent, modify or override the supplied canonical facts.

Example:

```text
canonical provider service
-> 2 verified options, Saturday, £65 and £80
-> conversational presentation
-> cards preserve exact structured facts
```

### `deterministic`

The response is controlled wording that must not be generated or altered freely.

Use this for safety-critical, authentication, OTP, legal, payment confirmation, irreversible confirmation and other canonical system messages where exact wording/state matters.

## Conversation-first routing rule

Deterministic aliases remain available for explicit action requests and canonical domain ownership.

When policy identifies a turn as ordinary conversation or exploration, Kurukoo must not force it into a deterministic economic/request flow merely because a skill alias happens to match the text.

Examples:

```text
“I'm thinking about getting a cleaner this weekend.”
-> conversation/exploration
-> natural model response
-> no Economic Request solely from the thought
```

```text
“Please find me a cleaner in Ibadan this weekend.”
-> explicit action
-> find_worker
-> existing provider / Economic Request flow
```

```text
“My phone has been acting weird since yesterday.”
-> conversation / problem exploration
-> model response
-> no repair request until the user moves into an explicit action
```

```text
“Actually, forget the phone. Remind me tomorrow to call the repairer.”
-> context switch
-> reminder capability
-> reminder canonical service
-> original repair context preserved
```

## Natural conversation requirement

A user must be able to talk to Kurukoo without knowing its skill vocabulary.

`hello` must be allowed to become a model-authored greeting.

Casual conversation, explanation, brainstorming, emotional statements, questions and problem descriptions must not be converted into product flows unless the user actually expresses that intent.

Cards are presentation tools, not the conversation itself. They appear when a structured choice/action materially helps the user.

## Model roles

The model layer is provider-neutral.

Possible tiers include:

- **local:** SmolLM2 and other compact local models for low-cost, private, offline/degraded and high-volume work;
- **strong:** Mistral, Gemini or another configured strong conversational model for complex, multi-context, nuanced and agentic turns;
- **future student:** a Kurukoo-fine-tuned/distilled compact model trained on high-quality conversation trajectories.

The same Kurukoo conversation contract applies regardless of model provider.

Model choice is an optimization decision based on quality, latency, cost, resource requirements and availability. It must never change product truth semantics.

## Context supplied to the model

The model receives bounded conversational context, not the whole database:

- current user message;
- recent human-facing thread transcript;
- active/preserved contexts;
- paused goals;
- relevant memory;
- known facts;
- pending clarification fields;
- current market/locale/channel context where appropriate;
- canonical facts needed for presentation;
- action posture and truth requirements.

Internal IDs, secrets, private metadata and raw internal memory markers must not be exposed to the user-facing model or user response.

## Agentic conversation

First-class agents reuse the same conversational intelligence boundary.

```text
natural user goal
  -> conversational understanding
  -> agent goal
  -> bounded plan/tool proposal
  -> canonical authorization
  -> agent runtime
  -> canonical tools/connectors
  -> evidence
  -> natural progress/result message
  -> pause/resume/recovery/follow-up
```

The model may plan and communicate. The agent runtime owns long-lived goal state. Canonical services own irreversible state changes.

A user can interrupt an active goal, start another task, return to the first goal, change one constraint, pause it, resume it or cancel it without destroying unrelated contexts.

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

Only canonical domain services and verified external evidence can establish those states.

## Required conversational behaviours

The acceptance bar includes:

- ordinary dialogue without forced skill routing;
- natural clarification;
- minimal useful questions;
- interruptions and resumptions;
- relative references such as “that one”, “the cheaper one”, “same time” and “go back”;
- multiple simultaneous goals;
- correction without losing unchanged constraints;
- exploration without premature action;
- explicit action without unnecessary friction;
- natural presentation of structured cards/results;
- truthful recovery when external execution is unavailable;
- cross-channel continuation using the same canonical identity/context/object semantics;
- agent pause/resume/cancel and follow-up;
- locale/dialect and colloquial language handling.

## Evaluation

The repository contains conversational quality, trajectory, action-discipline, model-comparison and generation regressions. These are evidence for development quality, not proof that every external capability is live.

At minimum, model evaluation should compare:

- naturalness;
- context retention;
- goal retention;
- interruption/resumption;
- correction handling;
- relative-reference resolution;
- appropriate clarification;
- action/no-action discrimination;
- canonical action/schema adherence;
- hallucination/truthfulness;
- recovery;
- latency;
- token usage and cost.

## Refactoring/consolidation rule

When an existing component overlaps this contract:

- **retain** canonical state/execution owners;
- **repurpose** classifiers/routers into semantic dispatch support rather than conversational response ownership;
- **reduce** duplicated canned `general_question` response generation;
- **preserve** deterministic fallback/safety responses where appropriate;
- **do not create** another Brain, Chat, router, agent runtime, memory system or provider system.

Future contributors and agents must treat this document as an architectural invariant, not an optional style preference.

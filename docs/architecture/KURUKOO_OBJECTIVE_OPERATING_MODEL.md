# Kurukoo Objective Operating Model

## Purpose

Kurukoo is conversation-first, but the durable product object is the user's work: an objective that can span Goals, Economic Requests, Tasks, approvals, providers, evidence, outcomes, notifications and continuation.

## Canonical flow

```text
Conversation
  -> intent + context
  -> objective / Goal
  -> capability + policy
  -> authorization / confirmation when required
  -> execution or truthful external block
  -> evidence / outcome
  -> notification / Agent Brief
  -> same-context continuation
```

## Objective graph

An objective may contain parent and child Goals. Dependencies must be explicit and persisted. A dependent Goal cannot become actionable merely because an upstream model proposed it.

```text
Parent Objective
├── Goal A
│   └── Economic Request / capability
├── Goal B
│   └── waits on Goal A
└── Goal C
```

Completion requires supported evidence when the capability declares an evidence requirement. External success must never be inferred from model text alone.

## Agent execution controls

Agent work is bounded by explicit budgets:

- maximum actions per cycle
- maximum retries
- maximum elapsed execution time
- maximum concurrent goals
- optional estimated cost budget

When a budget is exhausted the Agent must stop, persist the stop reason, and expose a truthful continuation or escalation path. The Agent must not silently loop or create unlimited retries.

## Quality gate

Before a consequential Goal is treated as complete, the objective evaluator checks:

- a plan exists
- the capability is allowed
- authorization is satisfied
- dependencies are satisfied
- required evidence exists
- external outcomes are verified

Possible decisions are:

- `pass`
- `needs_user`
- `blocked`
- `fail`

The quality gate is advisory to the workflow, but no component may use an unverified external outcome as evidence of successful completion.

## Execution trace

Every material Agent operation should be attributable to:

- owner
- conversation
- Goal
- event kind
- tool/capability
- status
- evidence
- idempotency key
- timestamp

The existing Agent Tool Registry remains the execution owner. Trace records are an audit/evaluation layer, not a second executor.

## Human checkpoints

High-risk or confirmation-required actions must remain behind existing canonical policy and confirmation checks. `needs_user` is a durable state, not an error string.

## Background work

Background workers may resume persisted Goals, but they must re-check:

- owner scope
- Goal state
- dependency readiness
- execution budgets
- capability activation
- confirmation requirements
- current provider/external availability

Background execution must fail closed when prerequisites are unavailable.

## Future simulator

A safe Objective Simulator can use fake providers and deterministic evidence to test full lifecycle transitions without real money, providers or fulfilment. It should exercise the same canonical Goal, capability, policy, persistence, trace and notification interfaces used in production.

## Non-goals

This model does not require a swarm of user-facing Agents, a second workflow engine, or replacement of Kurukoo's canonical persistence/capability architecture. Specialized work should remain behind the single user-facing `/chat` Agent and existing capability/executor boundaries.

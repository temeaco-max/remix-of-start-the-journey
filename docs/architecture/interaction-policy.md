# Kurukoo Interaction Policy

Kurukoo uses one universal capability vocabulary, but interaction policy is evaluated at the **action** level as well as the capability level.

## Operating relationship

```text
conversation
  -> priority / interruption
  -> context arbitration
  -> capability
  -> action
  -> interaction policy
  -> authentication / confirmation / identity checks
  -> canonical domain owner
  -> execution / evidence
  -> result
  -> conversational continuation
```

The capability vocabulary answers **what Kurukoo can do**. The action answers **which operation is being requested**. The interaction policy answers **how that operation may interact with the user's current conversation and permissions**.

## Examples

A reminder capability is not one uniform interaction:

- `reminder.open` is read-only and can be presented without mutation authorization.
- `reminder.create` and `reminder.cancel` remain owner-scoped mutations.
- a due reminder can interrupt the current conversation according to its trigger policy while preserving the previous goal for later resumption.

Payment similarly separates inspection from authorization:

- `payment.inspect` is informational.
- `payment.authorize` requires exact identity and explicit confirmation.
- discussion of a price never grants payment authorization.

Memory distinguishes retrieval from mutation:

- reading memory may be informational;
- storing/forgetting memory requires the canonical memory authority and explicit policy.

Remote/device operations distinguish inspection from execution. Public/community/attribution capabilities distinguish drafting from publishing, sending, claiming, or inviting.

## Critical interruption

Emergency and other critical safety capabilities may be guest-accessible for initial help and may pre-empt unrelated goals. Initial emergency handling does not require ordinary onboarding when authentication is not technically or legally necessary. Actual calling, connection, dispatch, provider acceptance, and completion require external evidence and must never be inferred from repository readiness.

## Source of truth

Interaction policy does not replace canonical domain owners. It is a cross-cutting decision layer. Domain owners remain authoritative for identity, authorization, state mutation, payment, execution, evidence, memory, notifications, agent state, and other irreversible effects.

## Failure rule

Interruptions and failures preserve the interrupted context whenever possible. Explicit object identity is never re-selected by recency or generic similarity.

# Kurukoo AI Semantic Proposal Boundary

Kurukoo's conversational model may interpret complex natural-language turns and propose a canonical capability/action when deterministic routing has not already produced one.

The proposal is advisory only.

```text
user
  -> context arbitration
  -> conversational intelligence
  -> model semantic proposal (only for eligible turns)
  -> canonical capability/action validation
  -> canonical service
```

## Rules

- Ordinary conversation such as greetings, casual discussion and problem descriptions without an action request must not produce a capability proposal.
- The model may propose a capability, action and user-stated arguments only when confidence is sufficient.
- Model inference does not authorize payment, booking, provider selection, memory persistence, subscription changes, agent execution, referral/Points mutation, QR attribution or any irreversible action.
- The proposal must re-enter the existing canonical capability/action protocol.
- Unknown capabilities/actions are rejected by the canonical execution layer rather than interpreted as a new feature.
- Context and object identity remain owner-scoped and fail closed.

This is an extension of the existing conversational intelligence boundary, not a second router or tool system.

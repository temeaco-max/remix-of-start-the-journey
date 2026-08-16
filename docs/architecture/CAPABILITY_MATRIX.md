# Kurukoo Universal Capability Matrix

**Status:** Current canonical documentation for the universal capability/action protocol.

## Operating rule

> Natural language is the primary user interface. The AI coordinates canonical Kurukoo capabilities. Canonical domain services remain authoritative for state and evidence.

The implementation source is `src/services/universalCapabilityProtocol.ts`. It adapts the existing 205-skill / 46-family catalog and the bounded `agentToolRegistry` without creating parallel metadata. The live catalog is available through `GET /api/chat/capabilities` and is provider-neutral.

## Shared descriptor

Every catalog entry exposes the same conceptual fields:

| Contract area | Meaning | Authority |
|---|---|---|
| Capability and family | Canonical skill, agent tool or family identity | Existing skill flow / agent registry |
| Mode | Read-only, conversation, structured action, state change or external execution | Universal protocol adapter |
| Context and inputs | Required and optional fields needed to proceed | Skill requirements / canonical service |
| Permissions and owner | User, operator, agent and service authorization boundary | Auth and canonical domain service |
| Risk and consent | Read, reversible, confirmation-gated or high-risk posture | Policy and canonical service |
| Lifecycle | Allowed request and execution states | Skill flow / domain lifecycle |
| Facts and evidence | What may be stated and what evidence level supports it | Canonical state/evidence service |
| Next actions | Actions allowed from the current state | Canonical result projection |
| Failure and recovery | Retry, resume, cancel, wait and escalation paths | Existing canonical owner |
| Continuation | Conversation, context, object, owner and lifecycle identity | Chat action protocol |
| Activation | Local availability, repository readiness, or external dependency requirement | Feature/provider readiness boundaries |

## Proposal and result rules

A proposal has the shape `capability`, `action`, optional `contextId`, optional `canonicalObjectId`, `arguments`, `confidence`, `reason` and `confirmationRequired`. It is not an authorization. The canonical boundary validates support, ownership, permissions, required inputs, lifecycle, risk, consent, idempotency, exact object identity and freshness before mutation.

A canonical result has a status of `accepted`, `waiting`, `needs_user`, `confirmation_required`, `blocked`, `failed`, `completed`, `externally_pending` or `unavailable_external_dependency`. It carries canonical facts, object identity, evidence level, activation state, next actions, recovery actions and continuation context. The existing Chat stream transports this as `capability_result`; cards remain the structured source of truth and the assistant message explains the result without changing it.

## Canonical families

The complete list is generated from the existing skill catalog rather than copied into this document. The focused regression `npm run test:universal-capability-protocol` verifies that the current catalog contains at least 205 skill capabilities plus bounded agent capabilities, preserves `find_worker`, validates exact context, blocks unsupported/stale/foreign actions, requires confirmation where declared, and projects completed, waiting and unavailable-external results with recovery paths.

## External truth

Repository readiness is not external activation. Payment, settlement, provider availability, inventory, dispatch, FCM, WhatsApp, Telegram, SMS, USSD, voice, QR-linked delivery, KYC, WebRTC and hosted-model limits remain unavailable or externally pending until the configured adapter returns independent evidence. No catalog entry authorizes the model to invent those facts.

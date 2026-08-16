# Kurukoo AI Decision Provenance Contract

**Status:** architectural foundation

Kurukoo must be able to explain the operational path that led to a consequential outcome without exposing hidden model chain-of-thought.

## Decision record

A decision record links:

```text
user/channel identity
 -> conversation turn
 -> selected context
 -> semantic proposal
 -> capability/action
 -> policy decision
 -> authorization/consent
 -> canonical execution
 -> external result
 -> evidence
 -> user-visible response
```

## Required properties

- stable decision/event ID;
- conversation and owner references;
- selected context and relation;
- capability/action identifiers;
- model/provider metadata when AI interpretation was used;
- confidence/ambiguity metadata where applicable;
- policy decision ID/version;
- authorization/confirmation reference;
- canonical mutation/execution reference;
- external connector reference when applicable;
- evidence state and evidence reference;
- response/continuation reference;
- timestamps and lifecycle status.

## Privacy

Records must contain the minimum information required for auditability. Do not persist raw memory facts, notification bodies, secrets, payment credentials, sensitive payloads, or model chain-of-thought merely to explain a decision. Use bounded reason codes and references to canonical records.

## Truth states

The provenance layer must preserve the distinction between:

- interpreted;
- proposed;
- authorized;
- accepted;
- executed;
- externally acknowledged;
- evidenced;
- verified;
- failed;
- unavailable;
- cancelled.

A generated response must never upgrade one state into another merely because the model expects success.

## User support

Support/admin tooling should be able to traverse the record and answer questions such as: what did the user ask, what context was selected, what action was proposed, why was it allowed/blocked, what actually executed, what evidence exists, and what remains outstanding?

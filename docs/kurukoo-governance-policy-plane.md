# Kurukoo Governance & Policy Plane

**Status:** architectural foundation

This document defines the policy boundary required for Kurukoo to operate as a governed AI operating system. It deliberately does not claim that one static ruleset can guarantee legal compliance in every jurisdiction. Compliance is a live, jurisdiction-aware control function.

## Principle

AI proposes. Policy decides. Canonical services execute. Evidence records reality.

## Decision boundary

Every consequential capability action must be evaluated against the applicable policy context before mutation or external execution. The policy context may include:

- jurisdiction and market;
- user identity and verification state;
- actor role;
- capability and skill;
- action and lifecycle state;
- consent and confirmation requirements;
- age or eligibility requirements where applicable;
- financial/risk thresholds;
- provider verification requirements;
- external integration activation;
- data-protection constraints;
- safety restrictions;
- human-review requirements.

## Decision outcomes

A policy evaluation should produce one of:

- `allow` — action may proceed to its canonical owner;
- `allow_with_confirmation` — user or authorised actor must explicitly confirm;
- `allow_with_human_review` — designated human review is required;
- `defer` — state may be preserved but execution cannot proceed yet;
- `deny` — action is not permitted;
- `unavailable` — required external capability is not activated;
- `unknown` — insufficient policy/evidence context; fail closed and request clarification or escalation.

## Non-negotiable separation

The policy plane must not become a second transaction engine, second identity system, second memory system, or second router. It evaluates a proposed canonical action and returns a bounded decision. Existing canonical owners remain responsible for mutations and execution.

## Evidence rule

No policy decision can convert an unavailable external capability into a successful result. `repository_ready`, `configured`, `authorized`, `executed`, and `verified` are distinct states.

## Jurisdiction and localisation

Rules must be keyed by jurisdiction/market and versioned. User-facing language must explain the consequence simply without exposing internal policy identifiers. Policy changes should be deployable/configurable without retraining SmolLM2 whenever the change concerns current law, current eligibility, current activation, current pricing, or current external state.

## Auditability

Consequential decisions must emit a bounded provenance record containing the decision ID, policy version, jurisdiction, actor/capability/action references, outcome, reason code(s), required confirmation/review, and resulting canonical execution/evidence references. Never store model chain-of-thought as an audit requirement.

## Administrative control

Policy configuration, publication, rollback and emergency disablement belong to an authenticated administrative control plane with versioning, review and audit history. The AI cannot alter policy or promote its own model.

# Kurukoo Capability Interaction Policy

Kurukoo capabilities share one interaction-policy layer derived from the universal capability vocabulary. This is a policy overlay, not a second registry or router.

## Why it exists

Capabilities do not all behave like ordinary conversational requests. Some can interrupt, some run in the background, some require exact identity, some require explicit confirmation, and some must work for guests before authentication.

The policy prevents feature-specific handling from producing inconsistent conversational behaviour.

## Policy dimensions

Every capability may be evaluated for:

- priority: `background`, `normal`, `high`, `critical`
- interruption: `never`, `at_trigger`, `conditional`, `immediate`
- guest access: `allowed`, `allowed_for_initial_help`, `blocked`
- authentication: `none`, `after_initial_help`, `required_before_action`
- confirmation: `none`, `contextual`, `explicit`
- autonomy: `none`, `bounded`, `long_running`
- background execution
- resumability
- pre-emption of unrelated goals
- preservation of prior goals
- exact canonical identity requirement
- location requirement
- voice requirement
- external evidence requirement
- draft-versus-commit separation
- failure context preservation

## Canonical behaviour classes

### Critical interruption

Emergency and urgent safety capabilities can interrupt ordinary onboarding, reminders, Economic Requests, agents, and other goals. They should preserve the interrupted goals for later resumption.

Initial emergency help must not require registration where registration is not technically or legally necessary. Actual dispatch or connection must remain evidence-gated.

The current emergency foundation uses the canonical `safety` capability and the verified Nigeria emergency directory. Nigeria's national emergency route is represented as `112`; local emergency contact entries must remain source-attributed and separately verified before activation.

### Scheduled interruption

Reminders are background capabilities that can interrupt at their trigger time according to the user's configured reminder behaviour. The conversation that was interrupted remains resumable.

### Long-running autonomy

First-class agents can operate in the background within their existing goal, quota, confirmation and action-limit policies. Agent controls act on exact agent-goal identity.

### High-risk/exact-identity actions

Payments, subscriptions, remote/device controls, orders, communications, and other state-changing operations require canonical identity and the applicable confirmation/authorization boundary.

### Memory

Conversation does not automatically become durable memory. Store/forget actions remain explicit and target exact owner-scoped memory context.

## Priority detection

`src/services/conversationPriorityService.ts` provides a pre-routing priority decision for critical emergencies, explicit agent-control commands, security interruptions and reminder requests. This decision is intended to be applied before ordinary onboarding and generic semantic routing so high-priority turns cannot be swallowed by lower-priority feature flows.

## Emergency execution boundary

`src/services/emergencyDirectoryService.ts` contains source-attributed emergency contact records. `src/services/canonicalCapabilityExecutor.ts` recognizes `safety.emergency_dispatch` and can return a truthful externally-pending result with the emergency number and dial/voice continuation actions. It does not claim that a call, responder connection or dispatch occurred until an external voice/telephony adapter provides evidence.

## Enforcement

`src/services/capabilityInteractionPolicyService.ts` derives policy from the existing `UniversalCapabilityDescriptor`. AI capability proposals include the derived policy where available. The canonical capability/action protocol remains authoritative for ownership, authorization, mutation, execution and evidence.

`deriveInteractionPolicyForCapabilityName()` allows the policy contract to be applied to virtual or future capabilities before they have a dedicated catalog descriptor, without creating a second registry.

The canonical executor also applies the interaction policy at execution time. This is important because an AI proposal alone must never decide whether authentication, confirmation, exact identity or guest initial handling can be bypassed.

## Regression

`scripts/test-capability-interaction-policy.ts` validates the current capability catalog and representative virtual profiles for emergency dispatch, remote/device control, reminders and subscription changes.

`scripts/test-interaction-priority-emergency.ts` validates emergency pre-emption, guest initial handling, canonical 112 routing and the distinction between emergency guest handling and ordinary guest account-owned actions.


## Whole-system convergence proof — 17 August 2026

The interaction policy is enforced at the canonical Chat boundary before guest onboarding, authentication, context arbitration, generic intent routing and model generation. Policy metadata is retained in the canonical turn result and assistant message telemetry. Ordinary conversation remains ordinary conversation; a turn is not forced into a capability merely because the catalog contains a matching skill.

A small action-policy projection now narrows the shared policy for reminder, memory, agent, payment, remote/device, communication and public actions. It is a typed compatibility layer over the existing descriptor and canonical policy service, not a second router, registry or executor. Direct legacy `safety/emergency_dispatch` inputs resolve through the registered emergency owner.

The proven policy matrix covers 227 descriptors and representative virtual actions. It verifies guest critical bypass only for initial help, authenticated owner boundaries for mutations, explicit confirmation for payment and high-risk operations, exact object identity, external evidence requirements, draft-versus-commit separation, memory provenance, reminder interruption, bounded agent controls and failure-context preservation. The resulting states remain truthful when an external adapter is disabled or unavailable.

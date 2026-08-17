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

### Scheduled interruption

Reminders are background capabilities that can interrupt at their trigger time according to the user's configured reminder behaviour. The conversation that was interrupted remains resumable.

### Long-running autonomy

First-class agents can operate in the background within their existing goal, quota, confirmation and action-limit policies. Agent controls act on exact agent-goal identity.

### High-risk/exact-identity actions

Payments, subscriptions, remote/device controls, orders, communications, and other state-changing operations require canonical identity and the applicable confirmation/authorization boundary.

### Memory

Conversation does not automatically become durable memory. Store/forget actions remain explicit and target exact owner-scoped memory context.

## Enforcement

`src/services/capabilityInteractionPolicyService.ts` derives policy from the existing `UniversalCapabilityDescriptor`. AI capability proposals include the derived policy where available. The canonical capability/action protocol remains authoritative for ownership, authorization, mutation, execution and evidence.

`deriveInteractionPolicyForCapabilityName()` allows the policy contract to be applied to virtual or future capabilities before they have a dedicated catalog descriptor, without creating a second registry.

## Regression

`scripts/test-capability-interaction-policy.ts` validates the complete current capability catalog and representative virtual profiles for emergency dispatch, remote/device control, reminders and subscription changes.

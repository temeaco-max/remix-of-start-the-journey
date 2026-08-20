# Dispatch + Agent Network Runtime Handoff

## Shared dispatch lifecycle

All dispatch-capable skills use the canonical `SkillExecutionContract.interaction` and `economicDispatchCoordinator`. The lifecycle is:

`request → broadcast offers → provider accepts → Points lead charge → provider becomes unavailable → shared provider communication session → provider arrival → user communication unlocked → provider completes → provider becomes available → user review/feedback → trust/Points completion effects`.

This is not a rider-only subsystem. The same interaction contract applies to transport, deliveries, logistics and any future dispatch-capable skill.

## Provider communication

WebRTC is the preferred live transport when the deployment has the required relay configuration. The provider session may use the WebRTC data channel for messages/events, WebRTC audio/video for live communication, and the same session for interval provider-location samples. The durable text conversation is still owned by canonical Chat.

Provider GPS sampling is controlled by `KURUKOO_PROVIDER_GPS_INTERVAL_MS`, clamped by the server to 5–120 seconds and defaulting to 15 seconds. Trickbridge is an optimization/aggregation adapter, not a second source of truth. External PSTN masking is a fallback adapter and is not required for normal in-app provider communication.

## Agent/POS Points sales

Active authorised agents use the existing Points + Commercial Ledger authorities. An agent records a customer's Points sale and payment/reference evidence. Points are not credited until settlement evidence is verified. Commission is accrued in the Commercial Ledger, reserved by pending payout requests, and only marked settled after external payout evidence is recorded.

Supported payout adapter identifiers are `opay`, `moniepoint` and `manual`. Enablement flags indicate adapter readiness; they do not fabricate provider settlement.

## AI capacity

Mistral, Gemini, Groq and OpenRouter are capacity-pool providers. Routing may consume included/free capacity before PAYG where enabled. The existing provider-health, quota, cost and agent-budget policies remain authoritative. SmolLM2/rules remain the cheap local path.

## UI inheritance rule

`platformFeatureVisualRegistry` is the visual coverage authority. The web Feature Compass and mobile Feature Compass expose every major capability through an icon/tooltip, contextual card, secondary navigation or primary surface. New features must be added to the registry and mobile contract before being considered complete.

## Reuse rule

Before adding a new subsystem, inspect `docs/architecture/REUSE_BEFORE_ADDING.md`. Economic Request, skill behaviour, execution contracts, Points, Commercial Ledger, provider communication, WebRTC, notifications, Discover, catalogue and agent runtime already have canonical owners.

# Kurukoo OS — Weave Status

## Purpose

This document is the integration handoff for Kurukoo OS. "Weave" means that capabilities are connected vertically through a complete user/provider outcome and horizontally through shared identity, Memory Profile, skills/instructions, execution contracts, evidence, commerce, notifications, channels, agents, Discover and clients.

## Canonical vertical journeys

### Dispatch / ride / delivery journey

`channel -> Chat -> skill routing -> Economic Request -> dispatch broadcast -> provider acceptance -> provider lead Points charge -> provider availability lock -> Provider Communication Session -> WebRTC / Trickbridge location + messaging -> arrival -> completion -> provider re-available -> customer review -> provider rating/trust -> completion Points -> journey projection -> notification/continuation`

The same dispatch coordinator is intended to support ride, delivery and other dispatch-capable skills; vehicle preference is data on the dispatch request rather than a new ride engine.

### Catalogue / product journey

`provider/business/WhatsApp/store/affiliate source -> canonical catalogue -> verified/available product -> Discover or Chat product result -> ask/buy/order/book -> Economic Request -> provider/channel execution -> evidence/completion`

### Agent/POS commerce journey

`agent registration -> admin activation -> Points top-up intent -> payment adapter/webhook -> verified settlement -> Points credit -> agent commission settlement -> commercial ledger`

### Discover journey

`source authorities -> Discover composition -> For You/Nearby/Today/Topics/Opportunities/Explore -> watch/follow/save/ask/buy/book/order/call -> Chat or Economic Request -> notifications/agents/continuation`

### AI journey

`deterministic rules/FastText -> local SmolLM2 -> healthy free/included hosted capacity (Mistral/Gemini/Groq/OpenRouter where configured and suitable) -> paid hosted continuation when permitted -> provider-health fallback`

The unified AI gateway remains the only hosted-provider execution owner.

## Horizontal contracts

- **Identity:** authenticated owner scope remains authoritative.
- **Memory:** Memory Profile and living-memory systems remain the only memory owners.
- **Skill:** the canonical skill catalogue, behaviour registry and execution contract remain the skill owners.
- **Execution:** capability registry/executor and Economic Request lifecycle own state transitions.
- **Evidence:** canonical service/provider/payment evidence remains authoritative; models never invent completion.
- **Commerce:** Points, Commercial Ledger and verified payment evidence remain authoritative.
- **Notifications:** existing FCM/internal notification queue remains the notification owner.
- **Channels:** Web, mobile, WhatsApp, Telegram, SMS, USSD, email and voice remain adapters into canonical Chat/continuation.
- **Discover:** Discover is a composition layer over canonical products/providers/topics/opportunities/promotions/agent-network sources.
- **Agents:** agent runtime and inference budget services remain the agent owners; AI router remains the inference owner.
- **Mobile:** Expo uses the same backend/API owners and maintains a parity registry for post-Expo platform capabilities.
- **Journey projection:** `platformJourneyWeaver` is a projection/continuity layer only; it is not a second source of truth.

## Key canonical implementation files

- `src/services/platformCanonicalContracts.ts`
- `src/services/aiInferencePolicy.ts`
- `src/services/unifiedAiEngine.ts`
- `src/services/economicDispatchCoordinator.ts`
- `src/services/providerCommunicationService.ts`
- `src/services/trickbridgeTrackingAdapter.ts`
- `src/services/catalogueSourceRegistry.ts`
- `src/services/catalogueInventoryMatcher.ts`
- `src/services/discoverCommercialComposition.ts`
- `src/services/agentNetworkCommerce.ts`
- `src/services/serviceReviewService.ts`
- `src/services/trustScore.ts`
- `src/services/platformJourneyWeaver.ts`
- `src/services/skillFlows.ts`
- `src/services/skillExecutionContract.ts`
- `src/services/agentRuntime.ts`
- `src/services/commercialLedger.ts`
- `src/services/pointsEngine.ts`

## Key API surfaces

- `/api/chat/*`
- `/api/economic-requests/*`
- `/api/discover/*`
- `/api/agent-network/*`
- `/api/catalogue/*`
- `/api/provider-communication/*`
- `/api/reviews/dispatch/:leadId`
- `/api/journey`
- `/api/voice/*`
- `/api/webrtc/*`

## Regression gates

The platform convergence workflow includes:

- lint
- route suite
- FastText test
- platform convergence frames
- AI free-first routing
- skill interaction convergence
- feature visual coverage
- economic dispatch lifecycle
- dispatch review lifecycle
- horizontal journey projection
- agent network commerce
- catalogue source convergence
- provider communication
- catalogue inventory
- Discover category commerce
- provider lead Points
- Economic lifecycle
- Expo mobile platform contract and iOS/Android export checks.

## Integration state

The implementation branch is `feature/platform-convergence-frames` and must be synchronized with the latest `main` before merge. The current PR is **#64** and remains draft/non-mergeable until the five newer `main` commits are reconciled and CI/staging evidence is green.

## Live evidence still required

Repository wiring is not a substitute for runtime evidence. Before production activation, verify with deployment configuration:

- Mistral/Gemini/Groq/OpenRouter credentials and free/PAYG limits
- Stripe/Points settlement webhooks
- FCM/notification delivery
- WebRTC/TURN behaviour under mobile networks
- Trickbridge external bridge, if enabled
- masked telephony only where an approved telephony adapter is configured
- WhatsApp/Telegram/SMS/USSD/email channel delivery
- production persistent-store/multi-worker topology

## Rule for future work

Do not create a new subsystem when an existing canonical owner can be extended. Prefer a thin adapter, capability, projection or policy layer. Every new feature must identify:

1. canonical owner;
2. user-visible entry surface;
3. Memory/identity scope;
4. execution/evidence owner;
5. notification/continuation path;
6. commercial outcome, if any;
7. web/mobile/channel parity;
8. regression/CI contract.

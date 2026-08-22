# Kurukoo OS — Weave Contract

Kurukoo features are complete only when they share the same identity, conversation/context, skill/capability authority, lifecycle, evidence, notification and revenue boundaries.

## Canonical OS flow

User/channel → canonical Chat or Discover → conversation act / AI routing → Skill + Instructions + Memory Profile → Capability Registry / Execution Contract → Economic Request, Agent Goal, Reminder or Safety lifecycle → provider/tool/channel execution → evidence → notification/continuation → commercial ledger where applicable.

## Core weave

| Area | Must connect to | Canonical owner |
|---|---|---|
| Outcome Context | Economic Request, dispatch, provider communication, Points, journey timeline, notifications, web/mobile/Chat | `outcomeContextService`, `platformJourneyWeaver` |
| Discover | Topics, providers, products, offers, opportunities, agent network, ads, Chat, Watch | `discoverExperience`, `discoveryNetwork` |
| Products | provider/business/WhatsApp/store/affiliate inventory → Discover → Chat → Economic Request | catalogue services |
| Provider lead | match → subscription eligibility → Points charge → ledger → notification | dispatch/order + Points + commercial ledger |
| POS/agent top-up | agent identity → payment evidence → Points → commission → ledger → Discover | agent-network commerce + payment webhook |
| Provider communication | Economic Request → WebRTC text/location/voice/video → Trickbridge → notification → PSTN masking fallback | provider communication service |
| Ride/delivery | broadcast → accept/lead charge → arrive → communication → complete → review → provider available | economic dispatch coordinator |
| AI | FastText/rules → SmolLM2 → healthy free hosted capacity → PAYG/paid provider → fallback | unified AI + inference policy |
| Channels | Web/mobile/WhatsApp/Telegram/SMS/USSD/voice/QR → canonical conversation; no channel-specific business state | channel adapters + Chat |
| Mobile | native surfaces consume canonical APIs/contracts; no second state authority | Expo mobile contract |

## Communication rule

Prefer the lowest-burden transport available:

- Web/mobile WebRTC DataChannel for real-time text, events and location.
- WebRTC audio/video for direct provider communication when supported by both parties.
- Trickbridge selectively forwards/aggregates movement so GPS can be sampled sparingly rather than continuously server-routed.
- PSTN number masking is a fallback adapter, not the core identity model.

## Revenue rule

Every monetisable path must connect to the same commercial authorities:

- sponsored Discover/category placement → action → Chat/Economic Request → provider conversion;
- provider subscription → lead eligibility → Points lead fee;
- authorised POS/agent → verified top-up → Points → commission;
- product/affiliate → Chat card → purchase/request → commercial event;
- agent subscription/AI usage → bounded Agent Runtime;
- eligible completed transactions → evidence → applicable fee.

## Completion rule

A feature is not complete merely because its service exists. It must have a canonical source of truth, client/channel continuation, evidence boundary, notification/continuation path and revenue connection where applicable—or an explicit genuine external activation boundary.

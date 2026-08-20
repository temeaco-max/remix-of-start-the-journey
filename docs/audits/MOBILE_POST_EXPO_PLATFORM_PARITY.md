# Mobile Post-Expo Platform Parity

The canonical native client is `mobile/kurukoo-mobile` (Expo Router, iOS and Android). This document records the post-Expo platform capabilities that must remain represented in the mobile framework even when a screen is not yet implemented.

## Shared contract families

- Discover: For You, Nearby, Today/Daily Picks, Topics, Opportunities, Explore Kurukoo, Watch, sparse-area recovery and sponsored disclosure.
- Chat/AI: canonical Chat stream, conversation identity, FastText routing signal, Memory Profile context, model/provider diagnostics and escalation boundaries.
- Agents: first-class agent representation, bounded execution, inference budgets and continuation state.
- Economic Requests: request lifecycle, confirmation, payment/settlement states and evidence.
- Notifications: FCM registration, deep-link destinations and safe payload parsing.
- Device trust: device verification and secure-link QR flows.
- Platform actions: reminders, connected resources, capabilities and action cards.
- Safety: emergency/security interruption and trusted-contact boundaries.

The mobile client must remain a presentation/client layer over the canonical backend contracts. It must not recreate skill routing, agent execution, economic state or discovery logic locally.

## Build readiness

Expo profiles are defined for development, preview and production through `eas.json`. iOS and Android remain first-class targets. Backend credentials are never bundled into the mobile app; runtime configuration supplies the API base URL and Firebase build files where required.

## Rule for future platform changes

When a backend capability is added to Kurukoo, first add or update the corresponding shared mobile contract/readiness entry, then implement UI/interaction later. This keeps the native clients buildable and aligned without forcing native delivery in the same change.

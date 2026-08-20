# Platform frame configuration

The following deployment variables activate the newly converged capability adapters. Empty means the adapter remains fail-closed or local-only.

## Provider communications

```text
TWILIO_ACCOUNT_SID=
TWILIO_AUTH_TOKEN=
TWILIO_FROM_NUMBER=
TRICKBRIDGE_BASE_URL=
TRICKBRIDGE_API_KEY=
```

`TWILIO_*` enables real outbound masked calling through the existing provider communication session. Kurukoo still owns the communication-session state; Twilio supplies transport.

`TRICKBRIDGE_*` enables the optional external provider-tracking bridge. Without it, the canonical provider session still records location locally and can use the existing WebRTC signalling boundary when enabled.

## Catalogue sources

Provider/business/WhatsApp/store sources are registered as unverified declarations. Verification is derived from the source authority and must not be self-assigned by an authenticated user. Affiliate sources are operator-controlled.

## Agent network commerce

POS/field agents are roles in the canonical party/commercial network. Points top-ups create a payment intent through the existing payment authority and are credited only after a verified payment webhook. Agent commission is recorded in the existing commercial ledger.

Provider lead charges are attached to the actual provider-match event in the Economic Request/order finalisation path.

## Discover category monetisation

`/api/discover/category/:category` composes canonical inventory, category-targeted sponsored placements and agent-network availability. Sponsored inventory remains labelled and uses the existing Ad Manager counters.

## AI

The current AI router remains the canonical orchestration layer. Do not add another gateway for Groq, Gemini, OpenRouter or Mistral. Provider adapters are capacity sources and are selected using the existing inference policy, health, quota and cost context.

## Mobile

The Expo client parity registry must be updated whenever any capability becomes consumer-visible. New server capabilities are represented as `commerce-network`, `catalogue`, and `provider-communications` so native screens can be built later without a backend contract rewrite.

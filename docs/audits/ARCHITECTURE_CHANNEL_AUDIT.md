# Kurukoo Architecture & Channel Audit

## Canonical rule
Kurukoo is one economic conversation system delivered through multiple transports. Web, PWA, WhatsApp, Telegram, SMS, USSD, Email and IVR must resolve to the same verified identity, Memory Profile, conversation history, Points layer and skill engine.

## Current channel state

| Channel | Inbound | Unified ledger | Intent/skills | Outbound | Production status |
|---|---:|---:|---:|---:|---|
| Web/PWA | yes | yes | yes | yes | ready |
| WhatsApp | yes | yes | yes | yes | provider-config dependent |
| Telegram | yes | yes | yes | yes | provider-config dependent |
| SMS | yes | yes | yes | yes | provider-config dependent |
| USSD | yes | yes | yes | provider response | provider-config dependent |
| Email | yes | yes | yes | yes | transport-config dependent |
| IVR | yes | yes | yes | voice XML | voice-provider-config dependent |

## Identity

Phone is the canonical economic identity. Email is a secondary verified channel identity and must map to an existing Memory Profile. Email/IVR handlers do not create synthetic identities.

## AI routing

1. FastText classifies intent when a verified model is available.
2. Deterministic blueprint rules handle known action intents and remain the low-cost fallback.
3. SmolLM2 handles simple/general requests.
4. Groq handles complex reasoning.
5. Template responses handle provider failure.

FastText must be trained in CI/build, never on application startup.

## Cost controls

- Keep deterministic intent/skill routing ahead of paid inference.
- Cache repeated simple classifications and safe simple answers.
- Keep local model concurrency bounded.
- Debounce SQL.js persistence writes.
- Do not add distributed infrastructure until multi-instance deployment requires it.
- Before horizontal production, migrate SQL.js to PostgreSQL and process-local ephemeral state to Redis.

## Messaging reliability requirements

Every channel adapter must:

- validate provider signatures/secrets;
- resolve an existing verified identity;
- write inbound and outbound messages to `messages`;
- preserve channel metadata;
- avoid duplicate replies when provider retries the same event;
- use the same `routeIntent` / skill engine;
- return a provider-appropriate response;
- never fabricate delivery success.

## Known next-scale migrations

1. PostgreSQL for the unified message/economic ledger.
2. Redis for rate limits, presence, OTP/session state and short-lived caches.
3. Object storage/CDN for attachments and media.
4. Queue/workers for outbound channel delivery and long-running jobs.
5. Observability around channel delivery latency, AI fallback rate, classification confidence and provider failures.

## Frontend principle

There is one canonical chat UI and one canonical chat API. Other pages provide context, discovery and SEO entry points; they must not create channel-specific chat implementations.

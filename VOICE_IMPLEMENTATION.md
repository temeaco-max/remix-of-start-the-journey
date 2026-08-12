# Kurukoo Voice Implementation

## Current production-safe baseline

Kurukoo voice is an interface inside `/chat`. It does not create a second conversation, request, authentication, memory, reminder, payment, or fulfilment system.

The current zero-provider-cost baseline uses browser capabilities where supported:

```text
microphone
  -> SpeechRecognition
  -> existing chat composer
  -> existing /api/chat and Kurukoo routing
  -> existing assistant message
  -> SpeechSynthesis
  -> speaker
```

No raw audio is stored by Kurukoo. Voice remains attached to the current conversation and therefore inherits the existing progressive authentication, skillFlows, Economic Request, reminder, memory, safety, and request-state boundaries.

## Free testing

The browser adapter is intended for development and low-cost testing. Browser speech recognition/synthesis behavior is browser/vendor dependent; Kurukoo does not claim that all recognition or synthesis is performed locally or that every browser supports it.

If voice is unsupported, the user continues with text. Voice must never prevent ordinary chat.

## Realtime provider boundary

A future realtime provider adapter may provide a more natural duplex voice experience. Gemini Live is the first planned provider, but it is **not required for the free browser baseline**.

When implemented, provider-backed voice should use server-issued short-lived authorization and keep the permanent provider credential server-side. It must continue to reuse the same conversation and Kurukoo domain services. It must not create a parallel voice conversation or transaction engine.

Recommended configuration for provider-backed development is:

```env
KURUKOO_VOICE_ENABLED=true
KURUKOO_VOICE_PROVIDER=gemini
KURUKOO_VOICE_MODEL=gemini-3.1-flash-live-preview
KURUKOO_VOICE_MAX_SESSION_SECONDS=900
KURUKOO_VOICE_IDLE_TIMEOUT_SECONDS=120
KURUKOO_VOICE_MAX_CONCURRENT_SESSIONS=2
KURUKOO_VOICE_SESSION_RATE_LIMIT=5
```

`GEMINI_API_KEY` is a server-side secret only. Never expose it to browser JavaScript, logs, transcripts, or API responses. Model availability, quota, regional availability, preview status, and provider terms must be verified before enabling a provider-backed production mode.

## Product rules

- Voice is a `/chat` interaction, not a separate channel product.
- Text and voice share one conversation.
- Voice cannot bypass progressive identity, confirmation, authorization, provider verification, payment, safety, or Economic Request rules.
- Voice cannot claim a provider is available, a quote is final, payment is complete, escrow is active, dispatch occurred, or fulfilment completed without the same evidence required by text chat.
- Browser fallback remains available when a realtime provider is unavailable.
- The existing canonical chat composer and message persistence remain authoritative.

## Future provider adapter acceptance

A realtime implementation is complete only when it has:

1. a status boundary that reports configuration truthfully;
2. a session boundary scoped to the current conversation owner/guest identity;
3. short-lived provider authorization rather than a browser-exposed permanent key;
4. session duration, idle, concurrency, and issuance limits;
5. a validated allowlisted tool boundary that delegates to existing Kurukoo services;
6. transcript continuity through the existing messages model;
7. cleanup for microphone/audio/session resources;
8. explicit fallback to text and/or browser voice;
9. tests for ownership, limits, tool authorization, unavailable provider, and cleanup;
10. no raw audio persistence unless a future blueprint explicitly authorizes it.

## Status

**Implemented:** free browser voice MVP on `main`.

**Not yet claimed:** Gemini Live realtime production capability.

This distinction is deliberate so the product never presents an unconfigured external integration as live.

# Kurukoo Architecture & Scale Audit

## Executive summary

Kurukoo is now centered on one canonical conversation surface. The web chat, PWA entry point, homepage chat and channel routing all target the same chat stream and the same `messages` source of truth.

The launch architecture is intentionally lean: one Node/Express service, a local SQL.js persistence layer, lazy AI providers, and a single chat orchestration path. This keeps initial infrastructure cost low. It is not the final horizontal-scale architecture; SQL.js is an in-process database and should be replaced by a networked relational store before multiple application instances are required.

## Refactors completed

- Canonical `/api/chat/*` router for streaming, history, conversations, deletion and attachments.
- Authenticated chat stream uses the JWT identity instead of trusting a client-supplied phone number.
- Cursor/limit-based chat history prevents loading an unbounded message table into the browser.
- Conversation metadata is separated from the existing unified `messages` table without duplicating message content.
- Real Groq SSE streaming replaces artificial server-side word delays when Groq is selected.
- SmolLM2 is lazy-loaded and concurrency-bounded to prevent multiple simultaneous 1.7B model loads/inferences from exhausting a small launch host.
- Short-lived cache for simple AI responses reduces repeat inference cost.
- Chat attachment uploads are size/type bounded and use random non-user-controlled filenames.
- PWA dashboard is a compatibility entry point into the canonical chat instead of maintaining a second chat implementation.
- Homepage chat authenticates and uses the same `/api/chat/stream` route.
- SQL.js persistence writes are coalesced to avoid exporting the entire database for every mutation.
- GitHub workspace sync type checking was fixed.

## Current cost profile

### Cheap paths

1. Deterministic intent classification.
2. Kurukoo skill routing.
3. Template fallback.
4. Cached simple responses.
5. Local SmolLM2 for simple queries when the host has sufficient memory.

### Metered paths

1. Groq complex reasoning.
2. Hugging Face hosted inference when local SmolLM2 is disabled/unavailable.
3. External channel delivery providers.
4. Payment/verification providers.

The router should continue to prefer deterministic skills over LLM calls. A service action should never require a paid general-purpose model when the skill engine can handle the request.

## Main architectural constraint

`sql.js` is an embedded SQLite/WASM database. It is appropriate for a low-cost single-instance launch, demos, staging and low-volume operation. It is not a safe long-term source of truth for a horizontally scaled production fleet because the database is held in one process and persistence serializes the whole database to disk.

### Scale migration trigger

Move to PostgreSQL when any of these become true:

- more than one application instance is required;
- background workers must mutate the same data concurrently;
- message volume makes full database export expensive;
- chat history requires high-cardinality indexes or full-text search;
- payment/escrow volume requires transactional isolation beyond the embedded store.

The service layer should remain the boundary so the migration is a storage implementation change rather than a product rewrite.

## Recommended production topology

```text
Clients
  Web / PWA / WhatsApp / USSD / SMS / Telegram / Email / IVR
                         |
                  CDN / TLS / WAF
                         |
                  Node API Gateway
                         |
        +----------------+----------------+
        |                |                |
   Chat Router       Skill Engine      Channel Adapters
        |                |                |
   AI Router        Provider/Orders    Delivery Queue
        |                |
   SmolLM2/Groq     PostgreSQL
        |
   Redis (later: rate limits, presence, short cache)
```

Do not introduce Redis or a queue merely because they are common. Add them when measured load requires them. A single-process launch should stay simple.

## Next scale refactors

### 1. Storage adapter
Introduce a `Repository` interface for messages, memory profiles, conversations, orders and escrow. Keep SQL.js as the launch adapter and add PostgreSQL as the scale adapter.

### 2. Background work
Move slow/non-interactive work out of HTTP requests: provider matching retries, deferred-request nudges, media moderation, SEO audits, social scheduling, contact synchronization and analytics aggregation. The chat response should acknowledge these jobs rather than wait for them.

### 3. Presence
Keep high-frequency presence signals out of the relational database. At scale use a TTL store/Redis-compatible service. Persist only durable presence state and meaningful events.

### 4. Media
Local `/public/uploads/chat` is a launch fallback only. At scale use object storage with signed URLs, lifecycle policies, malware scanning and CDN delivery.

### 5. Observability
Add request IDs, provider latency, token/cost counters, route latency, database flush time, queue depth and error-rate metrics. Do not log message bodies or secrets by default.

### 6. AI budgets
Add per-user and global budgets for Groq/Hugging Face. Keep model routing deterministic and record provider/model metadata with each assistant message.

## Architecture rules going forward

- Conversation is the primary interface.
- `memory_profiles` remains the single user-context source of truth.
- `messages` remains the unified economic conversation ledger.
- Channel adapters translate transport; they do not create separate business logic.
- Skill services own actions; the general AI layer explains and coordinates.
- Points remain the continuous economic layer.
- Presence is shared across channels.
- Proactive intelligence reads the same memory/presence context.
- No duplicate chat UI or duplicate business workflow should be introduced.
- No paid AI call should be made when a deterministic skill can answer/action the request.

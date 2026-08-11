# Kurukoo — 2026 Blueprint Reality, Skills & Cost Audit

Date: 2026-08-11

## Executive verdict

Kurukoo's mandate is feasible if Kurukoo remains a **conversation-first economic coordination platform** rather than trying to own transport fleets, restaurants, payment custody, telecom infrastructure, celebrity access, emergency services, or carrier networks.

The repository already contains the core economic-request state machine, canonical skill taxonomy, provider/memory services, unified AI routing, chat conversation ledger, and artist verification/escrow policy. The main architectural task is therefore consolidation and correctness, not a new Economic OS.

## Canonical architecture

```text
channel transport
    ↓
verified identity
    ↓
Memory Profile + conversation history
    ↓
FastText / deterministic intent detection
    ↓
unified AI only when needed
    ↓
canonical skill + economic category
    ↓
shared Economic Request lifecycle
    ↓
provider discovery → availability → quote → confirmation
    ↓
payment / regulated escrow where required
    ↓
fulfilment → completion → rating / dispute / memory
```

Artists, rides, food, repairs, cars, tickets, workers, products and sports should all use this lifecycle. Category-specific policy is appropriate; category-specific economic engines are not.

## Skills audit

`src/services/skillFlows.ts` is the canonical economic taxonomy. It contains the broad economic categories and the core actions used by the platform, including `buy_car`, `buy_ticket`, `order_food`, `repair`, `find_worker`, `product_sourcing`, `security_personnel`, and `verified_artist`.

The previous skills-audit correction is valid: the audit must count `CATEGORY_BY_SKILL`, not incidental service files. The repository has already demonstrated 201 canonical skills against the 120+ requirement.

### Remaining skills/flow gap

The database seed contains only a subset of canonical skill flows. This does **not** mean the remaining skills should receive 200 bespoke implementations. The correct production solution is:

- specific database-backed flow definitions where the skill needs custom questions/policy;
- deterministic category-level defaults for the rest;
- canonical skill aliases in the intent router;
- explicit capability overrides only where real-world policy differs.

This keeps the taxonomy broad without manufacturing unnecessary code.

## Celebrity / creator booking

### Feasible

Verified creator/artist booking is a viable marketplace coordination feature.

### Not feasible as a promise

Kurukoo cannot honestly promise direct access to a celebrity merely because a profile exists. A profile is not proof of representation, availability or price.

### Required real-world flow

```text
creator / representative onboarding
→ identity verification
→ representation verification
→ availability / terms
→ quote
→ customer confirmation
→ regulated payment / escrow
→ event delivery / check-in
→ dispute window
→ release / completion
```

The existing `artistBookingService` already enters the shared `EconomicRequest` lifecycle and has verification/escrow safeguards. Keep those policies, but do not grow a separate artist transaction engine.

## Chat — 2026 expectation

The canonical chat router already supports authenticated conversations, streaming, persistent history, conversation IDs, message deletion, conversation deletion, attachments and shared intent/economic routing.

The correct product standard for 2026 is:

- streaming responses;
- persistent conversation history and search;
- attachments with size/type validation;
- safe action/confirmation cards before payment or irreversible actions;
- asynchronous/deferred request status;
- clear provider/AI status without exposing private chain-of-thought;
- consistent identity across web and external channels;
- voice input where a channel/provider supports it;
- edit/regenerate/copy UX at the client layer;
- source/citation cards when external data is used;
- cancellation/undo for queued economic actions where possible.

The platform should not require a phone number in the message body when the authenticated session already establishes identity. Authorization must come from the verified session.

## Email — real-world correction

Email is a durable asynchronous conversation channel, not just a notification sender.

The implementation now:

- verifies Resend/Svix signatures using the raw request body;
- uses `svix-id` for webhook idempotency;
- retrieves inbound email content from Resend's Receiving API because inbound webhook payloads contain metadata rather than the full body;
- stores attachment metadata without putting binary files in the messages table;
- correlates replies with `Message-ID`, `In-Reply-To`, and `References`;
- uses provider idempotency keys for outbound retries;
- records delivery lifecycle events;
- keeps email identity linked to the existing Memory Profile rather than creating a second identity store;
- sends both plain text and HTML responses.

The application composition root now also wires the channel router and captures raw JSON request bytes, which is required for cryptographic webhook verification.

Resend's current documentation confirms inbound receiving, attachment retrieval, signed webhooks, at-least-once delivery, and standards-based Message-ID threading. Resend currently lists a free 3,000-email/month plan and a $20/month 50,000-email Pro plan, making it cost-effective for launch. See the official Resend pricing and receiving documentation.

## Infrastructure — cost-effective launch

### Stage 1: small production

- one Node/Express service;
- managed email/SMS/WhatsApp/telephony providers;
- FastText model artifact built in CI;
- Groq only for requests that actually need complex reasoning;
- SQL.js only while the application is genuinely single-instance and low-write;
- object storage for chat/media uploads;
- no Kubernetes, Kafka or dedicated GPU.

Railway currently offers a $5/month Hobby minimum and usage-based billing, which is suitable for a small single-service deployment. Supabase Pro starts at $25/month if managed PostgreSQL, backups and storage are needed. Cloudflare R2 currently charges $0.015/GB-month for standard storage with no egress bandwidth charge, making it attractive for media/object storage.

### Stage 2: proven traffic

Move the database to managed PostgreSQL when concurrent writes, backups, reporting or multiple application instances justify it. Add Redis only when multiple instances make ephemeral presence/rate-limit/OTP state necessary. Add a queue when background matching or media processing begins competing with interactive chat latency.

## What should remain conditional

Do not make these launch blockers:

- custom IoT infrastructure;
- custom WebRTC infrastructure;
- direct cross-border money custody/FX;
- autonomous emergency dispatch;
- police/security operations owned by Kurukoo;
- large-scale celebrity access;
- fully automated public video publishing.

Kurukoo should own the **conversation, coordination, identity, request state and policy layer**, while regulated or capital-intensive execution remains with compliant providers.

## Immediate implementation priorities

1. Keep `CATEGORY_BY_SKILL` as the canonical taxonomy.
2. Do not create another Economic Request engine.
3. Make missing skill flows resolve through safe category defaults rather than bespoke services.
4. Expand deterministic canonical-skill routing so the chat can reach the existing economic machinery for the full catalogue.
5. Keep artist booking on the shared lifecycle and generalise reusable verification/escrow capabilities rather than creating artist-specific infrastructure.
6. Finish channel consolidation so every webhook reaches the same conversation layer.
7. Keep email threaded, signed, idempotent and linked to the existing identity.
8. Move media to object storage before meaningful upload volume.
9. Treat PostgreSQL/Redis/queues as scale-triggered migrations, not launch requirements.

## Decision

The blueprint is **real-life feasible with these boundaries**. The cost-effective strategy is to make Kurukoo excellent at coordination and conversation, and deliberately buy the expensive/regulated primitives from providers instead of implementing them in-house.

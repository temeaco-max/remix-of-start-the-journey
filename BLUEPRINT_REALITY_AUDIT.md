# Kurukoo Blueprint Reality & Cost Audit

Date: 2026-08-10

## Executive conclusion

Kurukoo's core mandate is feasible if it is treated as a **conversation-first coordination platform**, not as a company that owns every downstream capability. The practical architecture is:

`channel transport -> verified identity -> Memory Profile -> unified conversation -> canonical skill + requirements -> shared Economic Request lifecycle -> provider/payment integrations -> AI only where it adds value`.

The blueprint is strongest when it follows that model. It becomes expensive or operationally risky when it implies Kurukoo should directly operate regulated, capital-intensive or real-time infrastructure.

## Universal economic architecture

Every economic intent must use the same consumer-facing and domain lifecycle:

`conversation -> intent -> requirement capture -> discovery -> availability -> quote -> explicit customer confirmation -> payment/escrow where applicable -> fulfilment -> completion -> rating/dispute/Points/Memory`.

The canonical skill catalogue in `src/services/skillFlows.ts` defines the economic skill and category. Skill-specific requirements and capabilities are configuration/policy within that shared framework; they are not separate product architectures.

Examples include rides, food ordering, keke/okada, repairs, vehicle purchases, tickets, worker hiring, product sourcing and creator/artist booking. A category may require more fields or additional capabilities, but it must still enter the same Economic Request lifecycle.

### Creator / artist rule

Artist and celebrity functionality is **not a privileged economic system**. `verified_artist` is a canonical `events-entertainment` skill and must use the same Economic Request, requirement capture, discovery, availability, quote, confirmation, payment/escrow, fulfilment and dispute machinery as every other economic skill.

Artist-specific logic is permitted only where the real-world transaction genuinely requires it, principally:

- creator/artist identity and representation verification;
- event-specific requirements such as date, venue, audience and duration;
- technical rider and travel requirements;
- negotiated terms/contract handling;
- provider-side verification and compliance tooling.

The consumer must never be told that an artist is available merely because a profile exists. Representation must be verified, availability must be confirmed, terms must be quoted, and the customer must explicitly confirm before payment or escrow is committed.

The same principle applies to any scarce or regulated provider: specialized verification is a capability/policy, not a reason to create a separate economic request architecture.

## Feasibility matrix

| Blueprint area | Real-world feasibility | Launch approach |
|---|---|---|
| Web/PWA chat | High | Ship as the canonical interface; one frontend client and one chat API |
| WhatsApp/SMS/USSD/Telegram | High | Provider webhooks + shared conversation service |
| Email | High | Resend inbound/outbound + signed webhooks + message threading |
| IVR | Medium-high | Provider-managed telephony; Kurukoo owns conversation state, not carrier infrastructure |
| FastText intent routing | High | Build model in CI, load at runtime; deterministic fallback |
| SmolLM2 simple queries | Medium | Local inference where CPU/RAM budget allows; otherwise low-cost hosted inference |
| Groq complex reasoning | High | Use a small/fast production model first and escalate only when needed |
| Memory Profile | High | One canonical phone identity with optional verified email/SSO attributes |
| Points | High | Keep closed-loop and ledgered; disable where regulation/economics require it |
| Escrow | Medium | Use regulated payment providers and explicit state transitions; do not hold customer funds in application memory |
| Nearby Pulse | Medium-high | Use coarse geospatial queries and TTL presence; avoid permanent high-frequency GPS tracking |
| Deferred Request Protocol | High | DB-backed intentions + scheduled jobs + notification adapters |
| Universal vendor ordering | High | Shared order flow; provider catalog remains conversational |
| Sports/community | High | Marketplace/community coordination; do not attempt to become a sports data rights holder |
| Event coverage | Medium | Human moderation + explicit UGC rights; pay per approved task |
| How-to video | High | Generate scripts, low-cost TTS/render, human moderation; publish only after rights/safety checks |
| Security personnel | Medium | Verified/vetted providers, duration bookings, check-in/out; police/security operations remain with licensed providers |
| Health/emergency | Medium | Coordination and routing only; clear emergency escalation and no autonomous diagnosis |
| Cross-border payments | Medium-low | Partner with regulated rails; do not implement FX custody or money transmission in-house |
| WebRTC | Medium | Use managed STUN/TURN; introduce only for workflows that genuinely require live media |
| IoT bridge | Medium-low | Managed MQTT/IoT gateway with strict device allowlists; defer until demand proves it |
| Celebrity/artist booking | Medium | Treat as verified creator/artist marketplace within the universal economic lifecycle; never imply direct celebrity access without verified representation |
| Programmatic SEO | High | Generate from structured data and approved templates; avoid thin AI pages |

## Celebrity / creator feature correction

The repository contains an `artistBookingService` and an admin artist surface. These are appropriate only as a **policy adapter and provider/admin tooling** around the universal economic system; they must not become a separate consumer booking architecture.

Required lifecycle:

`creator/representative onboarding -> identity + representation verification -> shared requirement capture -> availability/terms -> quote -> customer confirmation -> regulated payment/escrow -> event delivery -> check-in/out -> dispute window -> release`.

A manager name or phone number is not proof of representation. Booking is therefore blocked until the artist profile is explicitly marked verified. The chat should present this as a verified creator/artist booking request, never as a promise of direct celebrity access.

## Chat expectations for 2026

The primary chat should behave like a modern AI workspace while remaining Kurukoo's economic interface:

- streaming output
- Markdown/code/table rendering
- persistent conversations
- search/history navigation
- regenerate/edit/copy/delete
- attachments with upload progress and safe limits
- voice input where supported
- responsive mobile composer
- accessible keyboard navigation
- model/tool status without exposing private chain-of-thought
- citations/source cards when web or external data is used
- confirmation cards before money, booking, escrow or irreversible actions
- progress/deferred states for asynchronous provider matching
- undo/cancel for queued actions where possible
- unified identity and conversation across channels

The UI should never ask for a phone number merely to continue when a valid authenticated session already exists, and it must never use a client-stored phone number as authorization.

## Cost-effective AI policy

1. Deterministic command/skill detection first.
2. FastText for low-cost classification.
3. Local SmolLM2 only for short/simple requests when resource budget permits.
4. Groq for complex requests, preferably a small production model first.
5. Cache safe, repeatable answers with short TTLs.
6. Do not send provider matching/payment/identity data to a large model when a deterministic service can answer it.
7. Log token/model/provider usage by request class so model routing can be tuned from real economics.

Groq's current published pricing makes a small model especially attractive for real-time workloads; Llama 3.1 8B Instant is listed at $0.05/M input and $0.08/M output tokens. See https://groq.com/pricing/.

## Email reality

Email should be treated as a durable asynchronous conversation transport, not just a notification sender.

Production requirements:

- inbound `email.received` webhook
- signed webhook verification
- idempotent event processing
- Message-ID correlation
- `In-Reply-To` and `References` on replies
- plain-text and HTML presentation
- attachments handled through provider storage/API, not base64 blobs in the messages table
- bounce/complaint/delivery events
- suppression handling
- verified sender domain with SPF/DKIM/DMARC
- explicit mapping from verified email attribute to the canonical phone identity
- rate limits and anti-loop protection

Resend currently supports inbound email, attachments and `email.received` webhooks, and its July 2026 Message-ID support makes standards-based threading practical. See https://resend.com/features/inbound and https://resend.com/changelog/message-id-for-sent-emails.

## Infrastructure economics

### Launch

Prefer:

- one Node/Express service
- SQL.js only while single-instance traffic is genuinely small
- object storage for uploads
- managed email/SMS/WhatsApp/telephony providers
- FastText artifact baked into the build
- Groq for complex inference
- no Kubernetes, Kafka or dedicated GPU cluster

### Scale trigger

Move to PostgreSQL when concurrent writes, backups, reporting or multi-instance deployment make the single-file database a constraint.

Move ephemeral presence/rate limits/OTP state to Redis when there is more than one application instance.

Move AI-heavy asynchronous work to a queue when jobs begin competing with interactive chat latency.

Move media to object storage/CDN immediately rather than storing large attachments in SQLite.

## Blueprint items that should remain conditional

The following should not be treated as launch blockers unless there is validated demand and a compliant provider path:

- custom IoT infrastructure
- custom WebRTC infrastructure
- direct cross-border money movement
- autonomous emergency dispatch
- direct police/security operations
- large-scale celebrity/artist access
- fully automated video publishing

The blueprint should define the **user outcome**, while the implementation chooses the cheapest compliant provider that can deliver it.

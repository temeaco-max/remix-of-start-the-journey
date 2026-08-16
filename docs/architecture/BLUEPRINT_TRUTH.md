# Kurukoo Blueprint Implementation Truth

This document is the current convergence index between the Blueprint and the repository. It does not replace `BLUEPRINT.md`; it records what the repository can truthfully claim today and what remains gated, partial or externally dependent.

## Canonical status vocabulary

- **IMPLEMENTED_AND_VERIFIED** — repository implementation and relevant behavioural coverage exist.
- **IMPLEMENTED_PARTIALLY_WIRED** — meaningful implementation exists but one or more product surfaces/lifecycles remain incomplete.
- **IMPLEMENTED_FEATURE_FLAGGED** — repository capability is present but deliberately disabled until prerequisites are satisfied.
- **PROVIDER_DEPENDENT** — repository boundary is implemented; real-world activation depends on a configured external provider or operational prerequisite.
- **FOUNDATION_ONLY** — low-level foundation exists but the complete product lifecycle is not implemented.
- **NOT_IMPLEMENTED** — no adequate repository implementation exists.
- **SUPERSEDED** — the Blueprint design was replaced by the converged architecture.
- **OBSOLETE** — historical requirement no longer belongs in the active product.

## Core architecture truth

| Capability | Current truth | Status |
|---|---|---|
| Conversation-first Chat | `canonicalChatTurnService` is the shared conversation/action orchestration authority. | IMPLEMENTED_AND_VERIFIED |
| Intent routing | FastText + deterministic routing + configured AI escalation. | IMPLEMENTED_AND_VERIFIED |
| FastText | Real model path exists and is used for representative routing; fallback remains truthful. | IMPLEMENTED_AND_VERIFIED |
| Local SmolLM2 | Local generation boundary exists and remains optional/cost-controlled; the memory-safe 360M q4 checkpoint is covered by direct, unifiedAiEngine, canonical Chat, and first-class persona integration tests. | IMPLEMENTED_FEATURE_FLAGGED |
| Unified AI | Existing provider-neutral AI layer supports configured hosted providers. | IMPLEMENTED_AND_VERIFIED |
| Skill catalogue | `skillFlows.ts` is canonical for skill/category/requirements/capabilities. | IMPLEMENTED_AND_VERIFIED |
| Universal Economic Request | Shared request lifecycle is the canonical economic orchestration model. | IMPLEMENTED_AND_VERIFIED |
| Deferred requests | Open intentions/deferred request machinery exists with bounded re-evaluation and notification boundaries. | IMPLEMENTED_AND_VERIFIED |
| Memory Profile | Single canonical user/profile authority exists; fabricated location/balance defaults were removed. Authenticated users can list active fact-level context and revoke their own retained facts without exposing source references or affecting another account. | IMPLEMENTED_PARTIALLY_WIRED |
| Living Memory | Bounded multi-tier working context and lifecycle jobs exist. Current retrieval uses a launch-efficient relevance implementation; Blueprint fidelity to FastText embeddings must be treated as a measured optimisation choice, not an automatic requirement. Admin lifecycle jobs and owner-scoped fact revocation preserve the retention boundary. | IMPLEMENTED_PARTIALLY_WIRED |
| Agents | Bounded autonomous goal runtime, tool registry, ownership, risk and lifecycle exist. First-class persona delegation emits a typed Brain event and receives policy-reviewed local-model preflight before its stored persona instruction is sent to SmolLM2 for both guest and authenticated Chat; only authenticated owners enter owner-scoped points charging, and admin execution remains operator-controlled. | IMPLEMENTED_FEATURE_FLAGGED |
| Notifications | Internal notification authority exists; external push remains separately configurable. | IMPLEMENTED_AND_VERIFIED |
| Presence / Nearby Pulse | Nearby Radar is ready by default for local discovery without claiming a live broadcast. Authenticated eligible providers can explicitly Go Live through the canonical Pulse route; location is supplied explicitly, public display is fuzzed, sessions expire, and Chat nudges reuse the internal notification surface. External/device behaviour remains deployment-dependent. | IMPLEMENTED_FEATURE_FLAGGED |
| Topics | Bounded shared Topic authority exists with moderation/privacy/SEO boundaries. | IMPLEMENTED_AND_VERIFIED |
| Advertising | Canonical campaign/ad placement authority exists, including first-party campaign support and private-Chat ad boundary. | IMPLEMENTED_AND_VERIFIED |
| Referrals | Referral attribution, qualification and idempotent reward path exists. | IMPLEMENTED_AND_VERIFIED |
| Points | Points ledger/contributor rewards exist with bounded reward semantics. | IMPLEMENTED_AND_VERIFIED |
| Subscriptions | Consumer/provider plan boundaries and sandbox/QA paths exist; live payment is external. | IMPLEMENTED_FEATURE_FLAGGED |
| Money Circle | Circle foundations and tests exist; live monetary transfer remains gated. | IMPLEMENTED_FEATURE_FLAGGED |
| PWA | Installable PWA, shared Chat-first shell, offline fallback, version-safe asset caching, install/update prompts, reconnect messaging, and foreground service-worker refresh exist. Actual installed iOS, Android, macOS, and Windows behavior and push delivery remain external device-validation tasks. | IMPLEMENTED_PARTIALLY_WIRED |
| Progressive trust | Provider-neutral trusted-device records, independent push challenges, channel evidence, and time-bound location consent exist behind explicit production gates. | IMPLEMENTED_PARTIALLY_WIRED |
| Guest/authenticated personalization | The Chat client hides private workspace actions for guests and exposes profile-linked context after authentication; direct protected APIs remain fail-closed. | IMPLEMENTED_PARTIALLY_WIRED |

## External/channel truth

| Capability | Current truth | Status |
|---|---|---|
| Web Chat | Active canonical UI/channel. | IMPLEMENTED_AND_VERIFIED |
| WhatsApp | Adapter and parity/webhook boundaries exist; real provider activation remains external. | PROVIDER_DEPENDENT |
| Telegram | Bot API adapter plus an explicit personal MTProto linked-device boundary exist; real provider activation remains external. | PROVIDER_DEPENDENT |
| SMS | Adapter boundary exists; carrier/provider activation remains external. | PROVIDER_DEPENDENT |
| USSD | Repository boundary exists; carrier/shortcode activation remains external. | PROVIDER_DEPENDENT |
| Email | Canonical email channel and Resend boundary exist; email OTP request/verification is implemented behind `KURUKOO_EMAIL_OTP_ENABLED` and still requires provider activation. | PROVIDER_DEPENDENT |
| Phone OTP delivery | OTP record generation, hashing, expiry, attempt limits, and verification exist; no OTP-specific phone delivery adapter is wired. Africa’s Talking remains the separate SMS/USSD channel provider boundary. | FOUNDATION_ONLY |
| FCM/PWA push | Internal notification persistence and authenticated device registration exist; real external push and approval delivery require Firebase configuration, device permission, and delivery evidence. | PROVIDER_DEPENDENT |
| Device trust / push approval | Device registration, status, pending challenges, approve/deny actions, inventory, and revocation bind trusted devices without treating browser access as phone ownership. | IMPLEMENTED_FEATURE_FLAGGED |
| Channel evidence | Signed/validated WhatsApp, Telegram, email, SMS and other canonical inbound adapters record bounded evidence through the shared channel boundary; the authenticated Connect workspace shows provider readiness separately from owner-scoped personal linked-device state; evidence does not replace phone verification automatically. | IMPLEMENTED_PARTIALLY_WIRED |
| Location consent | Discover requests browser permission only for authenticated users, stores coarse purpose-bound consent with expiry, and does not claim background location. Nearby Pulse also requires an explicit valid location for provider broadcast; Radar readiness does not infer location. | IMPLEMENTED_PARTIALLY_WIRED |
| Voice | Repository voice boundary exists; real provider activation remains external. | PROVIDER_DEPENDENT |
| Private-number masking | Owner-scoped proxy allocation, resolution, expiry/release, execution-connector integration, and protected Coordinator lifecycle telemetry exist; a local proxy number is not a routable real telephony number. | PROVIDER_DEPENDENT |
| WebRTC | Authenticated signalling foundation exists, but create/peer/signal endpoints now fail closed unless `FF_WEBRTC=true` and an approved STUN/TURN or relay prerequisite is configured. TURN/STUN, client media lifecycle, consent, browser interoperability, and production relay remain external activation tasks. | FOUNDATION_ONLY |
| MQTT / IoT | MQTT bridge foundation exists; secure device identity, discovery, authorisation, state sync and production broker architecture are not yet a complete product capability. | FOUNDATION_ONLY |

## Economic / network truth

Every economic skill is considered fully implemented only when it satisfies the shared definition of done in the Blueprint Addendum: routing, requirement capture, Economic Request, provider/inventory discovery, availability semantics, quote semantics, payment where required, fulfilment/dispatch where required, evidence, cancellation/dispute, Memory Profile integration, conversation integration and behavioural tests.

The presence of a skill tag, route or card alone is not completion evidence.

## PWA truth

The PWA is the reference application experience for future iOS/Android clients. The current repository should continue converging toward:

```text
Public Web
  = discovery / SEO / resources / marketing / public network

PWA / native application family
  = conversation / personal workspace / requests / reminders / memory /
    notifications / Discover / tasks / Points / safety / account
```

The installed application should launch into the conversation-first experience rather than a dashboard-first experience. The repository now provides the bounded shell behavior for install prompts, service-worker updates, cached public/app surfaces, truthful offline messaging, reconnect messaging, and foreground refresh. Native clients should inherit this same design system and interaction model. This does not claim that an installed app has been independently validated on a real iOS, Android, macOS, or Windows device, nor that push delivery is live.

## Progressive trust contract

Kurukoo preserves phone as the primary channel identity while allowing users to establish trust progressively. A supplied phone number, an authenticated browser, a trusted device, a linked WhatsApp session, a verified email, a social-account connection, and verified phone ownership remain separate evidence types. Each evidence type may unlock only the capabilities it actually supports.

Production activation is explicit through `KURUKOO_PROGRESSIVE_TRUST_ENABLED`, `KURUKOO_PUSH_APPROVAL_ENABLED`, `KURUKOO_CHANNEL_EVIDENCE_ENABLED`, and `KURUKOO_LOCATION_CONSENT_ENABLED`. These flags default to fail-closed in production when absent. FCM registration may bind an authenticated device, but push delivery is not claimed unless the provider accepts the message and delivery evidence exists.

The central Chat surface is personalized by state. Guests receive public conversation and discovery affordances without private reminders, memory, Points, tasks, saved context, or account notifications. Authenticated users receive their own workspace state. Discover may request coarse, purpose-specific location permission while open; the system does not silently collect background location from the browser.

## Feature flags

`src/services/featureFlags.ts` now contains a typed registry with lifecycle and prerequisite metadata. Feature flags are not a substitute for external readiness: a flag may remain disabled because a provider, broker, relay, market or risk prerequisite is missing.

## Cost truth

Kurukoo remains aligned with the launch cost strategy:

- SQL.js/single-instance while the workload permits it.
- deterministic routing/FastText before expensive inference.
- local models before paid inference when quality is sufficient.
- hosted providers behind explicit configuration and quota controls.
- WebRTC/precise location only when a high-value use justifies the cost.
- Redis/PostgreSQL/queues/object storage only when actual workload or regulatory/provider requirements justify them.

## Remaining convergence priorities

1. Keep `BLUEPRINT.md`, Addendum, Ecosystem and product documents synchronized to the same current truth.
2. Complete the product-grade PWA experience and make it the reference for future native apps.
3. Continue end-to-end behavioural completion of the broad skill/category catalogue rather than treating routing coverage as completion.
4. Finish real provider activation and delivery validation for Telegram personal MTProto sessions, WhatsApp linked devices, FCM push approval, Resend email, and any phone-dependent channel.
5. Finish provider-independent portions of private number masking, WebRTC and MQTT/IoT and keep them feature-flagged until real infrastructure is present.
6. Continue actor/scenario testing across contributors, providers, businesses, agents and users so every canonical flow behaves as one ecosystem.
7. Keep external activation boundaries truthful and explicit.


## Outcome-completeness truth

The executable outcome matrix is generated from the canonical skill-flow and feature registries with `npm run audit:outcome-completeness`; its machine-readable and Markdown evidence lives at `data/audits/outcome-completeness.json` and `data/audits/outcome-completeness.md`. `npm run test:outcome-completeness` enforces 205 canonical skills, 46 families, zero missing canonical flow definitions, populated lifecycle states, canonical owners, execution boundaries and recovery paths.

The matrix classifies every current skill as **REPOSITORY_READY_EXTERNAL_ACTIVATION** when its canonical repository path exists but a capability-specific provider, operational, delivery or evidence boundary remains deployment-dependent. This does not mean that external execution, payment, messaging, voice, fulfilment, provider availability or completion is live. It means the repository-side lifecycle and activation seam are present and truthfully bounded.

The outcome unit is the user's objective across the applicable lifecycle, not the presence of a skill tag, route or card. Brain/context arbitration remains semantic and planning authority; canonical services remain the sole mutation and authorization owners. The matrix is evidence of convergence and gap detection, not a second orchestration subsystem.

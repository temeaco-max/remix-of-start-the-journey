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
| Local SmolLM2 | Local generation boundary exists and remains optional/cost-controlled. | IMPLEMENTED_FEATURE_FLAGGED |
| Unified AI | Existing provider-neutral AI layer supports configured hosted providers. | IMPLEMENTED_AND_VERIFIED |
| Skill catalogue | `skillFlows.ts` is canonical for skill/category/requirements/capabilities. | IMPLEMENTED_AND_VERIFIED |
| Universal Economic Request | Shared request lifecycle is the canonical economic orchestration model. | IMPLEMENTED_AND_VERIFIED |
| Deferred requests | Open intentions/deferred request machinery exists with bounded re-evaluation and notification boundaries. | IMPLEMENTED_AND_VERIFIED |
| Memory Profile | Single canonical user/profile authority exists; fabricated location/balance defaults were removed. | IMPLEMENTED_PARTIALLY_WIRED |
| Living Memory | Bounded multi-tier working context and lifecycle jobs exist. Current retrieval uses a launch-efficient relevance implementation; Blueprint fidelity to FastText embeddings must be treated as a measured optimisation choice, not an automatic requirement. | IMPLEMENTED_PARTIALLY_WIRED |
| Agents | Bounded autonomous goal runtime, tool registry, ownership, risk and lifecycle exist. | IMPLEMENTED_FEATURE_FLAGGED |
| Notifications | Internal notification authority exists; external push remains separately configurable. | IMPLEMENTED_AND_VERIFIED |
| Presence / Nearby Pulse | Presence/trick-bridge foundations and UI controls exist; live external/device behaviour is deployment-dependent. | IMPLEMENTED_FEATURE_FLAGGED |
| Topics | Bounded shared Topic authority exists with moderation/privacy/SEO boundaries. | IMPLEMENTED_AND_VERIFIED |
| Advertising | Canonical campaign/ad placement authority exists, including first-party campaign support and private-Chat ad boundary. | IMPLEMENTED_AND_VERIFIED |
| Referrals | Referral attribution, qualification and idempotent reward path exists. | IMPLEMENTED_AND_VERIFIED |
| Points | Points ledger/contributor rewards exist with bounded reward semantics. | IMPLEMENTED_AND_VERIFIED |
| Subscriptions | Consumer/provider plan boundaries and sandbox/QA paths exist; live payment is external. | IMPLEMENTED_FEATURE_FLAGGED |
| Money Circle | Circle foundations and tests exist; live monetary transfer remains gated. | IMPLEMENTED_FEATURE_FLAGGED |
| PWA | Installable PWA, shared shell and Chat-first direction exist. Product-grade mobile/native-app polish remains a convergence task. | IMPLEMENTED_PARTIALLY_WIRED |

## External/channel truth

| Capability | Current truth | Status |
|---|---|---|
| Web Chat | Active canonical UI/channel. | IMPLEMENTED_AND_VERIFIED |
| WhatsApp | Adapter and parity/webhook boundaries exist; real provider activation remains external. | PROVIDER_DEPENDENT |
| Telegram | Adapter boundary exists; real provider activation remains external. | PROVIDER_DEPENDENT |
| SMS | Adapter boundary exists; carrier/provider activation remains external. | PROVIDER_DEPENDENT |
| USSD | Repository boundary exists; carrier/shortcode activation remains external. | PROVIDER_DEPENDENT |
| Email | Adapter and route boundary exist. | PROVIDER_DEPENDENT |
| FCM/PWA push | Internal notification persistence exists; real external push requires Firebase configuration and delivery evidence. | PROVIDER_DEPENDENT |
| Voice | Repository voice boundary exists; real provider activation remains external. | PROVIDER_DEPENDENT |
| Private-number masking | Privacy/proxy mapping abstraction exists; the local proxy number is not a routable real telephony number. | FOUNDATION_ONLY |
| WebRTC | Authenticated signalling foundation exists. TURN/STUN, client media lifecycle and production relay are not equivalent to signalling and remain gated. | FOUNDATION_ONLY |
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

The installed application should launch into the conversation-first experience rather than a dashboard-first experience. Native clients should inherit this same design system and interaction model.

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
4. Finish provider-independent portions of private number masking, WebRTC and MQTT/IoT and keep them feature-flagged until real infrastructure is present.
5. Continue actor/scenario testing across contributors, providers, businesses, agents and users so every canonical flow behaves as one ecosystem.
6. Keep external activation boundaries truthful and explicit.

# Kurukoo Broad Product Completeness Contract

Status: Active

This contract sits above visual convergence. It ensures the visual rebuild cannot accidentally remove a capability, content family, monetisation surface, administrative control, brand primitive, conversational interaction, or client-parity requirement.

## 1. Product core

Kurukoo is a conversation-first operating environment.

Primary product concepts:
- Desk: authenticated personal operating surface.
- Agent: conversational intelligence available through `/chat` and embedded contexts.
- Conversations: durable interaction identity at `/chat/:conversationId`.
- Shared conversations: `/share/:shareId`.
- Requests: durable economic/work coordination objects.
- Tasks: durable work/contribution objects.
- Discover: discovery of people, providers, products, opportunities and useful activity.
- Connect: channels, devices, storage and approved external services.
- Memory: owner-scoped context and provenance.
- Agents: bounded autonomous workers/goals.
- Opportunities: participation/discovery objects.
- Artifacts: files, recordings and generated outputs.
- Safety: check-ins, trusted contacts and explicit safety boundaries.

No visual design may remove these concepts because they were not shown in a reference image.

## 2. Agent / Chat completeness

The Chat/Agent surface must preserve:
- conversation list/history
- new conversation
- message stream
- streaming/activity/typing state
- composer and send/cancel/edit controls
- attachments and artifacts
- voice entry and voice state
- context inspector / right drawer
- search
- notifications
- memory context
- current request/goal context
- request/offer/task continuation cards
- provider/evidence state
- quote/payment/confirmation boundaries
- deferred/waiting state
- cancellation/retry/recovery
- natural-language clarification
- interruption and topic switching
- user correction
- multi-goal continuity
- channel/QR continuation
- authentication continuation
- offline/reconnect state
- safety interruption
- agent pause/resume/cancel
- truthful external-outcome language

The Agent is the intelligence users talk to; Desk is the operating environment around that intelligence.

## 3. Public content / SEO completeness

The public product family must include, where applicable:
- overview/about
- features
- how it works
- explore
- discover
- network
- channels
- topics list/detail
- resources list/detail
- help/support
- contact
- pricing
- partners
- advertise
- careers
- blog/media
- developers/API
- legal/terms/privacy/safety/disclaimer/cookies
- status/offline where operationally required

Public pages require meaningful search intent, H1/H2 hierarchy, internal linking, unique metadata, canonical URLs, truthful structured data where applicable, accessible content, freshness/ownership where relevant, and contextual Chat handoff.

Private/authenticated pages are not SEO landing pages and should use appropriate noindex/private semantics.

## 4. Providers and network

Provider surfaces must account for:
- identity/profile
- capability/skills
- verification/evidence
- availability/presence
- service radius/coverage
- ratings/reviews
- leads
- communications
- request participation
- offers/quotes
- fulfilment lifecycle
- subscriptions/plan state
- points/lead economics
- disputes/recovery
- contributor/business/provider role relationships

The provider UI must not collapse profile, verification, availability, payment readiness or fulfilment evidence into one unsupported status.

## 5. Subscriptions and monetisation

Every monetisation medium must have both operator and user-facing state coverage.

Consumer/provider/business/agent monetisation surfaces include:
- subscriptions/plans
- Points
- Points top-up
- provider lead charges
- wallet/payment state
- checkout
- escrow/payment boundaries
- commissions
- referrals/rewards
- affiliate/sourced-product flows
- advertising/campaigns
- promoted/discovery inventory
- business/provider plans
- agent/service economics

Each monetary surface must distinguish:
- configured pricing
- eligible action
- user confirmation
- payment initiation
- provider confirmation/evidence
- settlement
- fulfilment
- refund/cancellation/dispute

No UI may infer settlement from a client-side reference or optimistic response.

## 6. Admin / Control Room completeness

Admin must cover:
- Control Room/platform health
- conversations
- providers
- economic requests/orders/payment/escrow
- moderation
- compliance
- notifications
- integrations
- AI/agents/routing
- users
- pricing/subscriptions
- referrals/commissions
- partnerships
- trust/scam
- social/creators/celebrity
- analytics/revenue
- marketing/advertising
- content/curation
- SEO
- settings
- roadmap
- secure provider/API credentials
- environment/configuration readiness
- audit/recovery

## 7. Admin API key / environment management

The Admin settings surface must expose configuration metadata, not secret values.

For every governed environment variable / key:
- variable name
- subsystem/provider
- required vs optional
- configured/unconfigured
- enabled/disabled
- last validation result
- safe masked fingerprint if a secret exists
- readiness/health
- rotation/reload semantics
- dependent features
- documentation/help

Never render secret values, `.env` contents, private keys, JWT secrets, webhook secrets or provider tokens back to the browser.

Editing should use a secrets-management/provider boundary or an explicit controlled server-side mechanism. The UI may not treat `.env` as a general-purpose editable text file.

## 8. Brand / visual primitives

A single brand contract governs site-wide:
- Kurukoo logo variants
- logo minimum size and clear space
- favicon/app icon
- icon family
- icon semantic names
- icon visual weight
- icon optical size by context
- button/icon-button dimensions
- navigation icon dimensions
- header logo dimensions
- app icon dimensions
- dark/light treatment where applicable
- alt/accessibility labels

The same icon and logo asset should be reused rather than route-specific redraws.

## 9. Client parity

Web, PWA, iOS and Android represent the same canonical product resources.

Parity covers:
- Desk/home
- Agent/Chat
- Discover
- Requests
- Tasks
- Connect
- Notifications
- Memory where supported
- durable resource details
- authentication continuation
- QR/deep links
- push/notification state
- offline/reconnect state
- account/session state

Native/PWA may present platform-specific UI, but may not invent a conflicting product vocabulary or resource identity.

## 10. Completion rule

A surface is not complete until:
1. product purpose is correct;
2. required content is present;
3. required capabilities are represented;
4. actions and recovery exist;
5. state coverage is appropriate;
6. navigation and deep links work;
7. SEO/public semantics are correct where applicable;
8. brand primitives are consistent;
9. monetisation/truth boundaries are explicit;
10. Web/PWA/native/Admin representation is accounted for where relevant;
11. the visual design system has been applied without reducing the product architecture.

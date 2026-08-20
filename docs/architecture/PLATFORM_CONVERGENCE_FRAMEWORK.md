# Kurukoo Platform Convergence Framework

## Purpose

This document is the implementation frame for the full Kurukoo product. It is deliberately a consolidation map, not a new parallel architecture.

Kurukoo keeps every intended outcome, channel and revenue path while reducing duplicate domain models and decision points.

## Canonical layers

```text
Channels / Web / Mobile / QR / Voice / USSD / WhatsApp / Telegram / SMS
                         |
                   Canonical Chat
                         |
            Conversation act + AI Router
                         |
              Skill + Instructions + Memory
                         |
                  Execution Contract
                         |
                 Capability Registry
                         |
       +-----------------+------------------+
       |                 |                  |
   Economic Request    Agent Goal       Assistance
       |                 |                  |
       +-----------------+------------------+
                         |
              Evidence / Completion
                         |
        +----------------+----------------+
        |                                 |
   Commercial Ledger                Notifications
        |                                 |
   Points / Credits                  Follow-up / Watch
        |
  Provider / Business / POS / Agent Network
        |
  Products / Inventory / Offers / Promotions
        |
             Discover composition layer
```

## Canonical objects

### Party

One identity model for users, providers, businesses, POS agents and Kurukoo-owned agents. Role/capability profiles are attached rather than creating separate identity silos.

### Product / Inventory Item

One canonical product representation. Sources may include Kurukoo businesses, providers, WhatsApp catalogues, connected stores and affiliate feeds. Source/provenance remains explicit.

### Offer / Opportunity

One canonical actionable opportunity. A promotion, Daily Pick, provider availability, classified opportunity, topic-led opportunity or affiliate offer is represented as an opportunity with source, placement, validity, targeting and actions.

### Channel Message

Channel-specific transport is an adapter. Business meaning belongs to canonical Chat and capability services.

### AI Route Decision

One routing decision records whether the request needs no model, local inference, free/low-cost hosted inference or higher-cost hosted reasoning. Provider choice is dynamic and health/cost/quota-aware.

### Agent Goal

An AI agent is a bounded actor using the same skills, capabilities, commercial rules, memory policy and evidence requirements as human-provider workflows.

## Discover

Discover is the composition surface for:

- For You
- Nearby
- Today / Daily Picks
- Topics
- Opportunities
- Products / Offers
- Explore Kurukoo

Discover does not become a second database. It composes canonical products, offers, providers, topics, opportunities, events and sponsored placements from their owning services.

Every Discover item must have an actionable continuation such as Ask, Buy, Book, Get Quote, Follow, Watch, Comment, Order, Call or Share where appropriate.

## Revenue paths that must remain first-class

- Provider lead/booking fees
- Provider subscriptions
- Sponsored Discover/category placements
- Product/affiliate commissions
- Transaction/service fees where applicable
- Agent subscriptions and AI usage
- POS/agent-network commissions
- Points/credit purchases and approved redemptions
- Optional communication/voice features

## Channel monetisation and fulfilment

Channels are both access and distribution paths. Each channel can carry canonical requests, provider leads, notifications, onboarding and commercial actions without containing its own economic/skill engine.

Voice/calling, masked provider communication and real-time provider tracking are treated as adapters to canonical communications and execution state.

## Product discovery

Chat can surface products from:

- Kurukoo businesses/providers
- connected WhatsApp/online-store catalogues
- affiliate providers
- provider-declared inventory

Inventory may be stored with source, validity and availability metadata so a future request can discover it without forcing the user to search again.

## AI router

The router may select among:

1. deterministic rules / FastText
2. local SmolLM2
3. free/low-cost hosted capacity (for example Groq, Gemini or OpenRouter free models when available)
4. paid hosted reasoning (for example Mistral)
5. configured fallback provider

The router must not make promises about a provider's free quota. It uses live health/quota/cost policy and fails over safely.

## Public/product surfaces

The public acquisition/trust layer is part of the product system:

- Home
- Features / How it works
- For Users
- For Providers
- For Businesses
- For Agents
- Pricing
- Explore
- Resources
- Help Centre
- Blog / Topics
- About
- Careers
- Legal / Privacy / Terms / Safety

Public calls-to-action must lead into the corresponding canonical onboarding, Chat, provider, agent or commercial path rather than becoming disconnected marketing pages.

## Consolidation rules

1. One owner per route boundary.
2. One canonical AI orchestration boundary.
3. One canonical skill/behaviour/execution chain.
4. One canonical notification/event model with channel adapters.
5. One provider/business party identity model.
6. One product/inventory representation with source adapters.
7. One offer/opportunity representation with Discover as a composition layer.
8. Channel adapters never own economic business logic.
9. External tools/MCPs plug into the capability registry through approved adapters.
10. Existing feature outcomes are preserved unless explicitly retired for product/compliance reasons.

## Incremental implementation order

1. AI routing and provider capacity selection.
2. Product/inventory source convergence.
3. Offer/opportunity convergence for Discover and category placements.
4. Agent/POS commerce and Points top-up flows.
5. Communications adapter: masked calling + real-time provider session/tracking.
6. Channel parity and canonical Chat handoff.
7. Public/help/resource acquisition surfaces.
8. Repository consolidation after execution tests prove the owners.

The implementation should continuously preserve current canonical services and use adapters over them rather than creating parallel engines.

# Kurukoo Agentic Commerce & Storefronts

## Purpose

This document is a canonical product/architecture note for Kurukoo's commercial supply layer. It exists so future contributors, agents and designers do not accidentally treat affiliate commerce, partner referrals, advertising, business storefronts or Kurukoo providers as the same thing.

## Product principle

Kurukoo is **AI that gets things done**. Commerce is one route to an outcome, not Kurukoo's identity.

A user should normally start with an outcome, for example:

- "I need a laptop for university under £800."
- "Find me everything I need to launch my cleaning business."
- "I need somewhere to stay next weekend."
- "Find the right equipment for this job."

Kurukoo should understand the intent, gather relevant context, discover suitable supply, compare trustworthy evidence, ask for consent when an external/consequential action is required, then execute or hand off and track the outcome.

Canonical flow:

**intent → context → planning → discovery → evidence → recommendation → consent → execution/handoff → outcome**

## Supply types

### 1. Kurukoo providers

Providers are people, businesses, mobile workers, organisations or other eligible supply-side participants that can fulfil a real-world request through Kurukoo. Their availability, capability, verification and fulfilment state must come from canonical Kurukoo services; the UI must not invent them.

### 2. Business agentic storefronts

A business storefront is an executable representation of what a business offers. It is more than a profile or marketing page. Where supported, Kurukoo should be able to understand:

- products and services
- service area/location
- availability or operating state
- pricing/ranges where authoritative
- requirements and constraints
- booking/request rules
- evidence and media
- FAQs
- offers
- business AI agents
- fulfilment/request state

A storefront lets Kurukoo move from "discover this business" toward "use this business for this outcome" without creating a second disconnected commerce product.

### 3. Partner / affiliate supply

External commercial partners can provide products, services, inventory, travel, accommodation or other supply where Kurukoo has an authorised commercial/referral relationship.

Affiliate supply is a **rail**, not a trusted provider identity. Kurukoo must preserve the distinction between:

- what the partner actually returned;
- what Kurukoo inferred or recommended;
- what is sponsored;
- whether Kurukoo receives a referral/affiliate fee;
- whether the transaction happens inside Kurukoo or on the partner's service.

Examples may include commerce, refurbished products, travel, hosting/domains and other partner categories, subject to actual commercial agreements and technical access. Do not hard-code a partner as available merely because it is mentioned in product plans.

### 4. Advertising

Advertising is paid placement. It must remain clearly disclosed and separate from organic/provider/affiliate recommendations. Advertising should never silently alter an outcome recommendation.

## Agentic Storefront behaviour

The storefront is not intended to be a conventional cart-first ecommerce clone.

A user can begin with an outcome. Kurukoo may then:

1. understand the need;
2. identify requirements and missing information;
3. discover Kurukoo providers, business storefronts and authorised partner supply;
4. compare price, availability, suitability, location, delivery and other evidence when available;
5. disclose relevant commercial relationships;
6. recommend or present options without claiming unsupported facts;
7. obtain the required user approval before consequential action;
8. execute through a canonical Kurukoo boundary or hand off to the authorised external partner;
9. record evidence and outcome state;
10. support follow-up, reminders, support or dispute paths where available.

## Business Launch Agent

The Business Launch Agent is a high-value demonstration of the storefront model. A business owner can ask Kurukoo to help launch or improve a business. The journey may coordinate business setup, domain/hosting, website, email, service catalogue, pricing, booking/contact, payments, Google presence, marketing, local providers, an AI customer-service agent and launch follow-up.

Some steps may use Kurukoo capabilities, authorised integrations, providers or referral partners. The user should experience one coherent outcome rather than a list of vendor integrations.

## Commercial hierarchy

Do not optimise the product around affiliate revenue. Kurukoo's value hierarchy is:

1. paid execution and useful outcomes;
2. business subscriptions and services;
3. provider/marketplace value;
4. partner/affiliate referral revenue;
5. advertising.

Affiliate economics must never override suitability, trust, safety, evidence or user consent.

## Trust and truth requirements

The Kurukoo Intelligence contract applies to commerce:

- never invent inventory, price, delivery time, provider verification or completion;
- distinguish live/authoritative evidence from estimates and stale/unknown information;
- do not imply that an affiliate partner is a Kurukoo provider unless it actually is;
- disclose material commercial relationships at the point where they could affect user interpretation;
- preserve user control over purchases, bookings and other consequential actions;
- use canonical payment, fulfilment and audit boundaries for actions that Kurukoo controls;
- treat external partner handoffs as external unless reliable evidence confirms completion.

## Frontend expression

The frontend should lead with outcomes, not vendor logos. Good examples are:

- "Find me a laptop under £800"
- "Help me launch my business"
- "Find somewhere to stay"
- "Get the equipment I need for this job"

Vendor/partner identity should appear when it helps the user understand the source, terms, handoff or commercial relationship.

## What this document does not mean

This document does not authorise scraping, fake availability, fake rankings, hidden affiliate links, bypassing partner restrictions, automated purchasing without required consent, or claiming integrations/partnerships that have not actually been enabled.

It is a product contract and integration direction. Live partner availability, APIs, affiliate agreements, payment paths and fulfilment capabilities must be verified independently before being presented as active.

# Kurukoo Commercial & Agent Economy Contract

This document records the canonical implementation boundary for monetisation and AI-agent economic participation.

## Commercial authority

All monetised activity must ultimately produce a `commercial_ledger` event. Feature-local tables may describe pricing, inventory, campaigns, subscriptions, escrow or affiliate state, but they do not become a second revenue authority.

A commercial event carries:

- payer / payee
- represented party
- gross amount and currency
- Kurukoo platform fee
- provider entitlement
- processing cost and tax fields where known
- agent and skill context where applicable
- Economic Request correlation where applicable
- external settlement evidence
- idempotency key
- settlement status

No UI, model or agent may declare money received or a revenue event settled without canonical payment evidence.

## Commercial product catalogue

`commercial_products` is the shared catalogue for paid Kurukoo capabilities such as provider subscriptions, delegated agents, sports fees, sponsorship, advertising and future Money Circle fees. A product with price `0` is intentionally unpriced and must not be billed.

Consumer subscription plans remain in the existing country-aware `pricing` table; provider plan defaults remain in the existing provider tier configuration until migrated to the commercial catalogue without changing their entitlement semantics.

## Economic transactions

Economic Requests remain the canonical customer-to-provider lifecycle. Verified payment may create escrow; the commercial ledger records gross payment, configured platform fee and provider entitlement. Provider payout remains a separate operational settlement owned by the escrow/payment system.

## Kurukoo-owned agents

Kurukoo-owned agents are provider actors. Example: `agent_prayer_companion` is a Kurukoo-owned provider for Prayer-related skills.

Their commercial policy is explicit. They may be free, subscription-inclusive, premium, sponsored, or donation-enabled. AI text itself never determines the monetary policy.

## User-delegated agents

A user can attach a Kurukoo-provided agent to a selected skill and configure bounded instructions and authority. The delegated agent represents the user, not Kurukoo, for that task.

Delegation state records:

- owner
- agent runtime identity
- selected skill
- optional base/role agent
- instructions
- authority policy
- monthly product and price
- permission flags
- donation policy when explicitly enabled

The agent can perform only canonical capabilities permitted by its authority. Natural-language instructions cannot override safety, identity, payment, authorization, evidence or platform policy.

## Donations and offerings

Donation/offering capability is a first-class commercial capability. A payment destination must be canonically configured and verified as either a Kurukoo-owned agent or the represented owner. An AI agent may explain or request a donation, but it cannot invent or redirect the recipient.

Stripe payment success settles the existing commercial event by idempotency key. The ledger distinguishes Kurukoo-owned-agent revenue from pass-through represented-party funds.

## Recurring subscriptions

Subscription activation creates persistent billing state. The background commercial billing worker rechecks due subscriptions, attempts the existing payment adapter, records verified renewal revenue and moves repeatedly failed subscriptions to `past_due` rather than claiming renewal.

External activation is still required for a real production payment provider; the worker does not fabricate a successful charge.

## Advertising and affiliates

Advertising campaign funding is reconciled through the commercial ledger and can convert verified cash funding into campaign credits using the configured `KURUKOO_AD_CREDIT_MINOR` rate.

Affiliate conversion revenue is recorded only from verified conversion evidence. A click is not revenue.

## Points

Points remain closed-loop platform units and are not cash. Production Points purchases require explicit per-point pricing and verified Stripe settlement. A successful webhook credits Points exactly once using the commercial ledger as the idempotency boundary.

## Product-specific commercial surfaces

Sports fees, sponsorships, Money Circle fees and future monetised skills should register a `commercial_products` entry and use the generic commercial checkout rather than creating a feature-specific payment authority.

## Launch truth

Repository implementation does not equal external settlement. Payment-provider credentials, webhook delivery, bank/mobile-money settlement, affiliate partner payouts, advertising contracts, and provider availability remain deployment/provider activation requirements.

# Kurukoo Current Product Truth

## Canonical definition

**Kurukoo is a conversational fulfilment network and personal assistance platform for everyday life and work.**

This is the canonical product definition for current documentation and product copy.

### Supporting model

- **Conversation** — primary interface and continuity layer.
- **Native Assistance** — reminders, safety/check-ins, memory, organisation, explanations and other actions Kurukoo performs directly.
- **Network Fulfilment** — matching a need to an appropriate provider, seller, business, contributor or other participant.
- **Economic Request** — the shared lifecycle for economic coordination where matching, quote, payment, fulfilment or completion is required.
- **Memory Profile** — the canonical identity/profile state for a person.
- **Presence** — consent-based availability/location state used by Nearby/Pulse and matching where appropriate.
- **Agents** — bounded autonomous goals that use existing Kurukoo tools and authorities.
- **External Execution** — authorised third-party actions through configured adapters.

## Terminology policy

| Term | Current use |
|---|---|
| Conversational fulfilment network | Canonical public/product description. |
| Personal assistance platform | Canonical supporting product description. |
| Everyday utility platform | Descriptive category only; not the canonical identity. |
| Economic OS | Internal architecture term only. |
| Orchestration network | Internal/product architecture term; may be used when describing coordination mechanics. |
| Marketplace | Do not use as the primary product definition; Kurukoo includes network coordination beyond marketplace listings. |
| Chatbot | Do not use as the product definition; Chat is the interface to a broader system. |

## Current architecture rule

Kurukoo should remain one system rather than a collection of vertical applications:

```text
User
  → Conversation
  → Intent / FastText / AI
  → Canonical Skill
  → Native Assistance OR Economic Request OR another canonical capability
  → Shared Memory / Presence / Network / Agent / Notification services
  → truthful result
  → continued conversation
```

Category-specific behaviour belongs in configuration, skill metadata and shared capability services. It must not create a separate economic engine unless a genuinely new architectural boundary is proven.

## Deployment truth

The repository is currently a single-process `sql.js` launch architecture. Real external execution remains provider-dependent. The following are not automatically live merely because repository adapters exist:

- WhatsApp / Telegram / SMS / USSD / voice delivery
- FCM delivery
- real payment settlement / regulated escrow
- real provider identity verification
- routable private-number masking
- production dispatch
- production object storage / malware scanning
- WebRTC relay infrastructure
- MQTT/IoT broker infrastructure

Repository-side implementation should be completed and feature-flagged where possible, but the UI and Chat must never represent an unavailable external action as completed.

## PWA truth

The PWA is the reference application experience for future native iOS and Android clients.

The public web and the installed application are related but distinct:

- **Public web:** discovery, SEO, resources, marketing and public network surfaces.
- **Installed app:** conversation-first personal workspace, requests, reminders, saved items, notifications, Discover, tasks, Points, safety, memory and account state.

Future native clients should inherit the PWA's product interaction model and design system rather than creating a separate product language.

## Memory truth

The Memory Profile is canonical user state. Working memory is selective and bounded. A value must have truthful provenance; unknown remains unknown.

Memory-related concepts:

- stable self-knowledge
- preferences
- skills / roles
- episodic context
- open intentions
- recent conversation context

Memory retrieval and lifecycle may evolve as long as the implementation and Blueprint agree on the same actual launch architecture and cost model.

## Feature-flag truth

Feature flags are deployment controls, not substitutes for external readiness. A feature may be implemented while remaining disabled because its provider, infrastructure, market or risk prerequisites are missing.

The canonical registry is `src/services/featureFlags.ts`.

# Manus — Kurukoo Visual + Product-Surface Rebuild Completion Contract

You are continuing the Kurukoo visual rebuild on `main`. The repository has now established a canonical product architecture, page/content contracts, realistic development data, clean URLs, brand primitives, cross-client contracts and a master product-completeness ledger.

This task is **not** “make the existing screenshots look nicer.” It is to make every product surface **content-complete, functionally coherent, semantically correct, navigable, truthful and visually faithful to the Kurukoo design system**.

## Mandatory authorities — read before editing

1. `/BLUEPRINT.md`
2. `/docs/architecture/CURRENT_PRODUCT_TRUTH.md`
3. `/docs/architecture/BLUEPRINT_TRUTH.md`
4. `/docs/architecture/KURUKOO_MASTER_PRODUCT_COMPLETENESS_LEDGER.md`
5. `/docs/architecture/KURUKOO_PAGE_ARCHITECTURE_MATRIX.md`
6. `/docs/architecture/KURUKOO_URL_ARCHITECTURE.md`
7. `/docs/architecture/CLIENT_APPLICATION_CONVERGENCE.md`
8. `/docs/architecture/CAPABILITY_INTERACTION_POLICY.md`
9. `/src/services/pageContentContracts.ts`
10. `/src/services/publicPageContentContracts.ts`
11. `/src/services/adminPageContentContracts.ts`
12. `/src/services/clientSurfaceRegistry.ts`
13. `/src/services/canonicalPlatformFeatureRegistry.ts`
14. `/src/services/brandPrimitiveRegistry.ts`
15. `/src/services/adminConfigMetadata.ts`

Also use the current deterministic development/demo dataset. Do not redesign the product against empty placeholders when realistic seeded states exist.

## Non-negotiable product hierarchy

Kurukoo is the product.

**Desk is the authenticated Web/PWA home.**

**Agent is Kurukoo's conversational intelligence.**

**Chat (`/chat`) is the conversational surface.**

Do NOT make Agent the authenticated home or rename Desk back to Agent.

Canonical examples:

- `/desk` — authenticated home / personal operating environment
- `/chat` — Agent conversation
- `/chat/:conversationId` — durable conversation
- `/share/:shareId` — shared conversation
- `/requests/:id` — durable Economic Request
- `/tasks/:id` — durable Task
- `/agents/:id` — durable Agent
- `/opportunities/:id` — durable Opportunity
- `/connections/:id` — durable Connection
- `/memory/:id` — durable Memory item
- `/artifacts/:id` — durable Artifact
- `/admin/*` — Admin control plane

`/app/*` and `?section=` are compatibility mechanisms, **not canonical product URLs**.

## Core rule: visual references never define product completeness

A design image determines presentation:

- hierarchy
- layout
- typography
- spacing
- colour
- radius
- elevation
- iconography
- responsive composition
- motion
- drawer/modal behaviour

It does **not** determine whether product content may be removed.

Never delete or omit a section, component, action, lifecycle state, navigation relationship, evidence boundary, SEO element, provider field, monetisation state, recovery path or user job simply because it was absent from a visual reference.

When the existing visual design is too sparse for the real-world purpose of the page:

1. preserve the visual language;
2. add the missing product components;
3. establish the correct information hierarchy;
4. make the additional content feel native to the design system;
5. seed the view with realistic demo states.

## Page completion equation

Every surface must satisfy:

`purpose → real-world user jobs → information architecture → capabilities → states → actions → recovery → navigation → SEO (public) → truth/evidence → visual design`

A page is incomplete if any required layer is missing.

## Desk

`/desk` is the first authenticated page.

It should answer:

> What is happening in my Kurukoo world right now, and what should I do next?

Use the Personal Workspace reference design for its visual language, but ensure the complete content model is present:

- welcome/personal context
- active work/goals
- Requests needing attention
- Tasks
- Reminders
- Notifications
- Agent continuity
- recent activity
- saved context
- relevant opportunities/discovery
- contextual next actions
- truthful empty/loading/error/recovery states

## Authenticated shell

Use one coherent authenticated shell across Desk, Chat and all durable resource pages.

Required:

- top header with Kurukoo identity
- universal Search
- Notifications
- account/profile access
- fixed primary navigation rail/sidebar
- contextual right-side drawer/inspector
- drawers/modals for transient interactions
- clean return paths to Desk and Chat

The right drawer is contextual, not a second application.

## Agent / Chat

Treat Agent as a first-class product experience, not a generic chatbot page.

The UI must support the real conversational model:

- welcome state
- ongoing conversation
- streaming/typing/loading
- composer
- attachments/media
- voice entry where configured
- search handoff
- context cards
- Request/Task/Opportunity/Agent cards
- notifications/continuation cards
- memory context when appropriate
- clarification
- confirmation
- cancellation
- interruption
- correction
- topic switching
- multi-goal turns
- safety interruption
- external-activation-unavailable states
- evidence/provenance
- reconnect/offline states

The interface must make it clear that Agent can reason and coordinate, but canonical services own mutation, authorization, execution and evidence.

## Public website

Rebuild public pages as a real product website, not generic marketing templates.

Required canonical product families include:

- Home
- About/Overview
- Features
- Explore
- Discover
- Network
- Channels
- Topics
- Resources
- Help & Support
- Contact
- Pricing
- Partners
- Advertise
- Blog/Kuru Media
- Careers
- Developers
- API documentation
- Legal / Privacy / Terms / Safety / Disclaimers
- Cookies

Use `/src/services/publicPageContentContracts.ts` as the minimum information architecture.

## SEO requirements

Every public page must have, where appropriate:

- one meaningful H1
- logical H2/H3 hierarchy
- unique title
- unique meta description
- canonical URL
- Open Graph/social metadata
- structured data where appropriate
- meaningful search-intent content
- related internal links
- indexability rules
- breadcrumbs where helpful
- updated/date semantics for articles/resources

Never turn SEO into keyword stuffing.

## Topics

Topics are durable shared content, not a generic blog/forum clone.

Support:

- index/discovery
- taxonomy
- detail page
- replies/community context
- reporting/moderation explanation
- related Topics
- Chat handoff
- save/follow/watch where supported

## Providers

Provider surfaces must communicate real-world provider state rather than a generic card.

Include as relevant:

- identity
- capability
- verification
- evidence
- availability
- presence
- coverage
- ratings/reviews
- offers/quotes
- leads
- communication
- requests
- fulfilment
- disputes
- truthful unavailable/readiness states

Never imply verified availability or fulfilment without canonical evidence.

## Agents

Agent management pages must include:

- identity/persona
- goals
- runtime state
- tools/capabilities
- risk/approval
- usage/budget
- action/run history
- evidence
- pause/resume/cancel
- learning/unknown-intent context where applicable

## Subscriptions / monetisation

Do not reduce monetisation to Checkout.

Cover the complete applicable lifecycle across:

- plans
- entitlements
- regional pricing
- billing cadence
- trials
- upgrade/downgrade
- cancellation/reactivation
- payment-required
- Points
- Top Up
- Wallet
- provider lead charges
- commissions
- referrals/rewards
- advertising/promoted discovery
- checkout
- payment verification
- settlement
- refunds
- disputes
- failure/recovery

Every economic state must be truthful.

## Admin

Admin is a control plane over the same OS, not a separate consumer product.

Use `/src/services/adminPageContentContracts.ts`.

Admin surfaces should expose:

- operational tables/queues
- filters/search
- detail views
- evidence
- state transitions
- operator actions
- audit trail
- readiness/degraded/blocked states
- cross-plane links back to canonical user resources

### Admin Settings / Keys

There must be a real, security-safe Settings/Integrations configuration experience.

Use `/src/services/adminConfigMetadata.ts`.

Show:

- variable/config name
- subsystem
- required/optional
- configured/unconfigured
- dependent features
- readiness
- restart/reload requirements

Never expose raw secret values in browser responses or page source.

## Brand system

Use `/src/services/brandPrimitiveRegistry.ts`.

Kurukoo logo/mark/wordmark/icon geometry must be consistent across:

- public header
- public footer
- login/signup
- Desk header
- Desk sidebar
- Chat
- Admin
- PWA
- iOS
- Android

Do not create route-specific logo sizes or hand-drawn substitutes.

Use the shared semantic icon sizes and preserve aspect ratio/accessibility.

## PWA / iOS / Android

They are one Kurukoo OS, not separate product vocabularies.

Share:

- product concepts
- semantic states
- canonical resources
- design meaning
- deep links
- API contracts
- Agent/Chat behaviour
- Requests/Tasks/Connect semantics

They may differ in native layout/navigation mechanics.

Do not copy the mobile bottom navigation onto desktop.
Do not create a second backend/source of truth.

## Demo data

Use the deterministic development demo workspace aggressively while building visual surfaces.

Populate components with realistic combinations of:

- active
- waiting
- quoted
- in-progress
- fulfilled
- cancelled
- unread
- read
- paused
- completed
- unavailable
- error/recovery

Do not fake production/provider availability. The fixture is demonstration data only.

## What not to do

- Do not create `/app/*` as a new canonical namespace.
- Do not make Agent the authenticated home.
- Do not delete content to match a screenshot.
- Do not create duplicate CSS/design-token authorities.
- Do not create duplicate backend/domain engines.
- Do not claim external activation merely because a UI exists.
- Do not make a new subsystem where an existing canonical owner can be extended.
- Do not use generic “Coming Soon” text where a truthful readiness state can be shown.
- Do not replace real populated states with empty placeholders merely because the design board is sparse.

## Verification requirements before declaring completion

Run and repair failures in:

- strict TypeScript/build
- product completeness gate
- client surface registry contract
- canonical URL contract
- product surface contract
- page content contract tests
- outcome completeness
- Chat/conversation reconciliation
- authentication-entry contract
- conversation-workspace contract
- desktop screen-flow tests
- Admin surface integrity
- PWA contract
- mobile typecheck/lint/tests
- accessibility/CSS contracts

For visual verification, inspect the complete desktop route set at 1440x900 and 1280x800 using the seeded development identity and inspect:

- Desk
- Chat/Agent
- Requests list/detail
- Tasks list/detail
- Connect
- Agents
- Opportunities
- Subscriptions
- Wallet/Points/Top Up
- Cart/Checkout/Confirmations
- Memory/Notifications/Safety/Settings
- all Admin modules
- public secondary pages

Verify that realistic demo data fits without clipping, broken density, inconsistent hierarchy or missing navigation.

## Definition of done

Do not report a page as “complete” because it looks close to the screenshot.

Report complete only when:

1. the page uses the canonical URL;
2. its product purpose is explicit;
3. required content sections exist;
4. required actions work or truthfully fail closed;
5. lifecycle/empty/error/recovery states exist;
6. navigation/context/return paths work;
7. public SEO requirements are satisfied where applicable;
8. provider/economic/evidence truth boundaries are preserved;
9. demo data exercises the composition;
10. the surface remains consistent with the Kurukoo visual system;
11. desktop/PWA/native/Admin semantic parity is preserved;
12. regression contracts pass.

### Final instruction

Rebuild the current visual work **from the complete product architecture outward**. Preserve the visual design system, but restore or add any missing product content/components required by the purpose of the page. Do not interpret visual minimalism as permission to remove functionality.

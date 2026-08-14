# Kurukoo Central Chat Surface Contract

**Status:** Current implementation contract as of 2026-08-14.

## Purpose

Kurukoo uses Chat as the canonical workspace shell. Secondary dashboard destinations are not separate user journeys inside the Chat experience; they are content surfaces rendered into the central `#chat-content` region while the left navigation, Chat header, composer, and right context rail remain stable.

## Surface routing

The canonical client maps are in `public/js/kurukoo-primary-chat.js`:

| View | Source route | Central title |
|---|---|---|
| `tasks` | `/tasks` | Tasks |
| `requests` | `/requests` | Requests |
| `reminders` | `/reminders` | Reminders |
| `saved` | `/saved` | Saved & offers |
| `cart` | `/cart` | Cart |
| `points` | `/points` | Points |
| `daily-picks` | `/daily-picks` | Daily Picks |
| `discover` | `/discover` | Discover |
| `connect` | `/channels` | Connect |
| `memory` | `/memory` | Memory |
| `safety` | `/safety` | Safety & check-ins |
| `settings` | `/settings` | Settings |
| `topics` | `/topics` | Topics |

Every Chat navigation control must use `data-surface-view`. `wireSurfaceActions()` intercepts it and calls `renderWorkspaceSurface()` without full-page navigation. Server-rendered workspace pages remain useful as source templates and direct-access fallbacks, but Chat navigation must stay inside the central surface.

## Surface hierarchy

Each loaded surface has one return row followed by one compact context kicker and the page title:

> **Back to conversation → Your Kurukoo → surface title**

The fetched `.workspace-header` is removed before the workspace content is inserted into the surface. This prevents duplicate headers and excessive vertical space. The composer remains mounted below the content and is always available for the next request.

## Continuing work without leaving a surface

When a user opens Tasks or another surface and sends a message, `state.surfaceView` remains active. The request uses the normal `/api/chat/stream` lifecycle while the current content remains visible. Agent completion, errors, and questions requiring user input appear in closeable notifications anchored at the upper-right of the central Chat content area. Dismissing one does not navigate or clear the surface; the composer is focused again and ready for the next message.

This model is recommended because it combines task context with the conversational agent rather than forcing the user to return to the conversation screen for every step.

## Header overflow menu

The Chat header overflow menu is ordered as follows:

1. Pin.
2. Saved & offers — central surface.
3. Reminders — central surface.
4. Delete — destructive conversation operation and always last.

Any future non-destructive workspace link added to this menu must use `data-surface-view`. Delete must retain confirmation and authentication guards.

## UI system

Central surfaces reuse `kurukoo-chat.css` and `kurukoo-workspace.css`. Do not create a competing visual system. Use the established variables and fonts:

| Token | Role |
|---|---|
| `--chat-primary` | Terracotta action and emphasis color |
| `--chat-surface` | White/light surface or dark-mode equivalent |
| `--chat-border` | Quiet separators and card borders |
| `--chat-muted` | Secondary text |
| `--chat-charcoal` | Main text |
| `--chat-font-heading` | Space Grotesk |
| `--chat-font-body` | Inter |

Workspace actions returning to Chat use **logo → Ask**. The Kurukoo logo silhouette is preserved; the robotic quality is an external ring/sensor accent around the unchanged mark.

Responsive behavior must support 360px and wider screens. Multi-column content collapses to one column on narrow viewports, long text wraps, images are fluid, and interactive controls remain touch-friendly. Horizontal overflow is not permitted for a surface itself.

## Advert representation

Sponsored, Daily Picks, discovery, workspace promotion, and inline advert images must be active admin-managed campaigns or approved local assets seeded by `src/services/adManager.ts`. Frontend-only placeholder image URLs are not permitted. Campaign records define image, placement, category, audience/keyword, disclosure, priority, schedule, destination and CTA. The Admin advert image library exposes approved Kurukoo assets, including local informal-economy and diaspora-focused creatives.

## Rebuild checklist

When adding a new page or surface, update the route maps, title map, navigation control, central rendering behavior, shared responsive styles, tests, and this contract. Verify that the page does not introduce a second header, second composer, independent typography system, untracked image placeholder, or full-page navigation from within Chat.

## Context-aware header and inspector

When a workspace surface is active, the Chat header displays the active surface title instead of the default Agent label and reveals a compact back icon. The loaded surface itself must not add another Back to conversation control, Your Kurukoo kicker, or generic workspace sentence. This keeps the distance from the Chat header to the surface title compact and avoids duplicate navigation chrome.

The right inspector adapts to the active surface through `data-context-card` tokens and transitions between states with a short opacity/translation swap. Tasks shows request context, task status, and reminders; Discover shows discovery and nearby context; Memory and Settings show profile context; Safety shows safety controls; and the default conversation view restores the general context set. Cards must remain truthful and hidden when they are not relevant to the active surface.

Task card headings use the compact shared workspace type scale. `Verify a location`, `Update a price`, `Confirm an incident`, and `Was your recent request resolved?` must not use display-sized typography inside the central Chat surface.

## Inspector transition and in-place task execution

The right inspector is a contextual companion to the active central surface. Surface changes stage relevant cards with `is-context-entering` and `is-context-leaving`, allow the transition to settle, then hide irrelevant cards. This prevents a hard visual jump when moving between Conversation, Tasks, Discover, or another workspace. All transitions use the existing Chat tokens and stop transforming when the user prefers reduced motion.

When Tasks is active, the user can send a message without returning to Conversation. The client captures the active surface, keeps the workspace mounted, streams the agent response in the background, and publishes a bounded top-right `Kurukoo update` toast. The toast can be dismissed independently, expires automatically, and must never reset `state.surfaceView`, replace the task cards, or disable the composer after the stream finishes.

The acceptance scenario is: open Tasks; send `Please check my current task status`; confirm the Tasks title, task cards, right-rail Tasks/Reminders context, and composer remain present; confirm the top-right agent update appears; dismiss or wait for expiry; confirm Tasks remains active and the composer is ready for another message.

## Advert and workspace representation

Sponsored cards in the left rail, Daily Picks in the right rail, and promotion cards inside Daily Picks are fed from active admin-managed campaigns. Generated local-economy and diaspora creatives are approved assets with audience, disclosure, placement, category, priority, destination, and CTA metadata. No legacy placeholder image URL may be used when an active managed asset exists.


## Typography and contextual activity additions

Central surfaces use the shared responsive type scale. The Chat-generated surface title and workspace hero/panel headings use bounded `clamp()` values, balanced wrapping, and `overflow-wrap:anywhere`. Header-copy and panel-heading containers use `min-width:0` so long titles cannot expand the central grid. Task card headings remain compact, and narrow layouts step down the scale without creating horizontal overflow.

The Tasks surface may render a Community activity section from the existing public Topics authority. The client requests `/api/topics?limit=5` and renders only returned public Topic records. Each row shows the source type/location metadata, title, short body excerpt, and an Open Topic action. An empty result must show `No recent public Topics match this view yet.`; the UI must not fabricate topics or call them personalized when the source provides no matching records.

The right inspector may render Suggested next steps from the authenticated `/api/proactive/feed` endpoint. The endpoint delegates to `getOpportunitiesForFeed`, which is owner-scoped and excludes dismissed records. The card is context-filtered to Requests, Tasks, Discover, Daily Picks, and Cart via `data-context-card`; it is hidden on non-fitting surfaces. CTAs preserve the engine-provided destination and are not relabeled as completed actions.

The workspace EJS template must tolerate missing campaign data by treating an absent campaign collection as empty. This keeps central Tasks and other non-ad surfaces renderable while preserving the admin-managed campaign rule for promotional placements.


## Discover activity and shared Ask placement

Discover keeps the map and layer controls in the central surface. Its `Happening now` activity list is not duplicated in the central content; the existing right-rail Nearby card becomes `Happening now` while Discover is active and is populated from the existing `/api/discover/map` projection. The activity list is read-only, privacy-preserving, capped to a compact set of items, and shows an empty state when geolocation or nearby data is unavailable.

Every central surface receives the same logo → Ask action in the generated surface heading, in the same right-aligned position. The fetched page header is still removed before insertion, so the surface cannot create a second Ask button or a second header action.

The Current request inspector copy is intentionally concise: `Request details and next actions appear here as Kurukoo works.` The redundant `Web Chat · other channels are shown only when connected` line beneath the composer is removed; the footer retains only the safety disclaimer.

## Header and product-flow boundary

The Chat header should reserve space for high-frequency, low-risk context controls. Good candidates are the existing Cart and Points actions, Notifications, Context, and overflow menu, followed only by capability-aware actions such as Call, Video, Storefront, or channel messaging when that capability is actually enabled. A disabled integration must not be represented as an active icon.

Product requests enter through natural language and are classified into `order_food`, `universal_vendor_order`, `find_worker`, or the shared product-sourcing path. The agent returns an `agentic_storefront` card containing only authoritative fields such as requirements, known seller offers, delivery candidates, provider references, indicative quotes, execution state, and bounded actions. A known offer can start one Economic Request; the card does not imply stock, availability, confirmed price, payment, or fulfilment until those authorities return their state.

A conservative product card should support progressive disclosure: show item/offer title, seller, price only if sourced, availability note, provenance/state, and one primary action such as Choose offer, with optional delivery choice and details expansion. Cart is a review surface, not proof of inventory or a checkout. The current implementation has request/offer, provider, delivery, Economic Request, payment-reference, escrow, completion, delivery-status, and dispute boundaries, but it is not a complete consumer product checkout: there is no fully implemented product catalog-to-cart-to-payment flow covering inventory reservation, confirmed quote, payment, delivery dispatch, and final fulfilment end to end. Product ordering should therefore remain marked as `ready to continue` or `awaiting confirmation` until those integrations are verified.


## Connect, Top up, Subscription, and message presentation

Connect is a setup and activation surface, not a generic channel brochure. It explains that WhatsApp, Telegram, SMS, USSD, Email, Push and Voice use the same Kurukoo identity but become connected only after provider credentials, callbacks and delivery verification are present. When Connect is active, the right inspector shows a compact Channel setup card with the current Web Chat, WhatsApp and Telegram capability states and a Manage channels action.

Top up and Subscription are central Chat surfaces reachable from the More navigation group. Top up explains Points and credit review while preserving payment-gated language; it must not imply that opening the surface completes a payment. Subscription explains plan review and routes the user back into conversational review, with a payment reference required before any change. Both surfaces use the same generated logo → Ask heading action and the same central surface shell.

The live Chat message presentation follows the homepage request-preview language without copying its legacy green user bubble. Assistant content remains a quiet white surface with the Kurukoo avatar, while user content uses a warm off-white surface, compact rounded geometry, a restrained border, and icon-only actions that appear more clearly on hover or keyboard focus. Existing copy, edit, retry, delete, pin, streaming, accessibility labels and message safety behavior remain unchanged.


## Full Chat-first route and role wiring audit

All operational user surfaces are expected to load inside the central Chat shell through the shared `renderWorkspaceSurface` flow. The verified workspace registry includes Requests, Reminders, Saved & offers, Cart, Points, Top up, Subscription, Tasks, Daily Picks, Discover, Connect, Memory, Safety & check-ins, Call, Settings and Topics. Discover, Connect and Topics retain their dedicated server templates but are parsed and injected into the same central shell with the active header, shared composer and contextual inspector.

Central-surface Ask actions use the existing composer rather than navigating away. Generated surface Ask buttons focus the composer directly; imported workspace `Ask Kurukoo` actions now prevent navigation, restore their prompt into the composer, dispatch the normal input event and focus the field.

Cart is an explicit review boundary. It loads owner-scoped offer rows from `/api/cart`, supports removal, and exposes a Continue to checkout review action. Adding an offer requires an authoritative Economic Offer, preserves seller/source/provenance/media/external URL data, and uses `/api/cart/items`. Affiliate destinations are tracked through `/api/cart/affiliate-click`; the product is not represented as a local paid order when an external affiliate checkout is required. Local checkout remains payment-gated and returns the existing canonical Economic Request/payment boundary rather than creating a second order engine.

Role journeys converge on the same identity and Chat surface: consumers express requests and review offers; providers and businesses use existing verified skills, provider subscriptions, Economic Requests and offer authorities; contributors use Tasks and the existing task routes; channel users configure adapters through Connect; safety users use authenticated Safety and trusted-contact routes; referrals use the existing referral QR and idempotent reward service; administrators remain behind their existing admin routes. No guest path creates persistent reminders, orders, cart items, payment records or role-specific data without authentication.


## Hardening pass and protected Chat contract

The August 2026 mandate-hardening pass audits and repairs backend wiring, authorization, role journeys, route contracts, payment boundaries, provider evidence, channel prerequisites, referral behavior, safety persistence, and test alignment without changing the established Chat-area interface. Central surface routing, header behavior, inspector transitions, composer behavior, message presentation, workspace injection and responsive Chat layout remain protected contracts.

Production startup must fail closed when `JWT_SECRET` is missing or shorter than 32 characters. Local controlled tests may use the explicit development-only fallback with a warning. Capability readiness must continue to distinguish code present from provider configured, and no external delivery, payment, affiliate completion, KYC, verification, voice, or autonomous-agent claim may be made without the corresponding configured authority and evidence.


## Red-team runtime and advertising contract

The Chat surface must remain stable when autonomous functionality is enabled or disabled. Goal creation may preserve a bounded plan when the general runtime flag is enabled, but background evaluation and deferred re-entry require both `KURUKOO_AGENT_ENABLED=true` and `KURUKOO_AGENT_AUTONOMOUS=true`. The worker must not overlap cycles, exceed action/concurrency/retry/cooldown limits, or execute tools outside the policy registry. Tools must retain owner checks, risk declarations, idempotency declarations, and concise evidence records.

Autonomous notifications are owner-scoped and preference-aware. They must not be queued when the user has disabled agent/autonomous notifications. Goal notifications use an idempotency key derived from goal, state, and message, while generic identical internal notices are suppressed within a bounded ten-minute window. Inbox and admin unread views return one latest record per identical owner/message tuple. External delivery remains distinct from durable internal queueing and must never be represented as delivered without provider evidence.

The proactive right rail must consume the authoritative opportunity feed without creating duplicate visual cards or repeated same-day records. Suggestions are deduplicated by owner, type, and title, and dismissed suggestions must not immediately reappear unchanged. This logic must not alter the central Chat message or composer styling.

Advertising is an admin-controlled mutation. Campaign creation requires an approved non-empty asset and explicit disclosure. Public rendering accepts only active, scheduled campaigns with `asset_status=approved` and a valid local `/assets/` or validated HTTPS image URL. Placeholder, dummy, data-URI, and known stock-placeholder assets are excluded. Campaign disclosure, advertiser identity, CTA, destination, placement, and targeting remain data fields from the campaign authority rather than client-created claims.

The runtime status endpoint is administrative observability and must not disclose activation flags or worker limits to unauthenticated callers. User goal and timeline routes remain authenticated and owner-scoped. The Chat shell retains its existing header, composer, central surface, inspector, responsive, and accessibility contracts during these backend hardening changes.


## Completion milestone: secure rendering and runtime observability

The autonomous administration surface includes a shared-token, responsive Autonomous runtime readiness panel. It reads the protected `/api/agent/status` and `/api/admin/pilot-readiness` authorities and distinguishes Runtime, Autonomous worker, Concurrency, and Notifications states. It must never present autonomous execution as ready when feature flags or external prerequisites are absent.

The AI Agents console renders agent names, skills, identifiers, status badges, usage, and action controls through safe DOM construction. Agent-provided values must not be interpolated into HTML or inline event-handler strings. The console uses the shared `admin-console.css` token system, responsive grids, keyboard-visible focus states, and compact mobile breakpoints.

The central Chat workspace loader and Nearby radar renderer must not assign fetched or dynamic content through `innerHTML`. Workspace templates are cloned as DOM nodes, scripts are removed before activation, and links are wired through the existing surface contract. Dynamic radar labels use `textContent`. This security rule must preserve the existing Chat header, composer, central surface routing, message actions, inspector, responsive behavior, and visual language.


## Autonomous goal controls and runtime truthfulness

The right inspector's Current objective card may expose Pause, Resume, and Stop follow-up actions for an authenticated, owner-scoped goal. These controls use the existing `/api/agent/goals/:id/{pause|resume|cancel}` endpoints, retain the active central surface, and update the card in place. Pause changes the goal to a non-due waiting state with an evidence event; Resume schedules the next bounded check; Stop follow-up cancels the goal. Destructive cancellation must not be inferred from a generic navigation action.

The Chat client must not expose persistent autonomous-goal controls to guests, must not show a goal as connected or active without the authenticated timeline response, and must display provider/channel limitations truthfully. Runtime readiness is an admin concern and is represented through the admin-only status endpoint; it includes both activation flags and worker health telemetry rather than a vague connected badge. No user-facing surface may claim external delivery, payment, stock, dispatch, or fulfilment unless the canonical provider or request authority returned that state.


## Worker history boundary

Worker history is an admin-only operational surface. The Chat client may show the current authenticated goal state and user controls, but it must not expose worker-run records, internal cycle counts, stack traces, or provider credentials to ordinary users. Administrative runtime views may consume `/api/agent/status` and `/api/agent/runs` to distinguish disabled, idle, completed, and failed cycles without presenting provider-gated capabilities as connected.


## Deterministic failure presentation

The Chat surface must prefer a truthful, bounded error state over a synthetic fallback response. If a provider-dependent action cannot run, the user must see that the capability is unavailable or requires setup, with a clear next step when one exists. The client must not claim that a provider was dispatched, a price was checked live, a payment was completed, a reminder was delivered externally, or an account was connected unless the canonical authority returned evidence. Development-only compatibility must never be presented as production capability.


## Autonomous command and economic failure contract

When an authenticated user writes a direct autonomous control command, the Chat surface must show the resulting persisted goal state in the current conversation and must not create a duplicate intent or economic request. If economic configuration is missing or invalid, the central surface must present a truthful setup or failure state and must not display an arbitrary commission, apparent completion, or payment-ready result.

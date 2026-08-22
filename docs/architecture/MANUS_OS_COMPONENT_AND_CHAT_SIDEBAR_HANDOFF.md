# Manus Handoff — Shared OS Components + Chat-to-Desk Shell Parity

## Read first

This is an implementation addendum to:

- `docs/architecture/MANUS_DESK_AND_WEBAPP_VISUAL_FOUNDATION_HANDOFF.md`
- `docs/architecture/MANUS_VISUAL_REBUILD_COMPLETION_PROMPT.md`
- `src/services/kurukooOsComponentRegistry.ts`
- `src/services/chatSidebarFoundation.ts`
- `src/services/deskVisualFoundation.ts`
- `src/services/authenticatedShellFoundation.ts`
- `src/services/brandPrimitiveRegistry.ts`

## Critical reference rule

`kurukoo-os-personal-workspace.png` is the **pixel-precision reference for `/desk` content composition only**.

Use its Desk-specific components/content and visual geometry exactly where appropriate.

Reuse selected component patterns across the wider product, but do not copy the Desk page's whole composition into other surfaces.

Do not copy the reference's literal logo/wordmark/brand-mark treatment. Use the canonical Kurukoo brand registry and assets.

## Reusable components to adopt across Kurukoo

Treat `src/services/kurukooOsComponentRegistry.ts` as the authoritative shared-component list.

The reusable visual vocabulary includes:

- ConversationContinuationCard
- ActivityFlowCard
- ObjectSummaryListCard
- OpportunityCard
- MetricProgressCard
- TopicCluster / TopicPill
- MediaGuideCard
- ConnectionStatusList
- PulseTimeline
- StatusActionCard
- ActivitySummary
- SponsoredEntityCard
- AgentContextCard
- RecentConversationsList
- ShellPresenceStatus
- NearbyRadarControl
- ContextInspector
- SearchCommandDrawer
- NotificationDrawer
- AccountDrawer
- CartHeaderControl

Build them once in the shared Web App visual/component layer and reuse them by data/semantic variant. Do not make one-off copies per page.

## Chat is the reference inventory for authenticated-shell functionality

Before changing Desk navigation, use `src/services/chatSidebarFoundation.ts`.

Everything in the Chat sidebar/header/inspector inventory must remain reachable in Desk.

### Primary left navigation

Desk must preserve access to:

- Agent/Conversation
- Requests
- Tasks
- Discover
- Connect

### Secondary left navigation / More drawer

Desk must preserve access to:

- Topics
- Recent conversations
- Top up
- Subscription
- Saved & offers
- Reminders
- Safety & check-ins
- Settings
- Appearance

Additional durable surfaces may remain available through the established secondary/All Kurukoo mechanism.

### Header actions

Chat already establishes the correct high-value authenticated header controls.

Desk must preserve:

- universal Search
- Points balance
- **Cart icon next to Notifications**
- Notifications
- conversation/context inspector trigger
- account/profile access
- overflow where needed

**Cart should not be a primary left-sidebar navigation item.**

The cart belongs in the header as a compact icon/action adjacent to Notifications, with badge/state where useful.

### Contextual right drawer / inspector

The Chat inspector must not be lost when moving into Desk.

Preserve its concepts:

- current request context
- discovery context
- memory/context
- provider/evidence context
- current objective/Agent context
- presence
- connectivity
- Nearby Radar
- activity/pulse
- safety/check-in state
- actionable continuation

Desk uses this same contextual inspector system but changes its contents according to the current object/page.

## Desk header geometry

The authenticated header should be composed as:

`Kurukoo brand | centred Search | system/status | Points | Cart | Notifications | Account`

Search is a drawer/command surface.
Notifications is a drawer.
Account is a drawer.
Cart is a compact header action and not a primary sidebar link.

Do not use text glyphs such as `⌕`, `◔`, or `◉` as final UI icons when the canonical Kurukoo sprite/brand icon exists. Use `kurukoo-icons.svg` and the shared brand primitives.

## Component semantics

### ConversationContinuationCard

Use where the user should continue the Agent relationship from a different object/surface.

### ActivityFlowCard / PulseTimeline

Use for ordered work/lifecycle/timeline information.

### ObjectSummaryListCard

Use for compact durable object lists instead of large repetitive cards.

### OpportunityCard / SponsoredEntityCard

Use for discovery/network/product/provider opportunities. Keep Sponsored placements visibly disclosed and semantically separate from organic results.

### MetricProgressCard

Use only where a ratio/target is genuinely meaningful: Points, usage, progress, storage, quotas, goals, etc.

### TopicCluster

Use for taxonomy/topics/filters/capability grouping.

### MediaGuideCard

Use for Resources, Help, Blog/Kuru Media, onboarding and educational content.

### ConnectionStatusList

Use for channels, storage, source integrations, linked devices and readiness.

### StatusActionCard

Use for truthful readiness/safety/payment/integration/agent states.

### ActivitySummary

Use for real aggregate activity metrics and trends, not decorative charts.

## Page-specific composition remains authoritative

Do not flatten these surfaces into Desk's composition:

- Chat/Agent
- Requests
- Tasks
- Connect
- Agents
- Opportunities
- Discover
- Wallet
- Points
- Top Up
- Subscriptions
- Checkout
- Confirmations
- Memory
- Notifications
- Safety
- Settings
- Providers
- Admin
- public pages

Each must follow its own page/content contract while using the shared component vocabulary.

## Conflict rule

Manus should inspect the current `main` implementation and its own active visual branch/PR before editing.

Do not overwrite existing work merely to introduce these components.

Where a component already exists, refactor it to conform to the canonical shared component contract instead of creating a duplicate.

Where an existing page already uses a visually similar pattern, preserve its route/state authority and swap in the shared component semantics.

## Demo-data rule

Every reusable component must be verified against realistic development data, including:

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

Do not use invented provider/payment/fulfilment success.

## Desktop-first execution order

1. Fix authenticated header geometry and controls.
2. Fix left navigation and secondary drawer.
3. Preserve all Chat sidebar capabilities in Desk.
4. Implement the contextual right inspector.
5. Build/refine reusable OS components.
6. Make `/desk` pixel-accurate to the Personal Workspace reference.
7. Apply shared components to other Web App pages according to their purpose.
8. Validate Chat and Desk together so no Chat-only feature disappears.
9. Validate all authenticated desktop pages at 1440x900 and 1280x800.
10. Only after Web App completion, carry the semantic/component system into PWA/iOS/Android.

## Completion criteria

Do not declare the shared shell complete unless:

- header contents and positions are coherent;
- Search, Notifications, Account and Cart interactions work;
- Cart is header-only in the primary navigation model;
- Chat sidebar capabilities are preserved in Desk;
- recent conversations are reachable;
- presence/memory/connectivity/Nearby Radar are represented in the contextual system;
- Chat inspector concepts are preserved;
- reusable components have canonical shared owners;
- Desk matches the reference without copying its branding;
- other pages use the components without inheriting Desk-specific composition;
- seeded demo data visibly exercises the components;
- no legacy `/app/*` links are emitted by normal navigation;
- relevant visual/content/component regression tests pass.

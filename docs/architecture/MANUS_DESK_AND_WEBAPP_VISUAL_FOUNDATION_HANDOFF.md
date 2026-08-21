# Manus Handoff — Desk-first Web App Visual Foundation

## Purpose

Execute the next Kurukoo visual implementation pass in this order:

1. Web App authenticated shell + Desk
2. Web App Agent/Chat
3. Web App durable resource surfaces
4. Web App public/auth boundaries and auth modal
5. Mobile/PWA parity after Web App completion

Do not begin by polishing isolated pages. First make the shared Web App shell exact, then complete Desk, then propagate the shell to the rest of the Web App.

## Reference boundary — critical

The reference asset `kurukoo-os-personal-workspace.png` is used **only as the pixel-precision visual/content reference for `/desk`**.

### Adopt from the reference for Desk

- exact header spatial relationship: brand area, centred Search control, system status, notification control, account control;
- fixed left navigation geometry;
- main content width and grid rhythm;
- greeting/personal orientation;
- Today's flow;
- Continue conversation;
- Active requests;
- Tasks & reminders;
- Opportunity radar;
- Points;
- Topics for you;
- Guide content;
- sponsored/provider placement;
- Connected channels;
- Pulse right rail;
- Safety check-in right rail;
- Activity summary right rail;
- card density, hierarchy, spacing and interaction affordances.

### Reuse outside Desk only as shell interaction language

Other authenticated Web App surfaces may reuse:

- top header structure;
- Search trigger/drawer;
- notification trigger/drawer;
- account/profile drawer;
- fixed left navigation;
- contextual right drawer/inspector;
- shared typography/tokens/borders/radii/focus/motion/icon semantics.

### Do NOT reuse outside Desk

Do not copy the Desk's actual content cards or page composition into Chat, Requests, Tasks, Connect, Agents, Opportunities, Wallet, Points, Top Up, Subscriptions, Checkout, Confirmations, Memory, Notifications, Safety, Settings, Providers, Admin or public pages.

Those surfaces must use their own page/content contracts.

### Branding rule

Do NOT literally copy the logo/wordmark/icon treatment from the Personal Workspace reference.

Use the canonical Kurukoo brand assets and sizing from `src/services/brandPrimitiveRegistry.ts`.

The reference is not a logo asset specification.

## Canonical product hierarchy

Kurukoo = product.

Desk = authenticated home/personal operating environment.

Agent = conversational intelligence.

Chat = Agent conversation.

Canonical browser URLs:

- `/desk`
- `/chat`
- `/chat/:conversationId`
- `/share/:shareId`
- `/requests`
- `/requests/:requestId`
- `/tasks`
- `/tasks/:taskId`
- `/connect`
- `/agents`
- `/agents/:agentId`
- `/opportunities`
- `/opportunities/:opportunityId`
- `/memory`
- `/artifacts`
- `/settings`
- `/admin/*`

`/app/*` is legacy compatibility only and must not be emitted by normal navigation.

## Desk implementation contract

Use `src/services/deskVisualFoundation.ts` as the content contract.

The Desk should visually resemble the reference while being populated by Kurukoo's real demo data.

Required modules:

- Welcome
- Today's flow
- Continue conversation
- Active requests
- Tasks & reminders
- Opportunity radar
- Points
- Topics for you
- Guide content
- Sponsored provider
- Connected channels
- Pulse
- Safety check-in
- Activity summary

Do not flatten these into generic placeholder cards.

Use seeded states: active, waiting, quoted, in progress, fulfilled, cancelled, unread, completed, paused, unavailable and recovery.

## Authenticated shell implementation contract

Use `src/services/authenticatedShellFoundation.ts`.

### Header

Implement:

- canonical Kurukoo brand using the brand registry;
- centred `Search Kurukoo` trigger;
- system/readiness status;
- notification icon/control;
- account/profile control.

Search and Notifications are drawers/modals, not separate replacement pages for normal interaction.

### Left navigation

Fixed desktop navigation rail.

Correct active states.

Canonical clean links only.

Secondary surfaces remain accessible without cluttering the primary navigation.

### Right contextual drawer

Treat it as an inspector/context surface.

It must adapt to the current object/page.

Examples:

Desk → Pulse, safety, activity.

Request → lifecycle, provider/evidence, payment, next action.

Task → task state, reminder, conversation context.

Chat → current objective, evidence, continuation.

Do not allow the drawer to destroy the main context.

## Chat / Agent

After Desk shell is exact, rebuild Chat around the fact that it is Agent.

Required:

- natural Agent identity;
- conversation history/sidebar;
- message stream;
- composer;
- attachments;
- voice where configured;
- Search handoff;
- Request/Task/Opportunity/Agent cards;
- clarification/confirmation;
- correction/interruption;
- multi-goal turns;
- memory/context when appropriate;
- safety interruption;
- evidence/provenance;
- unavailable external-action states;
- reconnect/offline;
- return to current object/Desk.

Do not expose internal terms such as `Economic OS` to ordinary users.

Use canonical Kurukoo brand identity, not placeholder `K` avatars.

## Other Web App pages

After shell + Desk + Chat:

### Requests

Show the real lifecycle and object identity, not a generic description.

### Tasks

Show active, paused, due, completed and overdue work with actions.

### Connect

Show storage, channels, sources, readiness, permissions, health and recovery.

### Agents

Show identity, goals, runtime, tools, authority, risk, usage, history, evidence and pause/resume/cancel.

### Opportunities/Discover

Show attributed opportunities and network context without inventing live availability.

### Subscriptions

Show plans, entitlements, cadence, trial, renewal, upgrade/downgrade, cancellation, payment-required and recovery states.

### Wallet/Points/Top Up

Keep their economic semantics distinct and truthful.

### Checkout/Confirmations

Show quote/request identity, payment state, confirmation and failure/recovery. Never claim settlement without evidence.

### Memory

Show user-understandable memory categories and controls, not raw database structures.

### Notifications/Safety/Settings

Use drawers for transient operations where appropriate, and full pages for durable management.

## Public/authentication boundary

The login/signup experience should be a centred modal/card treatment consistent with the Kurukoo product, while `/login` remains a valid deep-link/recovery URL.

Public pages must retain their own content/SEO architecture.

Do not apply Desk's card composition to public marketing pages.

## Demo-data mandate

Use the development/demo account to populate the Web App during visual implementation.

Do not revert to empty placeholders when a truthful seeded state exists.

When a backend dependency is unavailable, show an explicit readiness/unavailable state.

Never simulate successful payment, provider acceptance, dispatch, fulfilment, live availability or external delivery without evidence.

## Mobile after Web App

Do not start mobile visual convergence until the Web App shell and Desk are approved.

Then adapt the same semantic system to PWA/iOS/Android:

- same product vocabulary;
- same resource identity;
- same Agent/Chat semantics;
- same states;
- same canonical deep links;
- same brand primitives;
- native layout/navigation mechanics where appropriate.

Do not simply shrink the desktop layout.

## Pixel-perfect QA sequence

Desktop first:

1. `/desk` at 1440x900 against `kurukoo-os-personal-workspace.png`.
2. `/desk` at 1280x800.
3. Check header geometry.
4. Check Search placement and drawer.
5. Check notification icon position and drawer.
6. Check account control.
7. Check left navigation.
8. Check main grid/card dimensions.
9. Check right drawer width/position.
10. Check typography, icon optical sizing, spacing and density.
11. Check every seeded state.
12. Move to `/chat` only after Desk is correct.

Then repeat the shell validation across Requests, Tasks, Connect, Agents, Opportunities, Subscriptions, Wallet/Points/Top Up, Checkout, Memory, Notifications, Safety and Settings.

Then run PWA/iOS/Android parity.

## Completion gate

Do not declare complete unless:

- Desk matches the Personal Workspace reference in composition and density;
- canonical Kurukoo branding is used instead of copied reference branding;
- authenticated shell is consistent across Web App surfaces;
- Search/Notifications/Account drawers function;
- right contextual drawer functions;
- content contracts are satisfied;
- seeded demo data exercises the layouts;
- canonical URLs are emitted;
- Agent is Chat and Desk is the authenticated home;
- no product content was deleted to achieve visual similarity;
- mobile/PWA semantics match Web App after desktop completion;
- relevant visual and regression contracts pass.

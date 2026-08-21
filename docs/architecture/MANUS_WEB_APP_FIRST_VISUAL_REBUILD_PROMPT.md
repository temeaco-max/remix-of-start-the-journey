# Manus — Kurukoo Web App First Visual Reconstruction Prompt

## Why this pass is different

The previous convergence work is not sufficient. The next pass must be a **visual reconstruction of the Web App against the approved Kurukoo Personal Workspace reference**, followed by mobile/PWA parity.

Do not interpret this as another CSS polish pass. Rebuild the Web App shell and page compositions where necessary.

The reference image is:

`kurukoo-os-personal-workspace.png`

It is the visual authority for the authenticated Personal Workspace / Desk composition, header geometry, search interaction, notification placement, account control, left navigation, right contextual drawer, density and overall spatial rhythm.

The repository product/content contracts remain the authority for what the pages must contain.

## Critical semantic correction

The authenticated home is **Desk**.

Agent is the conversational intelligence.

Chat is the Agent conversational surface.

Therefore:

- `/desk` is the first authenticated page.
- `/chat` is Agent.
- `/chat/:conversationId` is a durable conversation.
- `/share/:shareId` is a shareable conversation.
- `/requests/:id`, `/tasks/:id`, `/agents/:id`, `/opportunities/:id`, `/connections/:id`, `/memory/:id`, `/artifacts/:id` are durable product objects.
- `/app/*` is compatibility only and must not be emitted by normal user-facing navigation.

Do not make Agent the desktop home again.

## Current problem you must correct

The current authenticated `views/app.ejs` header is structurally insufficient for the reference. It currently presents Kurukoo identity + user identity + an `Ask` CTA, whereas the reference clearly establishes a more complete OS header:

1. Kurukoo brand at the far left.
2. Large centered universal Search control.
3. Search affordance visually reads as a command/search drawer trigger, not merely a normal page input.
4. Keyboard shortcut hint belongs inside the search control where appropriate.
5. System status is visible near the right side of the header.
6. Notification bell is a first-class header control, positioned independently from the account control.
7. Notification unread state is visible without overwhelming the header.
8. User avatar/name/menu is the far-right account area.
9. Header remains persistent across Desk and authenticated resource pages.
10. Header controls open drawers/modals rather than forcing unnecessary page navigation.

Do not substitute a different “reasonable” header. Reconstruct this structure.

## Personal Workspace reference — exact spatial model

Use the supplied `kurukoo-os-personal-workspace.png` as a compositional reference.

The target desktop composition contains:

### Header

- full-width top header
- restrained warm-white/cream surface
- thin lower boundary
- Kurukoo mark at left
- large centred Search/command control
- “All systems in sync” style status indicator
- notification icon
- account avatar + name + menu

The search control should be visually dominant enough to be discovered immediately but not dominate the page.

The notification icon should be separate from the search control and account control.

### Left navigation

Fixed desktop sidebar/rail.

Reference information architecture includes concepts such as:

- Home / Desk
- Requests
- Tasks
- Messages / Chat
- Wallet
- Profile
- More tools

Translate these to the final Kurukoo canonical product vocabulary where needed. Do not blindly copy terminology that conflicts with the product model.

The selected item must be visually obvious but restrained.

The sidebar must remain fixed while the main workspace scrolls.

### Right contextual drawer / inspector

The right side is a **contextual drawer**, not a second permanent application.

Reference content includes:

- Pulse / timeline
- Safety check-in
- Activity summary
- contextual quote/insight

For Kurukoo, these should become truthful data-driven context modules:

- current timeline / next actions
- safety/check-in state
- activity summary
- relevant context from the currently selected page/object

The right drawer must be closable/reopenable and should adapt to the selected Desk/resource context.

## Desk content — reconstruct the reference composition, then enrich it with Kurukoo product truth

The reference Desk is not a generic two-card dashboard.

It contains a dense but calm multi-region workspace:

### Greeting region

Personalized welcome such as:

“Good afternoon, Ada”

followed by a concise contextual sentence.

Use the actual seeded demo user's identity and time-aware greeting where available.

### Primary flow / attention card

Reference concept: “Today’s flow”.

Kurukoo implementation must show realistic items from the seeded workspace:

- Requests needing attention
- Tasks
- Reminders
- scheduled calls
- next actions

Every item must have state, timing/context and a meaningful continuation action.

### Continue conversation card

This is critical.

Show a real recent conversation from demo data.

Include:

- participant/user identity
- truncated recent exchange
- conversation timestamp
- continuation CTA
- deep link to `/chat/:conversationId`

The conversation card should visibly prove that Desk and Agent are one system.

### Active Requests

Show real seeded request cards.

Include:

- request title
- state
- provider/offer state when present
- next action
- provenance/evidence boundary
- link to `/requests/:id`

Use realistic variation such as awaiting review, quoted, in progress and completed.

### Tasks & Reminders

Show real seeded tasks/reminders.

Include:

- title
- state
- due time/date
- completion state
- continue/open action

### Opportunity Radar

Use the seeded opportunity data.

Do not claim fake live availability.

Use “demo”, “example”, “configured”, “source-attributed” or truthful readiness language when necessary.

### Points

Use the seeded Points state.

Show:

- balance
- recent activity or context
- progress/utility information where canonically supported
- clear distinction from cash payment rails

### Topics for You

Show relevant seeded Topics as compact chips/cards.

Allow opening the Topic or continuing through Agent.

### Guide / Resource area

Use actual public resources/content where available.

Do not fabricate editorial content simply to fill a card.

### Sponsored/provider match

Where demonstration data exists, render it clearly as an advertisement/sponsored placement and preserve the truth boundary.

### Connected Channels

Show actual seeded/readiness data for Web Chat, WhatsApp, Telegram and other supported channels.

State must distinguish:

- active
- setup available
- not configured
- unavailable

Do not imply live channel delivery without activation evidence.

## Desk density and geometry

The Personal Workspace reference uses:

- strong but restrained page title
- compact supporting text
- dense horizontal card rows
- asymmetric content width
- multiple information cards without excessive whitespace
- consistent card radius
- quiet borders
- subtle elevation
- strong alignment lines
- no giant generic hero sections inside the authenticated OS

The Web App should feel like an **operating environment**, not a SaaS marketing dashboard.

## Search — implementation requirements

Search must be an OS-level interaction, not a decorative input.

Implement:

- command/search trigger in header
- keyboard shortcut hint such as `⌘ K` / `Ctrl K` where appropriate
- open drawer/modal
- recent searches
- grouped results
- conversations
- requests
- tasks
- topics
- providers
- opportunities
- saved context
- settings/actions where applicable
- Agent handoff for semantic/open-ended queries

Search should not create another page ecosystem unless a full-result page is genuinely required.

## Notifications — implementation requirements

Notification bell must live in the authenticated header exactly as a first-class OS control.

Implement:

- unread count/dot
- notification drawer
- grouping by urgency/context where appropriate
- direct continuation to originating object
- “mark read”/read states
- permission/readiness state
- graceful unavailable state

The user must be able to continue a notification's originating work without losing context.

## Account/profile drawer

Use the header account area to open a drawer or modal with:

- profile identity
- settings
- memory/privacy shortcut
- connections
- subscriptions/billing shortcut
- sign out

Do not force a new page for every account interaction.

## Context drawer behavior

The right drawer must change according to the current context.

Examples:

### Desk
Pulse/timeline + safety + activity.

### Request detail
Request lifecycle, provider/evidence, quote/payment state, next action.

### Chat
Current objective, request/task continuation, evidence, stop-follow-up control.

### Task
Task detail, reminder relationship, originating conversation, evidence.

### Provider
Profile, capability, verification, availability truth, request participation.

### Opportunity
Fit, eligibility, evidence, expiry, action.

Do not duplicate the entire page inside the drawer.

## Content completeness rule

Use:

`src/services/pageContentContracts.ts`
`src/services/publicPageContentContracts.ts`
`src/services/adminPageContentContracts.ts`
`docs/architecture/KURUKOO_MASTER_PRODUCT_COMPLETENESS_LEDGER.md`

A visual reference never overrides those contracts.

If the reference shows fewer components than a page needs, add the required components while preserving the same visual language.

## Existing demo data is mandatory during visual work

Do not design against empty placeholders.

Use the deterministic development/demo workspace and populate the page with:

- active request
- quoted request
- waiting/deferred request
- completed request
- task due tomorrow
- completed task
- reminder
- notification
- recent conversation
- Topic
- opportunity
- Points
- connected channel
- provider/offer where seeded

The data must visually exercise the layouts.

## Chat / Agent UI

After Desk is corrected, rebuild `/chat` using the same authenticated shell language while preserving Chat as the primary conversation surface.

Chat must include:

- persistent conversation identity
- proper Kurukoo assistant identity
- message stream
- composer
- attachment
- microphone/voice entry where configured
- streaming/thinking state
- context cards
- Request/Task/Opportunity/Agent cards
- feedback controls where supported
- search/command access
- notification access through the shell
- contextual right drawer
- conversation history
- mobile/desktop shell continuity

The composer stays visually primary.

Do not make Chat look like a generic embedded chatbot inside a dashboard.

## Desktop-first execution order

Do this in this exact order:

1. Rebuild authenticated global header.
2. Rebuild fixed left navigation.
3. Rebuild Search drawer.
4. Rebuild Notification drawer.
5. Rebuild Account drawer/modal.
6. Rebuild contextual right drawer/inspector.
7. Rebuild `/desk` to match the Personal Workspace reference composition.
8. Populate Desk from deterministic demo data.
9. Rebuild `/chat` inside the same authenticated shell.
10. Rebuild Requests list/detail.
11. Rebuild Tasks list/detail.
12. Rebuild Connect.
13. Rebuild Agents.
14. Rebuild Opportunities.
15. Rebuild Subscriptions.
16. Rebuild Wallet / Points / Top Up.
17. Rebuild Cart / Checkout / Confirmations.
18. Rebuild Memory / Notifications / Safety / Settings.
19. Rebuild Providers and provider-context surfaces.
20. Rebuild Admin visual surfaces using the Admin contracts and operational density appropriate for the control plane.
21. Only after desktop is visually correct, move to PWA/mobile.

## Mobile second

Then adapt the same semantic system to PWA/iOS/Android.

Do NOT shrink the desktop layout.

Mobile may use:

- bottom navigation
- sheets
- stacked cards
- full-screen drawers
- native back gestures
- safe-area handling

but must preserve:

- product terminology
- object identities
- state semantics
- Agent/Chat meaning
- brand geometry
- icon system
- canonical data
- deep links
- truth boundaries.

## Visual QA

You must inspect actual rendered pages after a fresh build.

Desktop reference widths:

- 1440 × 900
- 1280 × 800

Minimum Web App route set for the visual pass:

- `/desk`
- `/chat`
- `/chat/:conversationId`
- `/requests`
- `/requests/:id`
- `/tasks`
- `/tasks/:id`
- `/connect`
- `/agents`
- `/opportunities`
- `/subscriptions`
- `/wallet`
- `/points`
- `/top-up`
- `/cart`
- `/checkout`
- `/confirmations`
- `/memory`
- `/notifications`
- `/safety`
- `/settings`
- provider detail/context
- all Admin modules

For every route inspect:

- shell geometry
- header alignment
- search position
- notification position
- sidebar alignment
- content start position
- card density
- right drawer placement
- typography
- logo/brand geometry
- icon size
- button height
- focus/hover states
- realistic data density
- no clipping
- no horizontal scrolling
- no generic fallback surface where a real composition is required.

## Explicit failure conditions

Do not report this pass complete if:

- the header only has an “Ask” button instead of the reference Search + notification + account architecture;
- search is a normal inline input instead of a command/drawer interaction;
- notifications are buried in a page instead of the header control;
- the right contextual drawer is absent or duplicates page content;
- `/desk` looks like two generic cards instead of the Personal Workspace composition;
- Desk is labelled Agent;
- `/app/*` is emitted by normal user-facing links;
- pages remain visually empty despite seeded demo data;
- the visual reference is treated as permission to delete required product content;
- mobile is completed by simply shrinking desktop styles;
- the visual layer creates a new parallel design-token or navigation system.

## Final definition of done

The Web App is complete only when the authenticated experience visually reads as the Kurukoo OS shown by the Personal Workspace reference while being more product-complete than the reference where real-world Kurukoo requirements demand it.

The result should feel like one coherent operating environment:

**Kurukoo header → Search / Status / Notifications / Account → fixed navigation → Desk / Chat / durable object workspace → contextual inspector → drawers/modals for transient operations.**

Only after this desktop system is correct should the same semantic and visual system be carried into PWA/iOS/Android.

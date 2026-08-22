# Manus — Authenticated Navigation IA Handoff

## Authority

Use `src/services/authenticatedNavigationModel.ts` and `src/services/authenticatedShellFoundation.ts` as the canonical authenticated navigation model.

## Core principle

The authenticated sidebar is not a catalogue of every Kurukoo capability.

- Primary sidebar = frequent work.
- Secondary sidebar = useful but lower-frequency navigation.
- Header = instant-access controls.
- Account menu = identity, setup, money, connections and lower-frequency management.
- Settings = persistent configuration and privacy/preferences.
- Context inspector = live context/status tied to the current surface.

## Primary sidebar

Keep the desktop primary rail deliberately compact:

1. Desk — `/desk`
2. Agent — `/chat`
3. Discover — `/discover`
4. Requests — `/requests`
5. Tasks — `/tasks`

Do not add Cart, Points, Memory, Wallet, Subscriptions, Connect, Contacts, Safety or AI Agents to the primary rail simply because they exist.

## Secondary sidebar

Secondary access:

- Reminders — `/reminders`
- Saved — `/saved`
- Topics — `/topics`

Recent conversations may appear as a dynamic history/secondary area within Agent/Desk, not as permanent primary navigation.

## Authenticated header

The header should contain:

- canonical Kurukoo brand
- Search Kurukoo
- readiness/system status where applicable
- Points balance
- Cart
- Notifications
- Account

Cart is intentionally a compact header control. Points is a compact header balance/action. Neither belongs in the primary sidebar.

## Account menu

The account control must open a polished drawer/menu containing:

### Account
- Profile — `/settings#profile`
- Settings — `/settings`
- Contacts — `/settings#contacts`
- Connect — `/connect`

### Personal
- Appearance — `/settings#appearance`
- Memory — `/memory`
- Saved — `/saved`
- Safety & check-ins — `/safety`

### Money & plans
- Subscriptions — `/subscriptions`
- Wallet — `/wallet`
- Top up — `/top-up`

### Intelligence
- AI Agents — `/agents`
- Agent — `/chat`

Sign out remains at the bottom.

## Settings IA

Within Settings, provide distinct sections for:

- Profile
- Appearance
- Notifications
- Privacy
- Memory controls
- Safety controls
- Connections
- Contacts
- Security/account
- Data management

Do not make Appearance a standalone account product surface.
Do not make Memory or Safety configuration compete with daily work navigation.

## Contacts

Contacts is an account/settings capability. It is a consent-bound integration for phone contacts; the UI must explain permission, selected-contact scope, sync/readiness and revoke controls. Do not imply that Kurukoo can read contacts until device permission/provider state proves it.

## Context inspector

Use the right/context drawer for live operational context such as:

- current Agent objective
- current Request
- provider/evidence state
- presence/readiness
- memory continuity state
- connected-channel state
- Nearby Radar state
- next action

## Chat parity

Do not remove any Chat capability merely because it is moved out of the primary sidebar. Chat remains the inventory source for authenticated OS functionality. Capabilities must still be reachable through the appropriate new location.

## Visual goal

This hierarchy should make Kurukoo feel calmer and more OS-like:

- five primary work destinations
- three secondary destinations
- a utility-rich but organized account menu
- a compact functional header
- contextual right drawer

Do not turn the sidebar into a long SaaS-style feature list.

# Kurukoo Desk — Personal Workspace Reference Boundary

## Reference asset

`kurukoo-os-personal-workspace.png`

This image is the **pixel-precision content and composition reference for `/desk` only**.

## What must be adopted on Desk

Use the reference as the visual source for:

- header/search/notification/account spatial relationship;
- fixed primary navigation rail;
- main content width and grid rhythm;
- greeting and personal orientation;
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
- Pulse/timeline right rail;
- Safety check-in right rail;
- Activity summary right rail;
- populated-state density and card hierarchy;
- drawer/inspector affordances;
- overall spacing, hierarchy and information density.

The corresponding product content is defined by `src/services/deskVisualFoundation.ts` and must be populated from canonical Kurukoo data/demo fixtures.

## What is shared beyond Desk

Only the **authenticated shell interaction language** is reusable across other authenticated pages:

- top header structure;
- universal Search trigger;
- notification trigger;
- account/profile trigger;
- primary sidebar/rail;
- contextual right drawer/inspector;
- typography, spacing, surfaces, borders, focus treatment and icon semantics.

## What is NOT copied from Desk to other pages

Do not copy the Desk's specific card composition into:

- Chat/Agent;
- Requests;
- Tasks;
- Connect;
- Agents;
- Opportunities;
- Wallet/Points/Top Up;
- Subscriptions;
- Checkout/Confirmations;
- Memory/Notifications/Safety/Settings;
- Providers;
- Admin;
- Public marketing/content pages.

Those surfaces must use their own purpose-specific information architecture contracts while inheriting the shared authenticated shell.

## Branding exception

The reference's logo/brand treatment is **not** a literal asset specification.

Use the canonical Kurukoo logo/mark/wordmark and geometry from `src/services/brandPrimitiveRegistry.ts` site-wide.

Do not crop, resize, redraw or substitute the reference logo as the product brand asset.

## Completion rule

Desk is visually complete only when:

1. the reference composition is recognisably reproduced;
2. all required Desk modules are present;
3. seeded/demo data populates realistic states;
4. interactions work (Search, Notifications, Account, drawers, cards, continuation);
5. canonical URLs and Agent/Chat continuation are preserved;
6. empty/loading/error/recovery states exist;
7. no unsupported external outcome is represented as live.

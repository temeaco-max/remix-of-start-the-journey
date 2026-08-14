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

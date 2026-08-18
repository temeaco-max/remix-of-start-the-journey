# Kurukoo Cross-Platform Design System

**Status:** Design direction for PWA, iOS and Android

**Product principle:** Kurukoo is one conversation-first operating system presented through different device conventions. The same user intent, context, action identity, evidence state and continuation path must look and behave consistently everywhere.

## 1. Brand foundation

Kurukoo uses a calm, human and practical visual identity. The experience should feel useful before it feels technical: warm surfaces, clear hierarchy, restrained motion, strong text legibility and a distinctive terracotta action accent.

| Token | Value | Use |
|---|---|---|
| Brand accent | `#B95D3C` | Primary Ask/action emphasis, active states, key links |
| Brand accent strong | `#91452E` | Pressed states, high-contrast action emphasis |
| Ink | `#24221F` | Headings, primary text, dark surfaces |
| Muted ink | `#6D665F` | Supporting copy and metadata |
| Warm surface | `#F7F2EC` | App background and public warm sections |
| Raised surface | `#FFFFFF` | Cards, message groups, sheets and panels |
| Soft border | `#E6DED5` | Dividers, input boundaries and cards |
| Success | `#2E8060` | Confirmed internal state or verified evidence |
| Warning | `#B87928` | Pending, attention or provider-dependent state |
| Error | `#B5483D` | Blocked, failed or unsafe action state |
| Info | `#3C6F91` | Neutral system information |

Typography uses **Inter** for readable interface and body text and **Space Grotesk** for headings, display labels and the Kurukoo personality layer. Body text defaults to 16px/1.5 on mobile and 15–16px/1.5 on desktop. Headings use a restrained scale: 12px eyebrow, 14px label, 18px card title, 24px section title, 32px page title and 44–56px public hero display.

## 2. Layout and spacing

All platforms share a 4px base unit and the same semantic spacing scale.

| Token | Value | Typical use |
|---|---:|---|
| `space-1` | 4px | Icon/text gap, compact metadata |
| `space-2` | 8px | Inline controls, tags |
| `space-3` | 12px | Form rows, compact cards |
| `space-4` | 16px | Standard component padding |
| `space-5` | 20px | Message groups and mobile page gutters |
| `space-6` | 24px | Card sections and desktop gutters |
| `space-8` | 32px | Major surface separation |
| `space-10` | 40px | Page section spacing |
| `space-12` | 48px | Public and tablet section rhythm |
| `space-16` | 64px | Hero and major desktop separation |

Desktop PWA uses a three-region workspace: left navigation 248–280px, fluid conversation center, and 280–320px context inspector. Tablet collapses the inspector into a sheet. Mobile uses one primary column, a compact top bar, bottom-safe composer and sheet-based navigation.

## 3. Core components

### Ask control

The primary action is always **Ask** with the Kurukoo mark preceding the label. It focuses the Chat composer instead of navigating the user to a separate form. It uses a 44px minimum touch target, terracotta fill for primary use, warm raised surface for secondary use and a visible pressed state.

### Chat messages

User messages use a quiet raised neutral surface with no bright green background. Agent messages use a transparent or softly tinted surface with the Kurukoo mark, visible evidence/status labels and action controls below the content. Emergency, payment and external-provider states always show their truthful status label.

### Workspace header

The header shows the current surface name, a back-to-conversation control when inside a workspace surface, notification state, Points and cart actions where appropriate, and the context-panel toggle. The header never repeats `Kurukoo` unnecessarily; the brand mark is used as the identity cue and **Agent** is the default conversation title.

### Menus

Menus use one authority and one rhythm. Navigation rows are 44px, icons are 18–20px, labels are 14–15px, active items use the warm accent tint, More reveals secondary destinations, and destructive actions remain last with a separated danger treatment. On iOS menus prefer sheets and context menus; on Android they prefer adaptive menus and system back behavior; PWA uses anchored popovers and desktop sidebar navigation.

### State language

The UI distinguishes `Ready`, `Pending`, `Needs your input`, `Unavailable`, `Verified`, `Connected`, `Not connected`, `Draft`, `Saved`, `Completed` and `Failed`. It never uses a successful-looking visual for an unverified external outcome.

## 4. Platform behavior

| Concern | PWA | iOS | Android |
|---|---|---|---|
| Primary navigation | Desktop sidebar; mobile bottom/sheet navigation | Tab bar or compact navigation with sheets | Navigation rail/tablet, bottom navigation/mobile |
| Back behavior | Back to conversation or browser history | Native navigation stack and swipe-back | System back returns to prior context/surface |
| Notifications | In-app popover and browser notification when configured | Push notification with action buttons when configured | Notification actions and heads-up behavior when configured |
| Composer | Sticky bottom composer with desktop attachments | Keyboard-aware composer and safe-area inset | IME-aware composer and predictive text-safe layout |
| Offline | Service-worker offline state and draft preservation | Offline banner, local draft and queued intent review | Offline banner, local draft and queued intent review |
| Sheets | Responsive modal/sheet | Native-feeling bottom sheets | Material adaptive bottom sheets |
| Motion | CSS transitions respecting reduced motion | 180–240ms ease-out, haptic opportunities | 160–220ms standard motion, ripple/pressed feedback |

## 5. Accessibility and trust

Every interactive control maintains a visible focus or pressed state, a minimum 44px touch target, a text alternative for icon-only controls, logical keyboard order, reduced-motion behavior and forced-colors compatibility. Status is conveyed through text and color together. Location, payment, phone, channel, memory and emergency actions state exactly what has and has not happened.

## 6. Design acceptance criteria

A screen is accepted when the user can identify where they are, what Kurukoo knows, what Kurukoo is asking, what will happen next, how to go back to the conversation, and whether an external action is merely prepared, accepted, pending or independently verified. No platform may introduce a second visual identity, second Chat surface or second action authority.


## 7. Implementation convergence scope

The confirmed high-fidelity screen sets in `docs/design/assets/` are the visual source of truth for the public website, PWA, web Chat/workspaces, admin console, agents, partners, checkout, confirmations and Nearby Radar surfaces. Existing canonical routes, services and state owners remain authoritative; this convergence pass changes presentation and reusable UI primitives rather than creating a second Chat, navigation, discovery or admin authority.

The implementation order is shared visual primitives first, followed by surface shells and responsive states. The public website follows the asymmetric warm landing-page compositions; Chat and workspaces follow the three-region conversation shell with Agent header, compact inspector/context treatment and Ask composer; admin, agents and partners use the persistent operational sidebar, compact evidence tables, status chips and explicit activation language; checkout and confirmations retain source, ownership, payment and provider-evidence boundaries in the visual hierarchy; Nearby Radar remains a presentation layer over canonical discovery state.

Every surface must preserve the same mark, Inter/Space Grotesk typography, warm cream/white/charcoal/terracotta tokens, icon-led controls, 44px minimum interactive targets, reduced-motion behavior and truthful status language. Any external channel, payment, verification, provider, delivery or notification state remains visibly pending or activation-required until independently proven.


## 8. Live verification findings

The live homepage now follows the confirmed warm asymmetric composition and shared header hierarchy, with the simplified Explore, Channels, About and Help navigation. The homepage still contains legacy Unicode glyphs in the capability grid and timeline that require replacement with the canonical icon sprite during the remaining convergence pass.

The live Chat shell is structurally present across sidebar, central conversation and context inspector, but the current rendering still requires visual refinement against the Chat board: the header/action density is too compressed, several controls remain glyph-based, and the central composer/message scale needs the board’s clearer hierarchy and spacing. These are presentation findings only; the canonical Chat and context owners remain unchanged.


## 9. Operational and discovery verification

The live admin entry renders with the intended warm cream background, centered operational sign-in card, charcoal text hierarchy and terracotta primary action. Its remaining visual drift was the legacy diamond brand glyph, which has been replaced with the canonical icon sprite.

The live Discover surface now shows icon-led pathway cards and retains the required source-attributed discovery disclaimer. The map/list hierarchy is present and privacy language remains visible. The map is still a presentation layer over canonical discovery state; no UI change implies that a discovered place is a verified or available Kurukoo provider.


## 10. Comprehensive web/PWA audit baseline

The current web and PWA regression baseline passes TypeScript build, lint, accessibility, CSS duplication and inline-style audits, responsive runtime checks at 360–1440px, public route/runtime contracts, PWA lifecycle contracts, Chat DOM safety, conversation workspace contracts, admin routes and discovery-network behavior. Accessibility reports zero findings and confirms focus-visible, reduced-motion, forced-colors and minimum touch-target coverage.

The next visual work is therefore refinement rather than structural repair. Checkout and confirmation states should use the same high-fidelity rhythm as Chat: a clear title block, compact status/evidence band, one dominant action group and a restrained secondary explanation. Workspace panels should keep the three-region shell, reduce internal card padding on narrow screens, align inspector section spacing, and keep the Ask composer visually anchored without introducing horizontal overflow. No surface may imply that payment, provider availability, delivery or external notification is confirmed unless the canonical service has independently recorded that state.


## 11. Workspace live verification

The protected cart workspace correctly redirects unauthenticated users to the existing conversation-continuation identity surface with the requested return path preserved. This confirms that checkout-like workspace surfaces remain behind the canonical identity boundary rather than introducing a second auth flow. The refined workspace spacing is therefore validated structurally; physical authenticated visual comparison still requires a signed-in browser/device session.

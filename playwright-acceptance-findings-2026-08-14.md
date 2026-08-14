# Playwright acceptance findings — 2026-08-14

## Desktop Chat shell

The local production Chat page loaded at `http://127.0.0.1:3100/chat/` with HTTP 304 and title `Chat with Kurukoo`. At 1440×900, the accessibility tree exposed a left complementary `Kurukoo workspace` sidebar, a central `main` Chat region, and the header control `Show conversation context`. The sidebar controls expose accessible names including `Collapse sidebar`, `New conversation`, `Show notifications`, and `Show conversation context`; the sidebar navigation also exposes Conversation, Requests, Reminders, Saved & offers, Cart, Points, Tasks, and Discover.

The context panel is represented as `complementary "Conversation context"` with a `Close context panel` button and sections for current request, Nearby, presence, and Memory. The header context toggle is an icon-only control with an accessible label, and the close control is also labeled. The first click attempt using an internal snapshot ref was rejected by the browser wrapper; the retry using the accessible CSS label succeeded.

## Noted follow-up

The initial 500px snapshot showed the left sidebar positioned off-screen, indicating the responsive/mobile layout was active at that width. A dedicated 500px resize pass is still required to verify mobile drawer behavior, overflow, touch target sizes, and whether the context panel is appropriately collapsed or modalized.

## Server/test state

The rebuilt server is running on port 3100 with development auth and sandbox payment mode. Live Chat probes verified FastText diagnostics for referral, subscription, Money Circle, and autonomous-agent intents. Advertising now routes to the advertising surface with `classificationSource: rules` and confidence 0.99 only when FastText returns a contradictory Nearby label; all other verified examples remain real FastText sources. Fresh-database and network-to-Chat convergence tests pass after adding the first-party ad columns to the canonical base schema.

## Acceptance constraints

No real payment, external SMS, or hidden private-chat ad targeting was used. The private Chat advertising-boundary regression passes.

## Mobile Chat shell

At 390×844, the left workspace is intentionally translated off-canvas and the main header exposes `Open sidebar`, `Show notifications`, and an expanded `Show conversation context` control. The context panel appears as an accessible complementary region with `Close context panel`; while open it intercepts clicks on the underlying mobile drawer, which is expected modal overlay behavior. After closing the context panel, the `Open sidebar` interaction succeeded. Mobile controls are exposed with accessible labels, and the drawer navigation retains touch-sized rows.

The mobile snapshot did not expose a horizontal overflow defect in the visible viewport. A final screenshot/console pass remains part of the broader acceptance run.

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

## Whole-product route smoke

The canonical route inventory contains 46 registered public paths. The initial browser smoke identified two real defects on intentionally nonexistent dynamic slugs: `/p/sample-provider` attempted to query a missing `profile_slug` column, and `/earn/sample` attempted to render a missing `earn` view. Both were repaired. The provider route now uses deployment-independent phone/name slug matching and returns 404 for unknown profiles; valid earn topics redirect to existing Explore category pages and unknown topics return 404.

After rebuild and restart, deterministic HTTP verification returned: `/p/sample-provider` 404, `/earn/sample` 404, `/earn/repairs` 302, `/earn/rides` 302, `/explore/repairs` 200, `/topics/sample` 404, `/resources/sample` 200, and `/advertise` 301. The final browser rerun was attempted but the browser connector timed out while obtaining server configuration; no product failure was inferred from that infrastructure timeout.


## User #1 live Chat quality pass — 2026-08-14

The canonical Admin operator launch issued an explicit User #1 session with `operator: true`, `actorRole: super_admin`, and a separate web conversation ID for each new browser Chat session. The continuous live harness exercised general conversation, location/context, bathroom diagnosis, service corrections and cancellation, memory, reminders, bounded agents, and advertising in sandbox mode.

The pass found and repaired several defects. New web turns without a supplied conversation ID now create a fresh conversation instead of reusing the seeded operator conversation; WhatsApp and SMS without a supplied ID continue the phone-scoped canonical conversation as required by the parity contract. Pause, Resume, and Cancel commands now bypass storefront continuation and operate on the bounded agent or reminder authority. Short generic questions no longer resume unrelated account-level Economic Requests. Natural punctuation is normalized for command matching. Relocation, vague bathroom leakage, uncertainty, and shower-context turns remain conversational until the user confirms a supported request. Explanatory questions about reminders versus agents are answered directly.

The final live pass showed grounded request progress, truthful no-provider/no-payment language, durable memory, reminder creation and cancellation, agent pause/resume/cancel behavior, and status reporting. FastText remained real for classified intents. SmolLM2 was reported only when a local or Hugging Face inference actually succeeded; unavailable inference was labeled `Kurukoo Template` / `template-fallback` rather than falsely presented as SmolLM2.

Automated verification passed for lint, the Chat-first rebuild regression, agent runtime, behavioral Chat matrix, FastText/router, WhatsApp/SMS parity, network convergence, conversation-first authentication, the full route/actor remainder, and responsive runtime widths 360–1440px with no viewport overflow. Payments and external delivery remained sandbox or unconfigured throughout.


## Canonical sidebar More menu — 2026-08-14

The Chat sidebar now exposes a labeled horizontal-dots `More` button directly above the hidden secondary navigation. In normal mode the accessibility tree shows Conversation, Requests, Reminders, Saved & offers, Cart, and More; Points, Tasks, Daily Picks, and Discover are absent from the visible tree because the controlled group is hidden. After opening the mobile drawer and activating More, the button exposes `aria-expanded="true"` and the tree reveals Points, Tasks, Daily Picks, and Discover as 44px-tall touch targets. The mobile drawer remains within the viewport and retains the existing labeled Open/Close sidebar controls.

The same canonical navigation structure and More interaction are now used by Chat, server-rendered workspace pages, the legacy Request Hub dashboard, and Settings. The shared workspace script controls expansion and automatically opens the group when a secondary item is active. The shared CSS covers focus-visible outlines, hover/open state, collapsed sidebars, and mobile target sizing.


## Cross-page sidebar verification

The live Settings page now exposes a `complementary "Kurukoo workspace"` with the same Requests, Conversation, Reminders, Saved & offers, Cart, More, Memory, Safety, Settings, Help, and Log out structure. Its More button is visible with the remaining group hidden by default, matching the Chat drawer behavior. The former emoji-based legacy navigation is no longer rendered on Settings or Request Hub.

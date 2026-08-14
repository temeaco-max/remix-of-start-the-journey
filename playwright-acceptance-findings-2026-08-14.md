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


## Chat header overflow and right inspector controls — 2026-08-14

The live Chat accessibility tree places `More conversation actions` after `Show conversation context` in the header. The new control uses an explicit accessible label and controlled menu relationship. The right inspector now includes a branded logo anchor and a dedicated `Collapse context panel` control in its header; the collapsed state is persisted separately from the inspector open state.


## Header overflow menu verification — 2026-08-14

The live Chat header overflow control opens a `menu` with exactly four accessible items: `Delete`, `Pin`, `Saved & offers`, and `Reminders`. The toggle exposes `aria-expanded="true"` while open, and the first menu item receives focus for keyboard use.


## Collapsed right-inspector verification — 2026-08-14

At desktop width, the collapsed right inspector contracts to a 56px rail. With the pointer away, the Kurukoo logo remains visible while the collapse/expand control reports `display: none`, `visibility: hidden`, `opacity: 0`, and `pointer-events: none`. Hovering the rail changes the control to visible, opaque, and interactive. The overflow menu remains closed by default after reload.


## Live animated agent activity test — 2026-08-14

A sandboxed Chat request was submitted after installing a temporary five-second delay on the local `/api/chat/stream` fetch. During the delay, the live Chat showed an assistant activity bubble with the text `Kurukoo is considering the best next step…`, an animated orbit indicator, and the staged label `Working through your request`. The composer showed the stop-generation control while processing.

After the stream completed, the activity bubble disappeared and the assistant displayed a truthful clarification response requiring Job or service and Location. No payment, provider availability, booking, or fulfillment claim was shown. Live screenshots were captured at `/home/ubuntu/screenshots/127_0_0_1_2026-08-14_18-00-31_9749.webp` during activity and `/home/ubuntu/screenshots/127_0_0_1_2026-08-14_18-00-37_8017.webp` after completion.

## Chat response and visual refresh pass — 2026-08-14

The live rebuilt Chat flow was re-tested in fresh browser conversations. The former `Create Your Profile` card is no longer rendered, including when historical `auth_in_chat_start` card payloads are loaded. Protected guest actions retain a backend identity-gate contract and a preserved continuation projection, but the user sees one concise inline sentence: `If you want Kurukoo to save or continue this request, tell me your name and I’ll take you through sign-in.` The retired profile-creation wording is absent from fresh responses.

A second natural-language request sent immediately after the guest sign-in notice no longer gets interpreted as the user’s name or trapped in the old auth response. The canonical turn service clears the pending name prompt only when the new message has clear request/question markers, then routes that same message normally. A deterministic venue-comparison route now returns a useful three-step plan with a weighted 1–5 scorecard suggestion instead of the generic Kurukoo capability fallback.

The Chat visual layer now uses a calmer neutral palette, quieter borders, restrained shadows, clearer user/assistant hierarchy, more deliberate action-icon reveal behavior, a softened composer focus state, and a compact orbit activity treatment with two elliptical rings, three restrained orbit points, and reduced-motion support. Live browser snapshots showed no profile card and preserved accessible icon labels, the More navigation control, the context inspector, and the stop-generation control during streaming.

Verification passed for TypeScript lint, production build, Chat DOM-safety, and conversation-first authentication. All live testing remained in development-auth and sandbox-payment mode; no real payment, external delivery, or production identity action was used.

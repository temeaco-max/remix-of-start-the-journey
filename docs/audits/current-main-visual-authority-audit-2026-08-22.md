# Current Main Visual Authority Audit

**Scope:** Current `main` only at `4eed2f963a08a839e5ab97cdedefb8c5d4820f43`. This audit excludes PR #65, PR #66, alternate branch bases, and all backend/platform implementation changes. It is limited to presentational assets, templates, and client-owned interactions.

## Decision

Kurukoo’s current main branch already contains the correct high-fidelity design grammar: warm cream and raised-white surfaces, **Space Grotesk** display hierarchy, **Inter** UI rhythm, terracotta primary actions, low-contrast borders, evidence-led state language, and the three-region Chat model. The remaining work is not a brand redesign. It is a controlled convergence pass that restores incomplete client presentation, harmonizes conflicting visual tokens, and reduces visible drift without creating a second UI authority.

## Current Authority Map

| Surface | Current-main presentation owner | Assessment | Decision |
|---|---|---|---|
| Shared OS | `public/css/kurukoo-os-final.css` | Defines the correct Kurukoo palette, type, focus, state, Chat, workspace, and Admin grammar. It has one main-line revision and is explicitly presentation-only. | Retain as the shared final authority and extend only for verified gaps. |
| Desktop refinement | `public/css/kurukoo-desktop-final.css` | Uses the correct desktop palette, 256px operational rail, compact public shell, low-elevation cards, and semantic states. | Retain as the desktop-specific finishing layer. |
| Public website | `views/_partials/head.ejs`, `views/_partials/nav.ejs`, `views/_partials/footer.ejs`, public EJS templates, `site.css` with public refinement layers | High-fidelity public structures exist, but the page shell currently stacks several successive stylesheet layers. | Preserve route templates and compact public shell; adjust only the final presentation layer after visual verification. |
| Web Chat | `public/chat/index.html`, `public/css/kurukoo-chat.css`, `public/css/kurukoo-os-final.css` | The canonical three-region DOM and client behavior are complete. `kurukoo-chat.css` contains accumulated overrides, including a conflicting green primary token. | Preserve DOM/script selectors; resolve visual-token conflict in the final OS layer rather than rebuilding Chat. |
| Authenticated app | `views/app.ejs`, `public/css/kurukoo-workspace.css`, `public/css/kurukoo-desktop-final.css` | Main’s current template had regressed to an incomplete 24-line shell even though its own immediately preceding main revision contained a complete 117-line client view. | Restore the latest complete current-main view, retaining later FCM and desktop-style includes. |
| Admin | `public/admin/admin-auth.js`, admin CSS layers, `kurukoo-os-final.css` | The operational shell and state treatment exist. The visual board calls for compact tables and evidence-led density rather than a new Admin system. | Preserve the injected shell and refine only through shared semantic style rules. |

## Current-Main History Check

The shared OS final layer was introduced once on current main in commit `93ec935b` and already encodes the confirmed cross-surface palette and accessibility grammar. The authenticated `views/app.ejs` history on current main has four revisions. The newest complete version is `c7443c` at 117 lines; the later `ef32e4db` version is only 24 lines and retains the opening shell but drops navigation, main content, status treatment, mobile navigation, and the app shell script. Restoring `c7443c`’s client content while preserving later client asset hooks is a current-main reconciliation—not an import from another branch.

## Verified Gaps

The active public layout includes many stacked CSS files. This does not necessarily indicate a visual defect, but it creates avoidable cascade uncertainty. The highest-value corrective target is the final shared OS layer, which can normalize the legacy aliases without touching individual route owners.

Chat is structurally aligned with the high-fidelity board, but its accumulated stylesheet resets `--chat-primary` to a muted green in a late override. This conflicts with the confirmed terracotta action color and should be remapped to the shared OS tokens at the final authority level. The correction must preserve the existing `.chat-sidebar`, `.chat-main`, `.chat-inspector`, `.chat-header`, `.chat-scroll`, `.message`, `.message-body`, `.composer`, `.composer-wrap`, `.inspector-card`, and `.inspector-menu-link` contracts.

The authenticated app template loss is a concrete client-facing regression. Its restoration is necessary before any visual comparison of Desk and durable workspace pages is meaningful. The restored template must not alter `appSurfaceRoutes.ts`, canonical URLs, API payloads, authentication, service ownership, or readiness semantics.

## Incremental Refinement Sequence

| Pass | Presentation-only action | Preservation rule |
|---|---|---|
| 1 | Restore the latest complete current-main authenticated app template. | Keep all current script and style hooks; do not touch route or data owners. |
| 2 | Normalize shared OS aliases and Chat tokens to the confirmed warm cream/white/charcoal/terracotta system. | Do not rename or replace canonical Chat selectors. |
| 3 | Apply board-specific spacing, hierarchy, and card-density refinements to public, Chat, workspace, and Admin final layers. | Extend final styles instead of adding duplicate page systems. |
| 4 | Run type/style checks and inspect representative desktop and narrow layouts. | Treat missing provider/device evidence as a truthful pending state, never as a visual success claim. |

## Non-Negotiable Presentation Constraints

No refinement may create or mutate platform state, provider activation, payment status, provider verification, delivery evidence, identity, request state, canonical URLs, backend services, or API contracts. The visual system must preserve 44px interactive targets, visible focus, reduced-motion behavior, forced-colors support, coherent mobile collapse, and a return path to Chat. Status remains text-plus-color and must continue to distinguish **Pending**, **Needs activation**, **Not connected**, **Unavailable**, **Verified**, **Completed**, **Failed**, and **Blocked**.

## Implemented Convergence Increment

The current-main increment restored the complete authenticated `app.ejs` presentation shell and reconciled it with current canonical `/desk`, `/discover`, `/requests`, `/tasks`, `/connect` and secondary workspace URLs. The repair retained current FCM and desktop style hooks, added a shared context/evidence band with an explicit return-to-Chat action, and did not alter `appSurfaceRoutes.ts` or any service/data owner.

`kurukoo-os-final.css` now supplies the confirmed shared aliases to Chat, using the terracotta primary action token rather than the accumulated legacy green. Public Chat directly loads the final authority. The new `kurukoo-os-architecture.css` is the presentation owner that the existing Desk dashboard script already requests; it supplies the responsive high-fidelity Desk composition, evidence-aware cards, source-disclosed promotion treatment, semantic status chips and 44px controls. The Desk script now activates for current `/desk`, uses canonical URLs and no longer emits inline presentation attributes.

Discover has retained its existing runtime and data owners while its controls, source-attribution strip, sparse state, cards, map/list controls and continuation action inherit the shared 44px rhythm through the final visual layer. The PWA offline fallback now uses the shared palette, icon treatment, truthful manual-retry copy and canonical `/desk` recovery target. Native shared status primitives now expose the documented informational banner token while Feature Compass retains neutral compact status chips, eliminating the mobile TypeScript mismatch without creating another native state system.

## Validation Evidence

| Check | Result | Scope |
|---|---|---|
| `git diff --check` | Passed | Patch integrity |
| Strict inline CSS audit | Passed | No inline style attributes or style tags in frontend files |
| CSS system audit | Passed | 51 stylesheets; no duplicate top-level blocks or core tokens |
| Chat DOM-safety contract | Passed | Canonical Chat selectors and accessible controls preserved |
| PWA contract | Passed | Offline fallback, manual retry and service-worker lifecycle preserved |
| EJS render | Passed | Restored authenticated app template renders with current Desk data |
| Native TypeScript and lint | Passed with pre-existing non-blocking warnings | Shared native primitive and Feature Compass |
| Focused native visual/continuity tests | Passed | 13 tests across visual contract, continuity and work-surface state |

The web public-route contract remains blocked before route evaluation because current main imports a missing `saveDb` export from `src/database.ts`. The complete mobile test suite similarly reaches unavailable database-backed tests and returns `ECONNREFUSED` after the visual and continuity tests have passed. Neither issue was changed because both are backend/runtime boundaries outside this presentation-only increment. Browser screenshots, authenticated rendering, installed PWA behavior and physical iOS/Android comparison also remain explicit validation boundaries rather than inferred results.

## Continued Integration: Connected Channels and Partner Network

The current-main linked-device page now consumes the existing Kurukoo platform tokens rather than its legacy green pairing palette. Its QR panel remains owned by the same live local-session script, but its readiness state, primary action, error treatment, 44px controls, responsive collapse and Chat continuation now match the shared platform-state grammar. The supporting copy explicitly separates a locally ready QR code from provider activation, future delivery, or third-party account verification.

The existing Partners screen set now opens with the same context/evidence band used by durable workspace surfaces. It makes opportunity, profile, evidence and earnings boundaries visible before a partner action and removes the static named-user greeting from the onboarding preview. Existing partner qualification, opportunities and evidence states remain untouched. The connected native tab now uses the shared `ContinuityBand` and `PlatformStateBanner` primitives, so owner-scoped channel and device readiness is represented consistently on Expo without a mobile-specific visual fork.

| Additional check | Result | Scope |
|---|---|---|
| Linked-device patch integrity and PWA contract | Passed | Existing QR/session lifecycle, offline fallback and manual retry preserved |
| Partner strict CSS and CSS-system audit | Passed | No inline styling, duplicate rules or duplicate core tokens |
| Native Connect type, lint and focused visual checks | Passed with existing non-blocking warnings | 13 visual, continuity and work-surface tests passed |

The continued increment does not remove the existing need for authenticated browser screenshots, real provider/device pairing, full provider-session verification, or physical iOS/Android observation. Those remain evidence-gated validation activities rather than claims made by the presentation layer.

## Continued Integration: Conversation, Sponsorship and Mobile Discover

The canonical Chat document and runtime were retained. A final-authority density layer now gives the desktop composition a stable 272px conversation rail, a 320px evidence inspector, a calmer 900px reading measure, clearer header hierarchy, 44px action geometry, and a compact mobile collapse. This corrects the outstanding board-level density gap without renaming Chat selectors, replacing the composer, or changing any streamed-message behavior.

The public advertising surface now uses the shared sponsorship context band and terracotta continuation action instead of an inherited channel-green CTA. The page continues to state that sponsored placements require approved campaign evidence and that self-service advertising is unavailable in this deployment. Native Discover now gives every filter the same 44px touch-target rhythm already used by the shared mobile action primitives; its existing sponsored disclosure, sparse-area recovery, watch boundary and Chat continuation remain unchanged.

| Additional check | Result | Scope |
|---|---|---|
| Chat density validation | Passed | Strict CSS audit, duplicate-token audit, and Chat DOM-safety contract |
| Public advertising validation | Passed | Strict CSS and shared CSS-system audit |
| Native Discover validation | Passed with existing non-blocking warnings | TypeScript, Expo lint, and 13 focused visual/continuity/work-surface tests |

Authenticated browser rendering, actual provider activation/pairing, installed-PWA observation, and physical mobile layout comparison are still required to establish runtime and device evidence. Current main’s `saveDb` export regression continues to block the broad public-route contract before route rendering; it remains intentionally outside this presentation-only work.

## Continued Integration: Agent-Commerce and Native Composer

The existing agent-commerce client now uses presentation-only semantic hooks for loading, active, blocked and unavailable agent states, as well as success and error outcomes for sales and payout requests. The card, inputs, controls and result copy reuse the established warm-surface, terracotta-action, evidence-pending grammar; no agent sale, payout, commission, eligibility or provider-verification rule changed.

Native Chat now gives quick prompts, voice capture, context, draft-clear and composer controls a consistent 44px interaction target. The existing text streaming, voice-note capture, feedback, task context and ask/stop behavior are unchanged. This keeps the native conversation surface aligned with the final web composer without adding a separate mobile interaction language.

| Additional check | Result | Scope |
|---|---|---|
| Agent-commerce client validation | Passed | JavaScript syntax, patch integrity, strict inline-CSS and shared CSS-system audit |
| Native Chat interaction validation | Passed with existing non-blocking warnings | TypeScript, Expo lint, and 13 focused visual/continuity/work-surface tests |

These refinements still require authenticated browser observation and physical-device checks to establish final rendered evidence. Runtime provider, payout and payment evidence remains intentionally represented as pending until the existing platform owners confirm it.

## Continued Integration: Channels and Durable Work Surfaces

The public Channels surface now begins with the existing Trust & Continuity pattern. It clarifies that credentials, linked devices and active providers are distinct owner-controlled states, and offers a visible return to the canonical Chat relationship without changing the integration matrix, connect actions, credential handling or provider activation process.

The shared native `WorkSurfaceDetail` owner was reviewed against the lifecycle and evidence criteria. Requests and reminders already use `PlatformStateBanner`, `ContinuityBand`, `EvidenceRow`, 44px input and action geometry, explicit local-versus-external delivery boundaries, and an owner-scoped return to Chat. No new native component or duplicate detail surface was needed.

| Additional check | Result | Scope |
|---|---|---|
| Channels continuity integration | Passed | Patch integrity, strict inline-CSS audit, shared CSS-system audit |
| Work-surface lifecycle review | Already aligned | Reuses existing native primitives and 44px interaction geometry |

Authenticated browser rendering, live connection activation and physical-device observation remain explicit evidence-gated checks. No connection, credential, provider, request or delivery state was modified by this presentation-only increment.

## Continued Integration: Request Lifecycle and Native Surface Detail

The public How It Works surface now opens with the same request-lifecycle context band used across the durable product surfaces. It makes the progression from conversation through option, quote, payment and fulfilment explicit and provides a canonical continuation to Chat. It does not alter request creation, quote handling, payment, escrow, delivery or provider availability behavior.

The shared native `SurfaceDetail` primitive now brings its row actions and agent filter geometry to the shared 44px interaction target. This adjustment applies consistently to existing Connect, Memory, Safety, Checkout, Confirmation, Partners, Agents and Admin details without replacing their content, state, actions or platform data ownership.

| Additional check | Result | Scope |
|---|---|---|
| Request-lifecycle context integration | Passed | Patch integrity, strict inline-CSS audit and shared CSS-system audit |
| Native detail interaction validation | Passed with existing non-blocking warnings | TypeScript, Expo lint, and 13 focused visual/continuity/work-surface tests |

The remaining browser, live-provider and physical-device observations are still required to establish rendered and external-lifecycle evidence. They remain intentionally separate from the completed presentation-only refinements.

## End-to-End Current-Main Coverage Pass

The coverage pass rechecked the canonical `CLIENT_SURFACES` inventory against current presentation owners, the visual-completion matrix, the public template set, the Chat/PWA contracts, the injected Admin shell and Expo route/primitives. The implementation-level pass found three remaining owner-level visual outliers rather than a need for another visual system: the standalone Features page, the legacy API documentation page, and the Control Room's visible top-level evidence state.

The Features surface now uses the existing public head, navigation, footer, typography and control hierarchy. Its asymmetric lifecycle composition makes the relationship between conversation, preparation and evidence-gated action clear, while retaining canonical links to Web Chat, Desk, Memory, Tasks, Discover, Requests, Network, Connect, Agents and Safety. It neither creates routes nor treats an external payment, provider or delivery state as confirmed.

The API documentation surface now belongs to the same public documentation authority. It retains its existing anchors and endpoint examples, adds readable responsive reference/code/schema structure, and makes credential safety, availability, retry and settlement boundaries explicit. This is a presentation and wording integration only; it does not expose an API key, enable an endpoint, or change API capability ownership.

The canonical Admin Control Room now labels its top-level control-plane state as **pending**, **operational evidence available**, **needs attention**, or **unavailable** through the existing Admin shell and semantic status vocabulary. The Admin shell's visible continuation link now targets canonical `/chat` rather than the obsolete `/app/agent` path. API fetching, authentication, role handling and operational data are unchanged.

Native parity was rechecked through the shared `kurukoo-ui.tsx` primitives and the existing More tab. The tab now maps **Ready** and **Available** to its established success tone, and **Ready for activation** and **Needs activation** to its established warning tone; all navigation, static labels, product data and lifecycle behavior remain intact.

| Surface family | Current-main implementation evidence | Validation status | Remaining evidence boundary |
|---|---|---|---|
| Public core and secondary | Shared public shell, Discover, How It Works, Channels, Partners, advertising, Features, Help/About, API docs and content styles are owned by the same tokens and continuation patterns. | Template render for Features/API docs; strict CSS and CSS-system audits passed. | Authenticated/narrow browser comparison remains blocked until current-main runtime imports are repaired under separate authorization. |
| Chat, Desk and workspace | Canonical three-region Chat, restored workspace shell, Desk composition, continuity bands and final-authority tokens retain their existing runtime owners. | Chat DOM-safety and PWA contracts passed. | Live authenticated rendering remains blocked by the unrelated server import regression. |
| Commerce, fulfilment and connected channels | Existing agent-commerce, request-lifecycle, linked-device, partner and payment-boundary owners use evidence-led state language without claiming external outcomes. | CSS/JS syntax and lifecycle contracts passed where applicable. | Payment, payout, pairing, provider and delivery receipts require configured external services. |
| Admin and operations | Injected shell, Control Room cards, semantic status controls and canonical Chat continuation use the existing Admin visual system. | JavaScript syntax, strict CSS, CSS-system, Chat/PWA regression checks passed. | Authenticated operational-browser review remains a runtime/environment activity. |
| PWA and native | Offline/retry owner and shared Expo primitives provide lifecycle, focus/touch geometry and continuation treatment. | PWA contract passed; native type-check and focused 13-test visual/continuity/work-surface suite passed; lint has only pre-existing warnings. | Installed standalone PWA plus physical iOS/Android observation remain required. |

| End-to-end validation check | Result | Note |
|---|---|---|
| `git diff --check` | Passed | No patch whitespace errors after public, Admin and native work. |
| `npm run audit:css:strict` | Passed | No inline style attributes or style tags introduced. |
| `npm run audit:css:all` | Passed | 51 CSS files; no exact duplicate top-level rules or core token duplicates. |
| Features/API documentation EJS render | Passed | Rendered independently of server startup; both produce complete public documents. |
| `node --check public/admin/admin-auth.js` | Passed | Admin evidence-state/continuation change is syntactically valid. |
| `npm run test:chat-dom-safety` and `npm run test:pwa-contract` | Passed | Canonical Chat and PWA lifecycle behavior preserved. |
| Native `pnpm check`, `pnpm lint`, focused Vitest suite | Passed with existing warnings | 13 focused tests passed; the existing lint warnings are outside this visual increment. |

The full public-route/browser path still cannot begin because current main imports missing `saveDb` and other database exports from `src/database.ts`; that issue is deliberately out of scope for presentation-only work. The full native suite still reaches database-dependent tests that return `ECONNREFUSED` after the visual tests pass. Neither condition is represented as a completed browser, provider or device observation. The implementation-level visual convergence is broad across the current registered surface families; live state and device validation remains a separate external evidence phase.

### Broad-Suite Boundary Confirmation

The declared `npm run test:public-routes` contract was run after this pass. It stops before route rendering because `src/services/seoService.ts` imports the missing named `saveDb` export from `src/database.ts`. The failure is therefore a current-main server import boundary, not a template, CSS, Chat or PWA regression.

The full Expo Vitest suite was also run after the focused visual pass. It reports **10 passing files, 2 skipped files and 4 failed database-dependent files** (44 passing, 2 skipped and 4 failed tests in total), with failures caused by MySQL `ECONNREFUSED`. The native visual, continuity and work-surface contracts remain part of the passing group. No database configuration, source import, API implementation or backend test behavior was changed to conceal either boundary.

## Post-Checkpoint Owner Reconciliation

The subsequent current-main inventory pass confirmed that the shared-conversation route intentionally reuses the canonical Chat document and final Chat authority. The isolated rich workspace template has no active `res.render('workspace')` route owner and is therefore not treated as a production visual gap. The remaining reachable isolated visual owners were the Developers page and the progressive authentication screens.

`views/developers.ejs` now uses the existing public head, navigation, footer and shared public-page stylesheet rather than its standalone mini-site shell. Its lifecycle brief, governed capability cards and API-readiness section make conversation, authorization and evidence ownership legible while retaining all existing links to Chat, Requests, Capabilities, Connect, `/developers/api` and the available API reference. No endpoint, access path, identity rule or capability behavior changed.

The progressive email-link and phone-code authentication pages now reuse the existing `kurukoo-auth.css` owner with canonical warm surfaces, terracotta progression/actions, focus geometry, success/error states, reduced-motion support and forced-colors treatment. The guest return, email magic-link, phone OTP, development-test banner and signed-in return logic are unchanged. The update is strictly visual and does not claim that email delivery, SMS delivery, phone verification or a magic-link completion succeeded.

| Post-checkpoint check | Result | Scope |
|---|---|---|
| Developers EJS render | Passed | The reachable Developers route produces the shared public composition. |
| Login and magic-link completion EJS renders | Passed | Both progressive-authentication templates load the updated shared auth authority. |
| Strict CSS and CSS-system audits | Passed | 51 stylesheets; no inline styles, duplicate top-level rules or duplicate core tokens. |
| Chat DOM-safety and PWA lifecycle contracts | Passed | Existing canonical conversation and PWA behavior remain intact. |
| Native type/lint/focused visual suite | Passed with existing non-blocking warnings | 13 focused visual, continuity and work-surface tests passed. |

The same runtime, provider, browser and device evidence boundaries remain: public-route execution is still blocked before rendering by current main's missing database exports, complete native tests still require a reachable database, and physical/provider activation checks remain operational work rather than presentation implementation claims.

## Existing-Owner Runtime Recovery

With explicit approval to complete the repository recovery through existing owners, the truncated current-main `src/database.ts` was restored from the compatible `develop` version of that same file. The restoration brings back the existing persistence flush, canonical operator, schema, economic-participant and execution-table contracts without merging the wider conflicting branch.

The remaining root TypeScript diagnostics were resolved in their existing owners: canonical Chat account-menu placement, commercial payout event vocabulary, dispatch status bridge, request-provider field naming, typed SQLite row mapping, valid advertising expiry input, and current request/response contract shapes. No new route family, CSS layer, document, persistence model or visual component was added.

| Recovery validation | Result | Scope |
|---|---|---|
| `npm run lint` | Passed | Root TypeScript now compiles. |
| `npm run test:public-routes` | Passed | 56 public routes load through their module contract. |
| CSS, Chat, PWA and Quick Ride contracts | Passed | Existing visual/client authorities remain intact after runtime recovery. |

This resolves the former import-time route blocker. Authenticated browser observation, installed-PWA behavior, configured provider/payment/channel outcomes and physical mobile-device evidence remain separately unobserved external validation activities.

## Cross-Domain Existing-Owner Reconciliation

The restored runtime exposed and resolved further incomplete current-owner contracts: canonical Admin feature records now target the existing Admin control room rather than obsolete query aliases; the public CTA retains the canonical **Start chatting** continuation; shutdown stops existing background services; delegated-beneficiary lookup initializes its commercial schema; conversation guidance preserves multiple active contexts; notification inbox records retain canonical action/object/owner metadata; and the outcome inventory assertion reflects the current 241-skill catalogue.

The public runtime, conversation-turn, provider-selection, notification queue, economic lifecycle, strict CSS and root TypeScript checks pass after these repairs. The long all-domains suite reached 23 of 66 declared checks before `test:smollm2-local` exceeded its own 180-second local-model timeout. That is a local model-runtime boundary, not a visual/client or source-contract failure.

## Controlled Presentation Convergence

The final visual authority was retained as the single token-resolution layer. The controlled audit found that the Discover continuation controls were the remaining shared-rhythm outlier: section actions, segmented controls and result actions still resolved to 40px despite the canonical 44px touch target. Those selectors now resolve through `kurukoo-os-final.css` at 44px, without changing Discover data, filtering, source attribution, sponsorship boundaries or route behavior.

Strict inline-CSS audit, CSS-system audit, Chat DOM safety and PWA contracts pass after the adjustment. Legacy green usage in `site.css` remains limited to channel-specific WhatsApp affordances or textual/status semantics and was not repurposed as a primary platform action color.

### Browser Observation Boundary

An unauthenticated local-browser observation of the live `/explore` route confirmed that the shared public navigation, warm-cream background, terracotta primary request entry, capability-card hierarchy and repeated Chat continuations render through the current public authority. This is evidence for that public route at the observed desktop viewport only; it does not establish narrow-browser, authenticated workspace, installed-PWA, provider, payment, channel or physical-device completion.

The live `/partners` route exposed a concrete current-authority gap: several semantic action anchors inherited `min-height` values while remaining inline, so the rendered hero, section and role continuations collapsed to their text line-height and the hero action lost its primary fill. This is a presentation-only defect in the dedicated Partners authority, not an invitation, profile, opportunity, earnings, eligibility or provider-state change.

The dedicated `partners-authority.css` owner now makes primary, utility and role continuations participate in layout as visibly actionable controls, with the hero entry using the canonical terracotta primary treatment. A cache-key increment on the existing template ensures that the browser receives this owner update. A follow-up rendered observation confirmed the restored hero-action fill and control geometry; narrow-browser and authenticated/external lifecycle evidence remain unobserved.

The same lower-page observation identified that the role entries were rendering as an uncomposed vertical list despite their existing card-level authority. The next scoped correction is limited to restoring that existing role-card collection as a responsive grid; role copy, continuations, state language and all partner workflow semantics remain untouched.

The existing role collection now resolves to four equal 267px cards at the observed desktop width, each with a 170px card geometry and preserved Chat continuation. The grid collapses through the same owner at the existing 1060px and 560px breakpoints. This is local rendered browser evidence for the public desktop route only and does not substitute for authenticated, narrow-browser, installed-PWA, external-provider or physical-device evidence.

The local `/pricing` observation confirmed that its payment and provider boundaries remain explicitly pending and its primary/secondary action cards retain the canonical terracotta and warm-surface grammar. It also found a smaller public-authority gap: the card-level continuations resolve to terracotta but remain inline at a 16px rendered height, despite inheriting a nominal 44px minimum. This is an affordance-geometry defect only; pricing, payment, top-up, provider and escrow behavior remain unchanged.

The existing final public authority now gives only the pricing card-level text continuations a layout-participating 44px geometry, terracotta foreground and warm hover treatment. Rendered local-browser inspection confirms the targeted links now resolve to `inline-flex` at 44px while the ready, product-concept and integration/request-dependent state chips remain compact text-plus-colour semantic labels. This does not assert that a payment, escrow, top-up, provider, or commercial action is active.

The live `/channels` observation confirmed that its context return, channel/source actions and lifecycle boundaries render through the established 44px and evidence-led grammar. It also exposed a concrete remaining affordance gap in the external provider matrix: the native disclosure summary for **Activation and recovery** remains a 13px rendered interactive target. The next scoped correction is limited to that existing disclosure control; it will not modify provider readiness, credentials, activation checklists, recovery copy or connection behavior.

The existing `kurukoo-channel-page.css` owner now retains the native `summary`/`details` disclosure semantics while providing a 44px target, warm terracotta hover/focus treatment and the unchanged recovery content. A local rendered inspection confirms the control is still a closed native `SUMMARY` inside `DETAILS`, now with 44px measured geometry. This does not constitute provider, credential, connection, feature-flag or activation evidence.

The local guest `/login` surface was inspected without submitting identity information or initiating email/SMS delivery. Its name field and progression action render at 48px, and the guest return at 46px, through the established auth authority; no safe presentation-only gap was identified on this entry state. Live email, SMS, phone-verification, magic-link and signed-in-return evidence remain external activation boundaries.

The unauthenticated `/admin` entry redirects to the existing Admin login and was inspected without supplying credentials. Its username/password fields render at 50px and its sign-in control at 48px within the established warm operational shell; no unauthenticated entry-state geometry defect was found. The authenticated Control Room and operational modules remain separate access-controlled browser-validation boundaries.

The local `/network` surface was inspected without invoking a request, provider or partner action. Its context continuation resolves at 44px and the three role pathways render as equal 150px cards in the existing three-column layout; no safe presentation-only geometry gap was identified at the observed desktop viewport. Provider, participation, availability, verification and fulfilment remain explicitly distinct external-evidence boundaries.

The live `/explore` sponsored-card continuation was also rechecked through its existing screen-set authority. The disclosed **Learn more** continuation already renders as a 44px block within its 214px sponsored card, while capability and search actions retain the same 44px-or-greater geometry. No further Explore action-layer change is justified by the observed desktop state.

The live `/help` inspection found its support actions already resolve at 44px or more, but its native common-question `summary` controls remain 15px within 41px detail rows. The remaining scoped correction is limited to those existing FAQ disclosures; it will preserve native details semantics and all support, source, delivery and escalation language.

The existing shared public-page authority now preserves each Help `summary`/`details` disclosure while giving it a 44px target and warm terracotta hover treatment. Local rendered inspection confirms the control remains a closed native `SUMMARY` inside `DETAILS`, at 44px measured geometry. No support, provider, notification or escalation state was modified.

The live `/topics` empty state and filter controls were inspected without creating community content. Topic entry actions render at 58px, the contextual Chat return at 44px, and both native selects at 44px; no presentation-only action geometry gap was found. The intentionally quiet public-topic state and its community-evidence boundary remain unchanged.

The live `/resources` surface was inspected without opening external content. Existing reusable resource continuations render as 50px or 75px cards through their current shared owner, while the source-unavailable detailed-guides state remains explicit. No presentation-only resource action change is justified by the observed desktop state.

The live `/contact` surface was inspected without submitting an enquiry. Its canonical Chat return renders at 44px and support-card continuations at 58px, while direct-channel availability is truthfully marked as not configured. No presentation-only contact control change is justified by the observed state.

The live `/advertise` surface was inspected without initiating a campaign or partnership action. Its contextual Chat return renders at 44px and its advertising discussion action at 46px; campaign review, assets, timing, destination and self-service boundaries remain explicit. No presentation-only commercial action change is justified by the observed state.

The live `/careers` composition was inspected without beginning an application. Its real job-card owner uses the existing `.job-card .btn` action, which renders at 58px within a 162px card; no recruitment interaction geometry gap was found and no recruitment interaction was invoked.

The canonical guest `/chat` surface was rendered without sending a message. Its required sidebar, main region and inspector resolve as the intended three-region desk composition; New conversation, composer, attachment, voice, send and inspector continuation controls all render at 44px or greater. The displayed guest, Web-only, ready and setup-required states remain text-plus-colour and no communication, provider, payment or identity completion was asserted.

The live privacy route was inspected without changing consent or data settings. Existing legal navigation links render at 44px in the `k-legal-nav` owner, retaining warm active treatment and the canonical support/Chat exits. No presentation-only legal navigation change is justified by the observed state.

The Desk route redirects to the existing progressive-auth entry in this local browser session. Its name field and progression action remain 48px, the guest-return action 46px, and no identity was supplied. Authenticated Desk composition remains an access-controlled browser-validation boundary; workspace source and contract validation continue separately.

The authenticated workspace source audit found one remaining explicit visual-system outlier: the task-view tab rule retained a 42px minimum while the canonical interaction rhythm is 44px. The existing workspace stylesheet now resolves that tab control at 44px and its existing template cache key is advanced. Strict CSS, public runtime, Chat DOM-safety, PWA and all 56 public-route contracts pass; a signed-in rendered Desk remains an access-controlled browser-validation boundary.

The latest full all-domain sequence advanced through **22 of 66** named checks, including skill-flow and AI smoke coverage, before `test:smollm2-local` failed after 86.6 seconds. The local SmolLM2 ONNX checkpoint could not be parsed, so bounded fallback inference was used and the local-inference assertion correctly rejected it. This is a local-model artifact/runtime boundary, not a web, PWA, native visual, workspace, route, or source-contract regression.

The remaining explicit authenticated-workspace navigation outliers were then reconciled inside the same existing stylesheet owner: the sidebar collapse control now has a 44px square target, and primary/sidebar/More navigation entries now have 44px minimum height. The control hierarchy, collapsed labels, keyboard focus treatment and source-backed workspace state wording remain unchanged. Strict CSS, public runtime, Chat DOM-safety, PWA and all 56 public-route checks pass after this correction.

The narrow-width workspace header had one final contrary exception: an icon action was explicitly reduced to 40px at the 560px breakpoint. That exception now resolves at 44px through the same existing workspace authority, preserving compact spacing while retaining the shared minimum interaction target. Strict CSS, public runtime, Chat DOM-safety, PWA and public-route validation pass after the correction.

The Admin convergence authority also had shared navigation and narrow-width action rules below the system rhythm. Those existing rules now resolve at 44px, with no change to Admin routes, permissions, state handling or operational actions. The unauthenticated Admin entry was rendered without credentials: its username and password fields measure 50px and its sign-in action 48px. Authenticated Control Room validation remains access-controlled.

The remaining shared FAQ disclosure owner is used by dynamic programmatic/provider content. Its `summary` affordance previously had no explicit target geometry. The existing `site.css` authority now preserves native `details` semantics while applying a 44px terracotta disclosure target and warm hover treatment; shared public stylesheet cache is advanced. Strict CSS, public runtime, 56 public-route, Chat DOM-safety and PWA contracts pass. Rendering a concrete provider profile remains data-dependent rather than being fabricated for visual proof.

The standalone offline fallback was rendered without triggering retry or Desk navigation. Its manual-retry and Desk actions resolve at 42px because the later platform-state stylesheet overrides the otherwise 44px fallback owner. This is a genuine PWA recovery-control geometry gap; recovery language and manual-retry semantics remain correct.

The platform-state authority now resolves standalone offline recovery controls at 44px and its fallback cache key is advanced. Local rendered verification confirms both Try again and Open Desk at 44px, with recovery text still requiring a manual user retry and no automatic background resend.

The standalone QR contextual-entry surface was rendered without generating or uploading a code. Its controls already measure 44px, and its text correctly preserves QR as a contextual entry rather than authentication, payment, Points or channel activation. The visual drift is limited to its older warm-token values (`#FFF8F0`, `#D97A5C`, `#2E2E2E`) instead of the established cream, terracotta and ink authority.

The dedicated QR stylesheet now resolves the surface to canonical `#F7F2EC`, `#B95D3C`, `#24221F` and `#E6DED5` values, with the matching terracotta focus treatment. Rendered verification confirms all QR controls remain 44px while the contextual-entry, external-code and activation boundaries are unchanged.

The registry still lists `/cookies`, while current legal navigation and the live legal template use `/legal/cookies`; the former responds with the standard missing-route page. This is a registered canonical-path consistency issue rather than an excuse to revive a separate legacy page. The live Blog route rendered, and its dark hero requires measured contrast review because the visible heading hierarchy appears suppressed against the hero background.

The Blog hero contrast issue was caused by the shared final heading and muted-copy tokens overriding the intentionally dark surface. The existing final authority now scopes warm-cream heading, support-copy and badge treatment back to that hero only. Rendered verification confirms ink background `#24221F`, title `#F7F2EC`, support copy `#E6DED5`, and retained badge contrast without changing article content or publication-state language.

The same rendered Blog review found a second final-authority conflict: public footers are intentionally resolved to white surfaces, but legacy footer typography still assumes a dark background. The footer body therefore inherits cream while section headings inherit ink and links retain legacy gray. The final public-footer owner needs a scoped white-surface text reconciliation rather than restoring the old dark footer.

The scoped final-authority footer reconciliation now resolves footer description and links to `#6D665F`, headings to `#24221F`, and retains the white footer surface. Rendered verification confirms the complete intended hierarchy and leaves the shared footer navigation, layout and CTA behavior unchanged.

The live home hero was rechecked after the dark-surface and footer reconciliations. Its primary headline retains `#24221F` on the warm cream surface at the intended large display scale, and no related contrast correction is required. This confirms the earlier conflicts are scope-specific rather than grounds for broad global reversions.

The canonical native primitive audit found the shared `ActionButton` at 46px and its representative work-surface controls at 44px or greater. Native type-check, the focused 18-test visual/continuity/work-surface suite and the 15-record platform contract remain green. Physical iOS/Android safe-area, IME, camera, notification and orientation proof remains device-gated. A second responsive browser could not be launched because its configured Firefox executable is unavailable; local desktop rendering, static responsive rules and client contracts remain the available evidence.

The native complete test run separated two unavailable-MySQL `ECONNREFUSED` test-file failures from two stale current-main visual-contract assertions. The existing contract tests now refer to the canonical clean workspace routes and the current Nearby Radar feedback model, rather than removed `/app/*` aliases or obsolete state strings. The existing mobile platform registry now includes its already-declared **provider credentials** and **Admin convergence** records as `admin_only` with no native consumer route. Type-checking passes; lint retains only its pre-existing four non-blocking warnings; 18 focused visual/continuity/work-surface assertions and the 15-record platform contract pass. The post-reconciliation full suite now has **12 passing files, 2 skipped files and 2 failing database-dependent files** (`connect-storage` and `os-capability-service`), both blocked by the unavailable MySQL service rather than client or visual assertions.

The live home hero continues to use `#24221F` at its intended large display scale on the warm cream surface, so no global contrast reversal is indicated after the earlier dark Blog and white-footer scope corrections. The live Developers route also confirms its existing shared owner: the primary action measures 58px; every secondary and card continuation measures 44px; and its shared footer retains the verified white / ink / muted hierarchy. No new presentation owner or corrective change is justified for either route.

The live API documentation surface retains readable warm-cream code text on ink code blocks, verified white-footer hierarchy, and 44px-or-greater integration and Chat continuations. Its existing in-page reference-navigation links are the one rendered exception: each measures 34px despite being keyboard and pointer navigable. The next scoped correction should extend the existing API-documentation owner only, preserving anchor targets and all reference content.

The first post-change render showed that API documentation had reused the Developers page’s earlier `kurukoo-public-pages.css?v=6` browser cache, so the measured 34px links were stale assets rather than a failed CSS rule. The API documentation template now uses its next dedicated cache key; the correction still requires final rendered verification before it is treated as complete.

The API documentation page now loads its advanced dedicated cache key and its seven native in-page reference anchors each render as `display:flex` controls at 44px. The original fragment targets, documentation content, code/schema presentation and integration boundaries are unchanged.

The live Features composition keeps every hero, card and evidence-boundary continuation at 44px or greater, but its dark evidence-boundary heading was overridden to ink by a later shared heading selector. The scoped correction remains in the existing public-page authority: the boundary heading is explicitly white while its existing muted support copy, light action text and dark surface stay intact.

The first scoped selector is still overridden by a more-specific shared heading rule after reload: the dark surface, muted support copy, and 64px light continuation controls remain correct, but the heading still resolves to ink. This is recorded as an unresolved specificity conflict pending a source-level cascade trace; no claim of completed contrast restoration is made.

The first relocation to the final authority also leaves the heading ink after a new cache-key render, so this remains an unresolved cascade discrepancy. The browser proof therefore still supports only the dark surface, muted support-copy and 64px continuation geometry; a matching-rule and route-class inspection is required before any further presentation change.

Matching-rule inspection showed the Features template currently renders under the existing `k-route-home` public body class, so the presentation correction could not rely on a non-rendered route modifier. The final-authority override is therefore scoped to the existing public Features evidence-boundary component itself. Its final rendered hierarchy is verified as ink `#24221F` surface, warm-cream `#F7F2EC` heading, muted `#D9D0CA` support copy and 64px white continuation controls. The template content, component structure, links and current routing behavior are unchanged.

The live How It Works lifecycle surface was also rechecked without creating a request. It contains no ink-surface hierarchy to reconcile in the observed composition; its contextual Chat continuation measures 44px and its primary Chat action measures 58px. No presentation correction is indicated for this route.

The public Features continuation to `/agents` redirects this unauthenticated local session to the existing progressive login entry. No credentials or agent action were supplied, so authenticated Agents composition remains an access-controlled browser-validation boundary rather than a completed public visual observation.

The live About surface retains 61px support-list pathways, a 44px Contact support action, a 58px primary Chat continuation, and the verified white shared-footer hierarchy. Its current **See how request states work** text continuation remains an inline 16px target, however. The next scoped correction should extend the existing About/public-page owner only, preserving the same lifecycle route and all narrative content.

The existing public-page owner now scopes only the About detail-card continuation to `inline-flex` at 44px, and the route-specific stylesheet cache is advanced. Rendered verification confirms that **See how request states work** remains linked to `/how-it-works`, uses the canonical terracotta foreground and measures 44px; support, primary Chat, narrative and footer presentation are unchanged.

The live home composition retains its verified hero contrast but still has four interactive card continuations under the shared `text-link` class at 17px: **How request states work**, **Start chatting**, **See reminders**, and **Explore the network**. The next correction must trace their current home/card owner before deciding whether a scoped shared text-link treatment is safe; content, routes, illustrative states and external-life-cycle boundaries remain unchanged.

The current home owner now scopes only the storefront-explanation and network-mini-card continuations to `inline-flex` at 44px, with the home stylesheet cache advanced through the existing template/head path. Rendered verification confirms all four retained their original `/how-it-works`, `/chat`, `/reminders`, and `/network` destinations, canonical terracotta color and 44px geometry. No homepage request, illustrative-demo, route, state or external-boundary behavior changed.

The native source audit found the existing rich-message **Copy**, optional **Regenerate**/**Edit**, and helpful/not-helpful `Pressable` controls at 30–32px despite their interactive accessibility semantics. The owner now applies 44px row, text-action, and icon-action geometry without changing copy, feedback, regeneration, editing, stream, or message behavior. Native TypeScript passes; lint retains only the four pre-existing warnings; the focused visual/continuity/work-surface suite now passes 19 assertions and the 15-record platform contract remains green.

The same native source audit found Go Live’s approximate-location consent checkbox correctly exposed through an interactive `Pressable`, but without an explicit minimum target. The existing owner now preserves the compact 22px visual checkbox mark while giving the consent decision a 44px centered row target. Native TypeScript passes; the four pre-existing lint warnings remain; the focused native visual/continuity/work-surface suite now passes 20 assertions and the 15-record platform contract remains green. Physical native safe-area and touch verification remains an external-device boundary.

The first-launch device-verification owner retained 50px primary/secondary actions, but its interactive **Change** labels beside the email and code fields had no explicit Pressable geometry. Both reuse the same existing 60px-wide, 44px-high control style now, preserving the request, code, error, disabled and not-provider flows. Native TypeScript passes; the same four pre-existing lint warnings remain; the focused suite now passes 21 assertions and the 15-record platform contract remains green. Physical verification-device and touch behavior remains an external boundary.

## Final Screen-Set Reconciliation Lens

The canonical registry groups the product as public marketing/discovery, authenticated browser OS, PWA, native iOS/Android, and Admin control-plane families rather than as unrelated routes. The approved reconciliation asks whether each family preserves the shared warm-surface shell, quiet navigation, Space Grotesk hierarchy, Inter UI rhythm, restrained semantic states, one dominant action, contextual continuity, canonical iconography, and responsive composition—without forcing Chat, Discover, request lifecycle, Points, Artifacts, or Admin work into the same layout.

The first rendered family check covers Marketing at the live public home route. Its shell, elevated white navigation, terracotta primary conversation entry, white secondary source entry, evidence-boundary explanation, 44px contextual continuations, restrained channel states, and warm raised cards all resolve through the existing system. The shared visible public navigation links, however, measure 42px while Sign in and Start chatting measure 44px. This is a genuine shared-navigation primitive discrepancy: the next correction should extend the existing final public navigation authority rather than edit individual routes or change the intentionally quieter navigation role.

The shared final authority now makes public navigation links layout-participating 44px controls without adding fills, badges, or primary emphasis. The same rendered Marketing shell now measures Explore, Channels, About, Help, Sign in, and Start chatting at 44px; text-led links remain transparent ink, Sign in remains white/ink, and the sole primary Chat entry remains terracotta/white. This corrects the primitive once while preserving the approved quiet-secondary-versus-dominant-primary relationship across existing public screens.

The canonical guest Chat screen family is intentionally distinct from Marketing yet resolves through the same system: the rendered desktop shell is a 272px quiet conversation rail, 688px reading/work region, and 320px contextual evidence inspector over the warm cream ground. Its 62px elevated white composer, restrained inspector cards, terracotta send/new-conversation actions, and explicit Guest/Web only/Setup required labels retain the approved conversation-first relationship. The DOM probe lists several collapsed/off-canvas menu elements at zero geometry; those are not rendered-action failures and were not treated as a target discrepancy. Authenticated conversation data, desktop state transitions, narrow collapse, and external-channel activation remain separate evidence boundaries.

The authenticated Workspace family remains access-gated in this browser session, so it was reconciled through its current presentation owner rather than treated as rendered proof. The owner defines an operational sidebar/header/content composition, restrained status pills, contextual hero/panel cards, preserved work-state hierarchy, existing icon treatment, and 900px/560px rail-to-drawer/grid-collapse rules. Its current final rules explicitly resolve navigation, More, tabs, and icon controls to 44px. The source therefore retains the approved common system while deliberately composing durable work, cart, confirmation, settings, and task contexts differently from Marketing or Chat; signed-in rendering remains an explicit boundary.

The access-gated Admin family maps to the same typography, warm raised-card, terracotta-action, restrained status, focus, reduced-motion, and 44px-control system through its existing convergence shell. Its persistent dark operational bar is intentional contextual composition: it keeps the dense control-plane navigation quiet, surfaces one terracotta primary action, retains compact evidence/status pills, and collapses into a horizontally managed mobile rail rather than adopting the Marketing header. Authenticated Control Room data and role-specific rendering remain access-controlled evidence boundaries.

The PWA/offline family retains a distinct recovery composition through its existing platform-state owner: a focused warm-ground recovery card, one clear truthful title/detail, 44px retry and Chat-return paths, and semantic online/pending/offline/error icon surfaces. It does not simulate online state, provider connection, or automatic recovery. Installed standalone behavior remains a device/browser evidence boundary.

The native iOS/Android family maps through the single `kurukoo-ui.tsx` primitive owner: Space Grotesk headers, Inter body rhythm, warm raised cards, terracotta ActionButton with restrained haptic/press feedback, dot-plus-text StatusPill states, ContinuityBand, PlatformStateBanner, EvidenceRow, empty state, and message bubble grammar. Current Expo routes deliberately compose those primitives as Agent, Discover, Requests, Tasks, Connect, QR, capability, artifact, reminder, notification, and Go Live surfaces rather than mirroring the desktop screen layouts. Physical safe areas, IME, camera, notification, and touch behavior remain device-verification boundaries.

The live standalone offline recovery screen confirms that the PWA family keeps its intentionally focused state composition: warm-cream full screen, 520px raised-white recovery card, compact warning icon, ink title, explicit manual-retry copy, and paired 44px Retry/Open Desk controls. The initial final screen-set comparison found its stronger Retry action still using the legacy ink primary rather than the canonical terracotta action token. The existing platform-state owner now resolves Retry to `#B95D3C` at 44px while preserving Open Desk as a quiet raised-white return path, all manual-retry wording, and the recovery-specific composition. No online, connection, or background-delivery state is implied; installed standalone behavior remains a separate evidence boundary.

The standalone QR contextual-entry family also renders through the shared system while retaining its own bounded purpose: a warm-cream screen, 680px raised-white form card, concise contextual explanation, 44px select/detail/scan controls, and one terracotta Generate QR primary action. Its copy explicitly states that QR context does not authenticate, send payment, award Points, or activate a channel. This is the intended contextual-entry relationship rather than a duplicate authentication, provider, or checkout screen.

### Final Screen-Family Reconciliation Matrix

| Canonical family and concept screen sets | Shared system relationship retained | Context-specific composition retained | Evidence status |
|---|---|---|---|
| Marketing, public discovery, content, legal and developer surfaces | Warm-cream page ground, elevated white public shell, Space Grotesk hierarchy, Inter body/UI rhythm, quiet ink navigation, one terracotta primary action, restrained text-plus-colour states, canonical mark/icons, visible focus and reduced-motion support. | Narrative/asymmetric Marketing, source-attributed Discover, structured content/legal navigation, and technical API reference remain distinct rather than becoming one template. | Representative live Marketing and multiple prior public-owner observations; shared navigation primitive re-measured at 44px. |
| Chat and conversation detail | Same palette, type system, terracotta primary action, muted evidence language, shared icons and 44px controls. | Three-region conversation rail/readable thread/context inspector, quiet rail, 62px composer, contextual cards, and mobile collapse remain conversation-first. | Live guest Chat shell measured; authenticated/state-transition evidence remains separate. |
| Desk, durable workspace, requests, tasks, commerce, Points and Artifacts | Same operational rail/header, warm raised surfaces, compact semantic pills, canonical icons, focus/motion rules, and 44px navigation/actions. | Work, checkout, confirmation, Points, memory, and artifact contexts retain their own hierarchy, summaries, provenance and recovery patterns. | Current owner and contract/source mapping; authenticated rendering remains access-gated. |
| Admin Control Room and operations | Same typography, surface, terracotta action, compact status, focus, motion and 44px control grammar. | Dark operational bar, dense horizontally managed admin navigation, compact tables and evidence-led metrics remain control-plane specific. | Current owner mapping; role-gated live rendering remains unobserved. |
| PWA recovery and platform state | Same warm surfaces, hierarchy, semantic state language and 44px interaction rhythm. | Focused manual-retry recovery card and explicit offline boundaries remain deliberately simpler than an app workspace. | Live recovery screen re-measured; Retry now uses canonical terracotta primary and Open Desk remains quiet. |
| Standalone QR contextual entry | Same mark, warm card, Space Grotesk/Inter hierarchy, terracotta primary, 44px form inputs and truthful state language. | QR passes contextual intent only; it remains separate from identity, channel activation, payment and Points. | Live QR screen measured. |
| Native Agent, Discover, Requests, Tasks, Connect and specialist surfaces | Shared Expo primitives provide type, warm cards, mark/icons, 46px ActionButton, compact dot-plus-text statuses, continuity/evidence patterns and restrained press feedback. | Native tab/surface composition, QR, camera, Go Live, artifacts, reminders and notifications retain mobile-native flow and safe-area responsibilities. | Source and focused visual contracts; physical-device verification remains external. |

The reconciliation identifies **no further evidenced need for a new global CSS layer, replacement component family, or route family**. The only discovered shared primitive discrepancies in this screen-set pass were corrected at the existing authority level: public quiet navigation targets and the standalone PWA recovery primary action. The registry’s historical `/cookies` versus `/legal/cookies` path inconsistency remains a route/registry ownership question and was not converted into a presentation change.

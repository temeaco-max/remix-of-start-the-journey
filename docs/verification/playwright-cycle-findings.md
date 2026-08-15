# Playwright acceptance cycle findings

## Run context

The local compiled runtime was started on port 4320 with a temporary SQLite database, `KURUKOO_DEV_AUTH=true`, and the controlled test identity `+2348011111111`. This is a non-production test-only environment.

## Initial Chat load

The first Chat load exposed one browser console error from `https://cdn.jsdelivr.net/npm/highlight.js@11.11.1/lib/common.min.js`: `ReferenceError: require is not defined`. The owning shell was `public/chat/index.html`; the script was replaced with `https://cdn.jsdelivr.net/npm/@highlightjs/cdn-assets@11.11.1/highlight.min.js`. After rebuild and reload, current console errors are zero; the historical console buffer still displays the old error.

## Authenticated actor baseline

The Playwright actor completed name entry, phone entry, local development OTP `111111`, and returned to authenticated Chat. The page showed the expected development-test banner, connected state, points balance, memory context, channel states, and workspace controls.

## Chat journeys completed

`Hello` returned the normal Kurukoo capability response. `What can Kurukoo do?` returned the same capability response. `Remember that I prefer short answers.` returned a confirmation that the preference was attached to the Memory Profile. `What do you remember about me?` returned `I remember that you prefer short, simple answers.`

## Core routes sampled

Authenticated Playwright navigation returned HTTP 200 with no obvious error text for `/requests`, `/reminders`, `/saved`, `/cart`, `/points`, and the run continued through the remaining core routes. The Requests page showed zero open/waiting/completed requests; Reminders showed no upcoming reminders; Saved and Cart showed truthful empty states; Points showed the test identity balance and non-cash qualification language.

## Storefront request lifecycle finding and repair

The live Chat test for `I need a plumber` exposed two convergence issues. After submitting the slot form with `Ikeja` and `Tomorrow evening`, the UI displayed a deferred request status but left the completed slot form active, allowing a duplicate submit. After reload, the latest deferred card was not persisted in the same Chat thread and the old slot form appeared active again.

The repair added a truthful `storefront-superseded` state that disables submitted form controls while preserving the historical step, persists every storefront advancement card through `appendChatMessage` in the same conversation using the active conversation ID, and reconciles historical slot cards against the owner-scoped Economic Request status after reload.

After rebuild and runtime restart, the reload retest showed two storefront cards, one superseded slot form, two disabled controls, and the note `Request is awaiting match — review the latest state below.` The latest electrician request also persisted a truthful `Deferred` card. This confirms the repaired lifecycle no longer presents a stale active slot form after the request has advanced.

## Final convergence pass — actor two and painter routing

- Restarted the controlled production runtime with `KURUKOO_TEST_PHONE=+2348022222222` so the second actor could complete development OTP without changing production auth behavior.
- Second actor (`+2348022222222`) authenticated successfully and Chat returned `I do not have any saved preferences for you yet.`; the first actor’s saved concise-answer and reminder preferences were not visible.
- Initial second-actor request `I need a painter` fell through to a generic response. Root cause: `src/services/intentRouter.ts` canonical worker aliases and worker seed extraction omitted painter.
- Repaired the canonical alias and seed extraction to include painter plus related trades (`decorator`, `tiler`, `roofer`, `mason`, `welder`). Rebuilt and restarted the runtime.
- Retest now enters the real slot-fill card: `To match the right provider, I still need: Location.` with Job/service, Location, When, Budget fields.
- Completed the form with painter / Ibadan / tomorrow afternoon / 50000 naira. The request advanced to truthful deferred state: no verified provider matched, request remains open, `Still looking`, `Deferred`, and `Cancel request`; no provider, price, payment, or notification was fabricated.
- The same deferred request was visible in `/requests` as one open request owned by `+2348022222222`, confirming Chat/workspace convergence.
- Explicit follow-up `Keep checking for a painter in Ibadan and let me know when one is verified.` re-entered the same deferred request state. Agent-runtime regression also passed bounded follow-up, waiting/re-entry, cancellation, disabled mode, and high-risk denial checks.
- Multi-party economic-request and provider-entity regression suites passed.

## Expanded actor/skill matrix — onboarding boundary

- A fresh customer actor was intentionally run through a broad Chat matrix. The first prompt (`What is Kurukoo?`) correctly entered progressive onboarding, but the naive matrix continued sending normal skill prompts before onboarding completed. Those prompts were consumed as onboarding answers, so later responses did not represent post-onboarding skill routing.
- This is a test-harness sequencing finding, not yet a confirmed product defect: future matrix runs must complete and verify onboarding (`name`, phone/OTP, profile activation) before exercising native and Economic Request skills.
- The same sweep also exposed two real canonical routing defects: `ride_request` had no explicit transport requirement definition and emergency phrases could fall into a generic Economic Request storefront. Both were repaired in source and targeted build/regression tests passed; Playwright post-onboarding retest remains required.

## Expanded matrix — rate-limit boundary

The corrected post-onboarding customer matrix successfully exercised memory, reminder, transport, food, repair, and painter feedback. Later cases received the truthful `429 Too many authenticated requests` response from the authenticated-request limiter after the high-volume automated sequence. This is an anti-abuse boundary, not a fabricated Chat answer or a request-state leak. Subsequent actor/category groups will use fresh controlled sessions and respect the limiter rather than weakening production protection.

## Expanded actor and skill/category Chat cycle — 2026-08-14

The expanded acceptance cycle exercised a controlled provider actor (`+2348044444444`, Matrix Provider) through clean Chat conversations and a full disposable routing matrix. The matrix covered all 205 seeded skills across 46 categories with zero routing errors and zero generic fallbacks after repair. Emergency-dispatch skills intentionally route to safety triage with explicit Nigerian 112 guidance and no provider storefront.

Observed and repaired defects:

- New conversation reused the latest conversation identifier because the conversation authority always resumed the latest thread when no ID was supplied. Added an explicit fresh-conversation mode and wired the New conversation endpoint to it. Playwright then showed an empty thread with a distinct conversation and preserved historical threads in the sidebar.
- Provider capability statements initially produced a raw `provider_profile_setup` label. Added a confirmation-required provider profile card using the existing authenticated profile authority. The card states that saving a skill does not publish availability, verification, pricing, matching, payment, or fulfilment. Playwright confirmed painter skill setup and the saved-but-unavailable feedback loop.
- Provider location extraction captured trailing availability text (`ibadan and can take jobs tomorrow`). Tightened the canonical parser; a fresh Chat turn produced the correct `ibadan` location.
- Provider profile availability and skill-row availability could diverge. The availability and profile-update routes now synchronize both authorities. Playwright/API verification showed profile `is_available=0` and painter skill `is_available=0` after the provider remained unavailable.
- Direct DJ prompts such as `Help me with DJ` fell through to generic Chat. Added a verified-artist alias and direct storefront dispatch. Playwright completed the DJ event slot-fill with artist, event, date, venue, audience, duration, budget, representation, technical, and travel requirements; Chat produced a truthful deferred no-match state and `/requests` mirrored one owner-scoped `Verified Artist` request as `Awaiting Match`.
- The active `Cancel request` control could be blocked by the composer busy guard. Cancellation remains allowed while another turn is marked busy. Direct API and rebuilt Playwright state converged to `Cancelled`, with no payment claimed.

The full route regression suite, skill taxonomy audit, messaging audit, security/economic audit, pilot readiness, production guards, WhatsApp boundary, attachment boundary, fresh database, and Chat DOM-safety checks passed after the repairs.

## Deep behavioural continuation evidence — 2026-08-14

The new isolated canonical matrix passed six representative scenarios after repair: customer natural worker/correction/cancellation flow, ambiguous ride clarification, provider capability consent, seller product boundary, contributor event evidence, and emergency triage. The matrix now persists the same owner-scoped request across multi-message turns and cancels the bounded agent goal.

A live Playwright retest on the rebuilt runtime confirmed that `Guy I need somebody to paint my place` is recognized as `painter`, not a generic worker request with a missing service. Chat rendered an active slot-fill card with `painter` already populated and only `Location` required. The next live step is to enter a natural location and verify the same request advances rather than opening a duplicate.

Live Playwright continuation retest: after `Guy I need somebody to paint my place`, the Chat card prefilled `painter` and required only Location. Sending the separate natural-language follow-up `Ibadan.` advanced the same request to `No verified available provider matched yet`, `Still looking`, and `Deferred`. The original slot card remained visible as historical/superseded, and no second request was opened. This verifies the actor → natural language → clarification → state accumulation → deferred outcome loop in the browser.

Live Playwright contributor check: in a fresh conversation, `I can provide evidence for an event listing` produced the non-economic `Event coverage request` card. The response explicitly says the submission is a contributor record, does not verify a provider or create a payment request, and that contributor participation and any resulting payment require separate confirmation. No Economic Request storefront was rendered.

Live Playwright ride lifecycle: a fresh conversation and `I need a ride tomorrow` produced one `ride_request` agentic storefront in slot-fill with explicit Pickup location, Destination, and When requirements plus Continue/Cancel controls. The next step will verify a natural cancellation message closes this request with no payment or duplicate state.

Live Playwright cancellation check: in a fresh ride conversation, `Cancel this request` was interpreted against the active request, produced `Request cancelled. No payment was taken.`, rendered a `Cancelled` complete card, and left no active request. This confirms natural cancellation closes the same request and preserves the historical slot card without claiming payment.

## Deep actor and category convergence cycle — final evidence

The repository behavioural matrix is now registered as `npm run test:behavioral-chat` and passes 6/6 scenarios on isolated post-onboarding actors: customer painter correction and cancellation, ambiguous ride clarification, provider capability consent, seller product boundary, contributor event coverage, safety triage, and bounded agent-goal creation/cancellation. The canonical matrix confirms no active requests remain in its isolated database after cleanup.

The final route suite passed after these repairs. Skill-flow validation passed 22/22 valid seeded flows. The complete readiness set passed: 205 seeded skills, 46 economic categories, messaging architecture across six transports, security and economic authorization boundaries, pilot production guards, attachment ownership/privacy, Topics convergence, agent runtime, WhatsApp parity, network-to-Chat convergence, and fresh-database bootstrap.

The full canonical skill sweep completed without errors. Its non-storefront rows are intentional safety/public-information/community boundaries: emergency prompts return explicit 112 triage without a card, while public event and community paths must not imply booking, payment, provider verification, or fulfilment. The live browser cases independently verified contributor event evidence, painter natural-language continuation, ride slot-fill, and natural cancellation.

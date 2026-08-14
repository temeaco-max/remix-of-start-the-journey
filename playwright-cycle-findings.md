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

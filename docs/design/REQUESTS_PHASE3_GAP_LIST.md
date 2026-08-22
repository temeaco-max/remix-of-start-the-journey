# Kurukoo Requests — Screen Convergence Phase 3 Gap List

Baseline: `2bccc66ac9d1960335bda91e3fcfb5131a529bc6`

Scope: `/requests` only.

## Ownership trace

`/requests` → `src/routes/appSurfaceRoutes.ts` → `views/app.ejs` → existing `public/js/kurukoo-workspace.js` Requests hydration → `/api/chat/economic-requests` → canonical Economic Request service/persistence/lifecycle.

Provider/participant context remains owned by `/api/chat/economic-requests/:id/participants` and the canonical economic participant services. Chat continuation remains owned by the canonical `/chat` surface.

## Deterministic gap list

| Area | Classification | Finding |
| --- | --- | --- |
| Page hierarchy | CORRECT | Shared OS shell, Requests title, lifecycle workspace and state summary already exist. |
| Request summary | INCONSISTENT | Cards show skill/category plus a small requirements summary, but not durable request identity or a clear primary hierarchy of what/status/context/next action. |
| Status/lifecycle | CORRECT | The UI derives status from the canonical API and does not create a second lifecycle. Presentation is too coarse for some states. |
| Primary action | INCONSISTENT | Current cards link to a generic Chat prompt and omit the canonical request id. |
| Secondary actions | MISSING | Request cards expose only generic conversation continuation; no status-aware review/continuation affordance is surfaced. |
| Participant/provider context | MISSING | The base list does not surface canonical participant/provider coordination state. |
| Timestamps | MISSING | Request creation/update timing is not shown. |
| Evidence/progress | INCONSISTENT | The page truthfully avoids fabricated evidence, but the list provides little progress/context signal beyond raw lifecycle status. |
| Payment/economic state | INCONSISTENT | Payment-pending/paid states exist in the canonical lifecycle but are presented only as a raw status label. |
| Communication actions | NOT APPLICABLE | No independent request messaging/call owner exists; continuation must remain on canonical Chat/provider boundaries. |
| Contextual continuation | BROKEN | The current request card action creates a generic prompt (`Continue my <skill>`) rather than preserving the request identity/context. |
| Empty state | CORRECT | Explicitly avoids implying provider availability, price, booking, payment or fulfilment. |
| Loading state | CORRECT | Uses an explicit canonical Economic Request loading state. |
| Error state | CORRECT | Fails closed and does not infer request status locally. |
| Unavailable state | CORRECT | No unsupported provider/payment state is invented. |
| Responsive layout | CORRECT | Uses the shared workspace grid/card architecture; no second renderer exists. |
| Mobile behaviour | INCONSISTENT | Existing shared composition is valid, but the request-card information hierarchy needs more compact, touch-safe status/context presentation. |

## Implementation rule

Only the real Requests presentation gaps above are addressed. No new request store, lifecycle, provider communication system, payment implementation, notification architecture, Chat implementation, global token system or cross-screen visual cleanup is introduced.

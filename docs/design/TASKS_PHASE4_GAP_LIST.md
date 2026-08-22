# Tasks — Phase 4 Gap List

Reference boundary: existing canonical Tasks lifecycle plus the established mobile Tasks composition: state-led task cards, continuity back to Chat, explicit actions, and control/evidence boundaries. The web surface remains authoritative to the canonical task API; the reference does not authorize a second task model.

## Ownership trace

`/tasks` → `appSurfaceRoutes` → `views/app.ejs` → existing `kurukoo-workspace.js` task hydration → `taskRoutes` → `microTasks` → `micro_tasks`.

Route owner: `src/routes/appSurfaceRoutes.ts` for `/tasks`; `src/routes/taskRoutes.ts` for authenticated task API boundaries.
Template owner: `views/app.ejs`.
CSS owner: canonical OS workspace CSS plus the Tasks-only `public/css/kurukoo-tasks-convergence.css`.
JS owner: existing `public/js/kurukoo-workspace.js` hydrator plus the Tasks-only `public/js/kurukoo-tasks-convergence.js`.
Data owner: `micro_tasks` through `src/services/microTasks.ts`.
Lifecycle owner: `acceptTask` / `completeTask` in `microTasks.ts`.
Header/navigation owner: shared `views/app.ejs` OS shell; unchanged except Tasks asset wiring.

## Gap classification

| Area | Status | Finding |
|---|---|---|
| Available Work | CORRECT / CONVERGED | Canonical `available` records remain source of truth; metrics now use the canonical summary endpoint. |
| In Progress | MISSING → CONVERGED | Existing surface did not independently render an explicit in-progress group or completion action. |
| Completed | MISSING → CONVERGED | Existing surface did not expose a canonical completed group; completion is now derived from `completed` / `approved`. |
| Queue identity/context | INCONSISTENT → CONVERGED | Source type/id are retained and rendered; supported source types preserve canonical continuation. |
| Status | INCONSISTENT → CONVERGED | State labels are rendered from canonical task status; no visual state is treated as completion. |
| Primary action | BROKEN | Acceptance was unconditional in the older surface. It is now shown only for canonical `available` tasks. |
| Completion action | MISSING → CONVERGED | `in_progress` tasks now expose the existing canonical completion route with optional result/evidence note. |
| Duplicate/stale acceptance | CORRECT | Existing conditional transition and `TaskStateConflictError` remain authoritative. |
| Empty state | INCONSISTENT → CONVERGED | Available, active and completed sections have distinct empty messages. |
| Loading | CORRECT / CONVERGED | Canonical loading state remains visible while task authority is read. |
| Error/unavailable | INCONSISTENT → CONVERGED | Authority failure and authorization failure are surfaced separately from empty work. |
| Responsive/mobile | CONVERGED | Tasks use the existing OS shell/responsive primitives with a Tasks-only mobile layout refinement. |
| Speculative UI | CORRECT | No provider, payment, completion, agent or execution state is invented. |

## Explicit non-goals

No Requests, Desk, Chat, Notifications, Contacts, Memory, Agent or Discover implementation was changed. No new task store, task state machine, context store, mobile renderer or global visual primitive was introduced.

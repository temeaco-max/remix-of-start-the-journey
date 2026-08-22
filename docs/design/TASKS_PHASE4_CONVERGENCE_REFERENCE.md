# Tasks — Phase 4 Reference Boundary

Approved reference boundary for the web Tasks surface: the established mobile Tasks composition and the existing canonical web lifecycle.

The reference establishes presentation ideas only: clear task state, task cards, continuity back to Chat, explicit user-controlled actions, and evidence/policy language. It does not authorize a new state machine, mock task counts, local task persistence, or removal of the real lifecycle.

Web authority remains:
- `GET /api/tasks`
- `GET /api/tasks/summary`
- `POST /api/tasks/accept`
- `POST /api/tasks/complete`
- `src/services/microTasks.ts`

The web implementation must continue to derive displayed state from these canonical owners.

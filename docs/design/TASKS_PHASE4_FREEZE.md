# Tasks — Phase 4 Freeze

Status: **FROZEN — repository/static level**

Canonical route: `/tasks`.

Ownership:
`/tasks` → `appSurfaceRoutes` → `views/app.ejs` → existing workspace/task hydrator → `taskRoutes` → `microTasks` / `micro_tasks`.

## Frozen presentation contract

- Available Work, In Progress and Completed are derived from canonical task state;
- Available tasks expose acceptance only while the canonical task is available;
- In-progress tasks expose the existing canonical completion action;
- completed/approved tasks are visibly complete but cannot be completed again;
- cancelled, expired, blocked, failed and rejected states remain truthful and actionless;
- task identity, `sourceType` and `sourceId` remain attached to the task card;
- supported task sources continue to their canonical Request, Topic, Agent or Conversation surface;
- optional completion notes are submitted through the existing completion lifecycle and do not create a second evidence store;
- loading, empty, unavailable and authorization states remain semantically distinct;
- mobile uses the existing OS shell and responsive interaction geometry;
- no Tasks-specific state machine, task store, context store or global visual primitive was introduced.

## Canonical lifecycle

`available → accepted → in_progress → completed`

Existing terminal/exception states remain authoritative: `cancelled`, `expired`, `blocked`, `failed`, `rejected`, plus the existing `approved` terminal outcome for moderated Topic verification tasks.

The UI never infers completion from card presence, acceptance, payout, provider status or visual state.

## Validation boundary

Repository: **VERIFIED / PARTIAL** — source contracts, lifecycle route ownership and CI validation are the authority.

Runtime: **UNVERIFIED** — no browser execution is available in this environment.

Real-world: **N/A** — no external provider, fulfilment, payment or real-world work is claimed.

No Desk, Chat, Requests, Notifications, Contacts, Memory, Agent or Discover implementation was changed by the Tasks convergence workstream.

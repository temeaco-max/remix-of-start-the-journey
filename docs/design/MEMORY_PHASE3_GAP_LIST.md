# Kurukoo Memory — Screen Convergence Phase 3

Baseline: `9a6ce37812ff5058f20f96449c4446a7f4f04807`.
Canonical route: `/memory`.

## Ownership

`/memory` → `src/routes/appSurfaceRoutes.ts` → `views/app.ejs` Memory composition → `src/routes/userRoutes.ts` + `src/services/memoryProfile.ts` → canonical owner-scoped profile/memory facts.

Agent Brief preferences remain embedded in the canonical profile preference owner (`proactive_brief`); context arbitration remains a separate canonical service.

## Deterministic gap list

| Area | Classification | Finding |
| --- | --- | --- |
| Memory Profile hierarchy | MISSING | Existing surface was a generic cross-client card, not a Memory Profile UI. |
| Supported preferences | MISSING | Canonical profile preferences and proactive brief controls were not surfaced for self-service. |
| Retrieval | MISSING | Canonical memory facts existed but were not presented in the screen. |
| Editing/self-service | MISSING | `/profile/update` supports owner-scoped edits but the screen did not expose supported controls. |
| Provenance/ownership | MISSING | Facts expose provenance/confidence but the screen did not show these ownership signals. |
| Privacy | CORRECT | Profile endpoints are authenticated and reject cross-account access. UI will never accept or expose arbitrary owner phone numbers. |
| Empty/loading/error/unavailable | MISSING | No Memory-specific lifecycle states. |
| Responsive | INCONSISTENT | Shared shell is responsive but no Memory information hierarchy existed. |
| Chat continuation | INCONSISTENT | Existing generic Chat link preserved relationship but not a Memory-specific continuation. |
| Agent Brief | MISSING | Canonical proactive brief settings exist but were not exposed from Memory. |

## Boundary

No second memory database, social memory, agent memory, event store or context system is introduced. The UI uses the existing profile and memory-fact authorities only.

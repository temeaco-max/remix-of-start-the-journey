# Memory — Screen 7 Freeze

Status: **FROZEN — repository/static level**

Canonical route: `/memory`.

Ownership:
`/memory` → `appSurfaceRoutes` → Memory composition → canonical `memoryProfile` / authenticated profile owner.
Memory facts remain owned by the existing Economic Request memory-facts boundary; Agent Brief preferences remain part of the existing owner-scoped profile preference authority; context arbitration remains separate.

Frozen presentation contract:
- Memory Profile with owner-scoped editable name/location/country;
- canonical active/unexpired memory facts with provenance, confidence and observed time;
- explicit self-service fact removal;
- canonical Agent Brief preferences for voice, concise/detailed style, interruption sensitivity, critical interruption and quiet hours;
- decoded safe projection endpoint so encrypted profile data is never sent directly to the browser;
- Chat continuation remains canonical `/chat` with Memory-specific context prompt;
- loading and fail-closed unavailable/error states;
- responsive, touch-safe controls;
- no second database, social memory, agent memory, event store or context system.

Validation evidence:
- Client convergence: passed
- Canonical authenticated screen set: passed
- Product completeness: passed
- OS shell contract: passed
- Accessibility: passed
- Full CSS audit: passed
- Strict CSS audit: passed
- Chat DOM safety: passed
- Lint: passed
- Mobile verification/build: passed
- Secret scan: passed
- Runtime browser proof: **UNVERIFIED**

Memory-specific repository contracts were added for owner-scoped projection, provenance, self-service removal, Agent Brief settings and no-new-store boundaries. Direct local execution of these custom scripts was unavailable because the repository could not be cloned into the local container; CI/runtime proof is therefore the authoritative validation boundary.

No Desk, Chat, Requests, Tasks, Agent or Discover implementation was changed by the Memory phase.

# Discover — Phase 5 Freeze

Status: **FROZEN — repository/static level**

Canonical route: `/discover`.

## Ownership

`/discover` → `appSurfaceRoutes` → `views/app.ejs` → Discover-specific canonical hydration → `/api/discover/home` and existing discovery network → `relationshipService` for Follow → canonical Topics / Opportunities / capability catalogue → existing Chat continuation and notification boundaries.

The legacy `views/discover.ejs` is not the route owner and was not revived.

## Frozen presentation contract

- For You, Nearby, Today, Topics, Opportunities and Explore Kurukoo are composed from canonical data.
- Nearby reuses the existing discovery network and existing map presentation layer; public coordinates remain approximate/fuzzed.
- Topics remain community-shared context and use the canonical Topic authority.
- Opportunities remain canonical discovery entities; Discover does not create a second opportunity lifecycle.
- Follow remains owned by `relationshipService` / `relationships` and is separate from authorization, messaging, Memory and Agent execution.
- Watch and Save remain owned by the existing Discover action boundary.
- Every supported item continues to the exact canonical Chat context.
- Source/truth labels distinguish community-shared, system-generated, sponsored, verified and source-declared/unverified content.
- Empty, loading and unavailable states are semantically distinct; no demo content is used as fallback state.
- No likes, reposts, follower counts, influencer mechanics, vanity metrics or social-feed ranking were added.
- Mobile uses the existing authenticated OS shell and responsive interaction geometry.
- No second Discover data store, Topic store, Follow store or Opportunity lifecycle was introduced.

## Validation boundary

Repository: **VERIFIED / PARTIAL** — source ownership, static contracts and CI validation are authoritative.

Runtime: **UNVERIFIED unless an actual browser session is available**.

Real-world: **N/A / UNVERIFIED** — no provider fulfilment, booking, payment or external-world outcome is claimed.

No Desk, Chat, Requests, Tasks, Notifications, Contacts, Memory or Agents implementation was changed by this workstream.

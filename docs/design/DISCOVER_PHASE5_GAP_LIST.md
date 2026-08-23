# Discover Phase 5 — Gap List

Base: `752c5da2a91cbac522d057c2dfb35014d1457774`

## Ownership

`/discover` → `appSurfaceRoutes` → `views/app.ejs` canonical surface → Discover-specific hydrated composition → `/api/discover/home` + existing discovery network → `relationshipService` for Follow → canonical Topics / Opportunities data → existing Chat continuation and notification architecture.

The older `views/discover.ejs` remains legacy and is not the route owner for `/discover`.

## Deterministic comparison

| Area | Classification | Finding | Action |
|---|---|---|---|
| Hierarchy | INCONSISTENT | Canonical `/discover` rendered the generic app surface rather than the approved Discover composition. | Converge the canonical shell in place. |
| For You | MISSING | Canonical data source existed but was not represented as a first-class Discover section. | Render canonical `for_you`. |
| Nearby | MISSING | Existing discovery map/network was isolated from the canonical authenticated Discover shell. | Reuse the existing map/network presentation and API. |
| Today | MISSING | Canonical time-sensitive section existed in `getDiscoverHome` but was not surfaced by the canonical shell. | Render `today`. |
| Topics | MISSING | Topic data existed in the Discover authority but was not surfaced in the canonical shell. | Render public Topics with Follow/Open actions from existing authorities. |
| Opportunities | MISSING | Opportunity-capable discovery entities existed but were not surfaced in the canonical shell. | Render lifecycle/source-aware opportunities. |
| Explore Kurukoo | MISSING | Capability catalogue integration existed but was not visible in `/discover`. | Render canonical capability discovery. |
| Follow | INCONSISTENT | Follow API delegated correctly to `relationshipService`, but the canonical shell did not expose or reflect Follow state. | Read canonical relationships and use existing Discover action boundary. |
| Truth labels | INCONSISTENT | Generic shell did not distinguish source/truth classes. | Add community/system/sponsored/verified/source-declared labels. |
| Context continuation | CORRECT / PRESERVED | Existing canonical `chatAction` carries discovery/topic context. | Preserve exact IDs in Chat links. |
| Empty state | MISSING | Generic Discover did not provide section-specific truthful empty states. | Add semantic empty messages without fabricated content. |
| Loading state | MISSING | Generic shell did not distinguish Discover authority loading. | Add explicit loading state. |
| Error/unavailable | MISSING | Generic shell did not distinguish authority failure from an empty view. | Add explicit unavailable state and Chat fallback. |
| Mobile | INCONSISTENT | Generic shell lacked Discover-specific responsive hierarchy. | Add responsive Discover composition using existing OS geometry. |
| Social mechanics | N/A | No social feed is required by the architecture. | No likes, reposts, follower counts, influencer mechanics or vanity metrics added. |

## Product truth boundary

No Discover card claims booking, payment, execution completion, inventory certainty, provider verification or guaranteed availability unless the canonical source already provides the corresponding evidence.

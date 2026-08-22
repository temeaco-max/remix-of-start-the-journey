# Kurukoo Notifications — Screen Convergence Phase 1

Baseline: `9a6ce37812ff5058f20f96449c4446a7f4f04807`

## Ownership

`/notifications` → `src/routes/appSurfaceRoutes.ts` → existing `views/app.ejs` shell → `src/routes/notificationRoutes.ts` → `src/services/pushNotifications.ts` → `internal_notifications` canonical store/queue.

The notification owner already persists unread/read state, delivery state, conversation/context IDs, canonical action metadata and object identity. The web surface was not rendering that canonical list.

## Deterministic gap list

| Area | Classification | Finding |
| --- | --- | --- |
| Hierarchy | MISSING | Existing web surface was a generic two-card continuation panel rather than a notification inbox. |
| Unread/read | MISSING | Canonical `status` exists but was not rendered or mutated on the web surface. |
| Priority/attention | INCONSISTENT | Attention can be derived from unread state and canonical action metadata, but no priority field exists; no speculative priority is introduced. |
| Timestamp | MISSING | Canonical `created_at` exists but was not shown. |
| Source identity | MISSING | `surface`, `object_type`, `object_id` and canonical context metadata were not shown. |
| Grouping | MISSING | The web surface had no unread/read grouping. |
| Action/deep-link | BROKEN | Existing UI routed every notification-style continuation to generic Chat. Canonical notification links/context were not surfaced. |
| Empty | CORRECT | The shared shell already has fail-closed messaging patterns; the new inbox will add a truthful empty state. |
| Loading | MISSING | No notification-specific loading representation. |
| Error | MISSING | No notification-specific retrieval error representation. |
| Unavailable | MISSING | Delivery/provider unavailability was not represented separately from inbox retrieval. |
| Responsive/mobile | INCONSISTENT | Shared shell is responsive, but notification scanning/action density was not purpose-built. |
| Touch targets | MISSING | No notification-specific action geometry. |
| External delivery claims | NOT APPLICABLE | The inbox must not imply FCM/native delivery merely because a notification is persisted. |

## Implementation boundary

Only the web presentation is changed. No notification event store, queue, delivery provider, read-state owner, Agent Brief, Follow, communication or context system is created.

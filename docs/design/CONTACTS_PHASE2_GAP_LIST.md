# Kurukoo Contacts — Screen Convergence Phase 2

Baseline: `9a6ce37812ff5058f20f96449c4446a7f4f04807`.
Canonical surface: `/connect`.

## Ownership

`/connect` → `src/routes/appSurfaceRoutes.ts` → `views/app.ejs` Connect composition → `src/routes/identityContactRoutes.ts` → `src/services/identityContactService.ts`.

Follow remains owned by `src/routes/relationshipRoutes.ts` / `src/services/relationshipService.ts`. Safety relationship remains owned by the safety-contact boundary. Communication authorization remains owned by `identityContactService` and the existing provider/WebRTC boundaries.

## Deterministic gap list

| Area | Classification | Finding |
| --- | --- | --- |
| Identity/profile | MISSING | Connect did not expose the canonical person/contact identity representation. |
| Avatar/placeholder | MISSING | Canonical placeholder avatar already exists but was not surfaced. |
| Contact list | MISSING | `/api/contacts` exists but was not represented in the Connect surface. |
| Discovery | INCONSISTENT | Existing contact owner supports known identities; no general global discovery contract is exposed, so no speculative directory/search is added. |
| Relationship state | MISSING | Follow/contact/safety state was not shown contextually. |
| Follow | MISSING | Canonical relationshipService exists but was not surfaced from Contacts. |
| Message | INCONSISTENT | Canonical contact communication authorization exists; no separate contact messaging owner exists. UI can continue into canonical Chat using existing prompt/context routing, but must not create a contact chat system. |
| Call | CORRECT / MISSING | Canonical authorization exists and correctly fails closed unless WebRTC is enabled. UI must expose Call only when authorized and otherwise explain unavailable state. |
| Safety contact | MISSING | Existing safety-contact relationship is available as read-only context but was not surfaced. |
| Privacy/authorization | CORRECT | Canonical contact/profile routes are authenticated and owner-scoped. |
| Empty/loading/error/unavailable | MISSING | No Contacts-specific state presentation. |
| Responsive/mobile | INCONSISTENT | Shared Connect surface is responsive; contact scanning/action density needs its own composition within the shared shell. |

## Boundary

Contacts remains contextual identity/relationship infrastructure. No social feed, second identity owner, contact-specific messaging system, contact-specific calling system or second Follow implementation is introduced.

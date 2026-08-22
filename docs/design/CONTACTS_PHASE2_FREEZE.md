# Contacts — Screen 6 Freeze

Status: **FROZEN — repository/static level**

Canonical surface: `/connect`.

Ownership:
`/connect` → `appSurfaceRoutes` → Connect composition → `identityContactRoutes` → `identityContactService`.
Follow remains owned by `relationshipService`; safety remains on the existing safety-contact boundary; messaging/calling remain on existing communication owners.

Frozen presentation contract:
- canonical identity/profile representation;
- owner-scoped contact list and known-identity add/remove;
- canonical relationship/follow state;
- safety-contact relationship shown as context, never reimplemented;
- Message continues to canonical Chat; no contact chat store;
- Call shown only when canonical communication authorization says it is available; unavailable state remains truthful;
- responsive, touch-safe cards and states;
- no social feed, second identity owner, contact-specific messaging/calling, or contact-specific Follow implementation.

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
- Runtime browser proof: **UNVERIFIED**

No Desk, Chat, Requests, Tasks, Agent or Discover implementation was changed by the Contacts phase.

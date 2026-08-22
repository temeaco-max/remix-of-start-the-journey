# PostgreSQL persistence edge inventory — 2026-08-22

## Canonical owner

Kurukoo has one semantic persistence owner: `kurukoo-persistence`. SQL.js is the lightweight local backend; PostgreSQL is the durable shared backend. No dual-write path is permitted.

## Direct `src/database.js` findings

### Production-critical durable state requiring migration

- `tradeEngine.ts` — economic orchestration reads/writes orders, escrow and provider skill state.
- `escrow.ts` — escrow lifecycle and dispute/refund state.
- `commercialLedger.ts` — commercial ledger, fee rules and durable commercial settlement state.
- `paymentRoutes.ts` — Stripe webhook idempotency and commercial-ledger reconciliation metadata.
- `orderRoutes.ts` — authenticated order read model/state.
- `savedRoutes.ts` — owner-scoped saved items.
- `cartRoutes.ts` — owner-scoped cart state and affiliate click state.
- trust/dispute services and other feature stores must be audited individually; direct SQL.js is only production-blocking when the state is canonical durable state rather than a derived/read-only view.

### Intentionally local / non-authoritative candidates

- test/demo/reset scripts and controlled simulators.
- process-local health/worker telemetry where no durable restart semantics are claimed.
- caches and transient runtime coordination.

### Existing backend-neutral domains already migrated

Authentication/OTP, Memory/Profile, Chat, Economic Request persistence, notifications, durable jobs, Agent Runtime, Coordinator state, Execution/idempotency/evidence, and Economic participants/offers.

## Current production guard

`KURUKOO_POSTGRES_APPLICATION_INTEGRATED=false` remains the correct value until all canonical durable production state is verified against the PostgreSQL backend.

## External boundary

No Cloud SQL provisioning, production deployment, DNS, IAM, Redis, live-data migration, or real payment/provider activation is performed by this tranche.

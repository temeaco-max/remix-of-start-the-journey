# PostgreSQL canonical persistence — current-main reconciliation & verification

Branch: `feat/postgres-canonical-current-main`
Base: `origin/main` `d355dac848d89443ae977e0b3ecb4be1b373edab`
Source of historical work: PR #150 head `bc0ed13b5d2f27b0a0a57d2bc8307618bff0ebfc` (stale, non-mergeable; **never force-merged**).

## 1. PR #150 reconciliation

Every changed file in the stale PR was classified against current `main`. Only the
canonical PostgreSQL persistence implementation and its proof suite were recovered;
the recovered work was re-anchored on current `main` rather than replayed.

| Classification | Scope |
| --- | --- |
| **KEEP (recovered)** | `src/services/canonicalDomainSchemas.ts`, `scripts/prepare-postgres-domain-db.ts`, `scripts/bootstrap-postgres-domain-schema.ts`, `scripts/test-postgres-domain-restart.ts` |
| **REWORK (rewritten for current main)** | `scripts/test-postgres-domain-runtime.ts` (rebuilt against canonical owners that exist on current `main`), `src/services/reminderService.ts` (migrated `getDb`/SQL.js surface to the async canonical store so Reminders persist to PostgreSQL), `src/services/persistenceReadiness.ts` + `scripts/production-preflight.mjs` (explicit `KURUKOO_POSTGRES_APPLICATION_INTEGRATED` activation gate), `.env.example` / `.env.production.example` (document the PostgreSQL environment contract) |
| **DROP** | The 150+ files in PR #150 that re-migrated unrelated durable state, restored admin routes, SEO/Storefront/topic work, and other tranches. These were already superseded or belong to other workstreams and were **not** replayed to avoid regressing `main`. |
| **ALREADY ON MAIN** | `src/services/postgresPersistence.ts`, `src/services/canonicalStore.ts`, `src/services/canonicalPersistence.ts`, `src/services/memoryProfile.ts`, `src/services/economicRequestPersistence.ts`, `src/services/agentRuntime.ts`, `src/services/pushNotifications.ts`, `scripts/migrate-sqlite-to-postgres.ts`, `scripts/test-postgres-persistence.ts`, `scripts/test-postgres-canonical-runtime.ts`, `scripts/test-postgres-migration-roundtrip.ts`. These owners already route through the canonical store with PostgreSQL support. |
| **CONFLICTS WITH CURRENT MAIN** | No merge applied. The recovered files were copied onto current `main` and validated independently. |

Constraint honoured: the unrelated uncommitted change in `src/services/agentEconomicRequestOrchestrator.ts`
(compound-goal work from another workstream) was stashed and **not** incorporated.

## 2. PostgreSQL-specific compatibility fixes (not weakening proofs)

1. **`src/services/pushNotifications.ts`** — the PG dedup predicate
   `created_at > CURRENT_TIMESTAMP - INTERVAL '10 minutes'` ran against a `TEXT` typed
   `created_at` column (the PG DDL declares `TEXT DEFAULT CURRENT_TIMESTAMP`). PG raised
   `ERROR: operator does not exist: text > timestamp with time zone`, the `.catch()` swallowed it,
   and every identical notification was re-inserted (breaking the dedup/idempotency contract).
   Fixed to `created_at::timestamptz > CURRENT_TIMESTAMP - INTERVAL '10 minutes'`.
   This is a genuine PostgreSQL-vs-SQL.js compatibility defect (§13).

2. **`src/services/reminderService.ts`** — migrated the reminders owner onto the canonical
   store with explicit SQL.js/PostgreSQL schema branches so reminders, their owner-scoped
## 3. Verification (run against a real local PostgreSQL 14)

| Gate | Command | Result |
| --- | --- | --- |
| Typecheck | `npx tsc --noEmit` | PASS |
| Build | `npm run build` | PASS |
| Persistence boundary audit | `node scripts/audit-persistence-boundary.mjs` | VERIFIED |
| Shared writer / two process / rollback / idempotency | `npm run test:postgres-persistence` | VERIFIED |
| Fresh domain DB prepare | `npm run prepare:postgres-domain-db` | VERIFIED |
| Bootstrap schema | `npm run bootstrap:postgres-domain-schema` | VERIFIED |
| Domain runtime | `npm run test:postgres-domain-runtime` | VERIFIED |
| Cross-process restart | `npm run test:postgres-domain-restart` | VERIFIED |
| Migration round-trip | `npm run test:postgres-migration-roundtrip` | VERIFIED |

The domain runtime proof exercises, in PostgreSQL mode: Memory/profile, Economic Request
(create/update/transition), Agent Goal + goal events + goal-dependency ownership, notification,
reminder, order, owner isolation (A vs B), idempotency (duplicate economic request/goal/
notification/order rejected), transaction rollback (no partial durable state), a successful
transaction committing a full unit, and a store-reopen persistence boundary.

The restart proof runs Process A (write) then spawns a separate Process B (read) against the
same PostgreSQL database and confirms the canonical layer recovers Memory/profile, Economic
Request, Agent Goal/events, notification, reminder and order state with owner isolation.

## 4. Production pre-flight (fail-closed)

Verified fail-closed contract (`scripts/production-preflight.mjs`):

- `KURUKOO_DATABASE_MODE=sqljs` + Cloud Run → **BLOCK**
- `KURUKOO_DATABASE_MODE=postgres` + `KURUKOO_POSTGRES_APPLICATION_INTEGRATED=false` → **BLOCK**
- `KURUKOO_DATABASE_MODE=postgres` + flag `true` + no `DATABASE_URL` → **BLOCK**
- PostgreSQL with the full call-surface migrated + flag set + external connectivity → activation technically possible

`KURUKOO_POSTGRES_APPLICATION_INTEGRATED` defaults to `false` and is never set to `true` in the
committed templates. The preflight fail-closed gate is scoped exactly like
`scripts/audit-persistence-boundary.mjs`: direct SQL.js access inside the **critical shared-state
services** keeps PostgreSQL mode BLOCKED; legacy synchronous call surfaces outside that boundary are
reported as explicit warnings, never silently ignored. A fully satisfied environment yields
status `warning` / exit 0 — activation technically possible, still requiring the operator-set
activation grant and external infrastructure. **No production activation and no deployment is performed.**

## 4b. Migration repeatability contract

`scripts/migrate-sqlite-to-postgres.ts` records a deterministic schema checksum in
`schema_migrations` (`sqljs-export-<checksum>`). Re-running an identical migration against an
already-migrated database is recognised via that ledger: import is skipped, no duplicate durable
effects are created, and the run reports `"repeated": true, "status": "verified"`. DDL is emitted as
`CREATE TABLE IF NOT EXISTS` / `CREATE ... INDEX IF NOT EXISTS` and row imports use
`ON CONFLICT DO NOTHING`, so a repeated import can neither duplicate rows nor fail on existing
schema. This repeatability proof is part of `scripts/test-postgres-migration-roundtrip.ts`.

## 4c. CI fail-closed matrix

The `postgres-persistence` CI job asserts all four preflight cases: SQL.js+Cloud Run BLOCK,
PostgreSQL-without-grant BLOCK, PostgreSQL-without-URL BLOCK, fully satisfied → not blocked.

## 5. Environment contract

`.env.example` and `.env.production.example` now document: `KURUKOO_DATABASE_MODE`,
`KURUKOO_POSTGRES_APPLICATION_INTEGRATED`, `DATABASE_URL`, `POSTGRES_URL`,
`KURUKOO_POSTGRES_SSL`, `KURUKOO_POSTGRES_POOL_MAX`, `KURUKOO_POSTGRES_IDLE_TIMEOUT_SECONDS`,
`KURUKOO_POSTGRES_CONNECT_TIMEOUT_SECONDS`. Safe defaults: `KURUKOO_DATABASE_MODE=sqljs`,
`KURUKOO_POSTGRES_APPLICATION_INTEGRATED=false`. `.env` is ignored (`.gitignore` line 10).

## 6. Classification

- **IMPLEMENTED + EXTERNAL/DEPLOYMENT BLOCKED** — all repository-side PostgreSQL persistence gates
  are green (typecheck, build, boundary audit, fresh-DB bootstrap, domain runtime, shared writer,
  restart, owner isolation, rollback, idempotency, migration round-trip incl. repeatability), but
  actual Cloud Run activation requires external infrastructure (below) and the operator cutover.

### Exact external activation prerequisites (not provisioned here, by design)
- A managed PostgreSQL 15+ instance (Cloud SQL / RDS), a dedicated database, and a least-privilege
  `DATABASE_URL` connection secret.
- IAM / network access from the Cloud Run service to the database (VPC connector / private IP or
  authorized public IP + SSL), Secret Manager wiring for `DATABASE_URL`, and a Cloud Run service
  revision running with the PostgreSQL environment contract.
- Operator-set `KURUKOO_POSTGRES_APPLICATION_INTEGRATED=true` at the controlled cutover only.
- Reconciliation of any payment/fulfilment accounts only after the platform persistence substrate
  is externally active.
   CRUD, and due-processing persist to PostgreSQL. SQL.js behaviour is unchanged.
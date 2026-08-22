# Kurukoo on Google Cloud Run

The repository contains a direct Cloud Run deployment path so Google AI Studio Build does not have to remain in the deployment chain.

## Current production boundary

**Cloud Run production remains BLOCKED until PostgreSQL is the active canonical persistence owner.**

The current Kurukoo persistence owner is SQL.js backed by a local SQLite file. That is valid for a single-process environment with a genuinely durable host filesystem, but Cloud Run container storage is instance-local and ephemeral. A Cloud Run restart, replacement, or a second instance must never be allowed to define or lose canonical user/application state.

PR #88 established the SQL.js/Cloud Run block. The current task adds the PostgreSQL cutover foundation without provisioning or activating external infrastructure.

## Persistence modes

`KURUKOO_DATABASE_MODE=sqljs`

- lightweight local/development canonical persistence;
- one process/one worker only for shared-write safety;
- Cloud Run durable production remains BLOCKED.

`KURUKOO_DATABASE_MODE=postgres`

- intended durable/shared deployment mode;
- PostgreSQL is the sole semantic persistence owner once the async application adapter is integrated;
- no SQL.js dual-write or read-through mirror is allowed;
- the current repository deliberately fails closed because the existing services still expose synchronous SQL.js database calls and have not yet been migrated to the async PostgreSQL boundary.

The readiness state therefore remains `BLOCKED` for PostgreSQL until application integration is complete. Once integrated, the readiness contract is designed to report `READY_FOR_EXTERNAL_CONFIG` when a valid PostgreSQL connection signal is present.

## Deployment shape

```text
GitHub main
  ↓
Cloud Build
  ↓
Artifact Registry
  ↓
Cloud Run
  ↓
Kurukoo
  ↓
ONE canonical persistence owner
  ├── SQL.js for lightweight local mode
  └── PostgreSQL for durable shared deployment mode
```

The existing `Dockerfile`, `deploy/cloud-run/service.yaml`, and `cloudbuild.yaml` are the canonical repository deployment artifacts.

## PostgreSQL cutover foundation

`src/services/postgresPersistence.ts` provides the async PostgreSQL connection, bounded pooling, parameterized tagged queries, transaction and graceful shutdown boundary. It intentionally does not emulate the synchronous SQL.js API.

`scripts/migrate-sqlite-to-postgres.ts` provides the deterministic migration/export foundation. It defaults to a dry-run, preserves source values exactly, and never starts a production migration. `--execute` is an explicit import operation and remains an operator-controlled action.

The migration foundation is tied to schema version `2026-08-22-canonical-runtime-schema` from `data/audits/database-schema-manifest.json`.

## Required production change

The remaining application change is not another database architecture. It is the async persistence call-surface migration:

```text
current services
  ↓
canonical async Kurukoo persistence interface
  ↓
SQL.js adapter       PostgreSQL adapter
(local/test)           (durable/shared)
```

After that migration, validate the PostgreSQL path with fresh schema, migration integrity, restart, two-process shared-state, transactions, idempotency, connection-loss and schema-mismatch tests. Only then should a managed PostgreSQL service be configured.

The final operational cutover remains:

1. stop writes;
2. export SQL.js state;
3. import into PostgreSQL;
4. verify row counts, important integrity constraints and encrypted Memory preservation;
5. switch `KURUKOO_DATABASE_MODE=postgres`;
6. start the application;
7. verify `/readyz` and core journeys;
8. rollback before acceptance if verification fails.

No repository operation provisions Cloud SQL, changes IAM/DNS, migrates live data or creates Redis.

## Cloud Run proving configuration

The current proving profile remains conservative:

- Cloud Run: 4 vCPU
- memory: 4 GiB
- concurrency: 1
- request timeout: 300 seconds
- minimum instances: 0
- maximum instances: 1 while SQL.js remains the local persistence owner
- `KURUKOO_SMOLLM2_LOCAL=true`
- `SMOLLM2_MODEL=HuggingFaceTB/SmolLM2-1.7B-Instruct`
- `SMOLLM2_DTYPE=q4`
- model cache: `/tmp/huggingface`
- background workers: one application worker only; external execution disabled

These are repository proving defaults, not claims about the cheapest production configuration.

## Secrets

Do not put API keys, database credentials or JWT secrets in `cloudbuild.yaml`, the Docker image, frontend bundles or Git.

Use Secret Manager / Cloud Run environment configuration for `DATABASE_URL` and related database settings once external infrastructure is provisioned.

## Runtime health

`/health` reports application/database health plus persistence readiness.

`/readyz` verifies that the configured persistence mode is safe for the deployment environment. SQL.js + Cloud Run remains `not_ready`; PostgreSQL is `ready_for_external_config` only after the application adapter integration gate passes.

## Workers and shared coordination

A shared database does **not** make all background workers horizontally safe by itself. Notifications, execution, escrow/payment, recurring billing and Agent worker timers remain process-local until their ownership/lease semantics are explicitly reviewed. Redis is not introduced by this persistence task.

## External activation

Cloud Run hosting does not itself activate payment settlement, external channel delivery, FCM, voice, provider verification, dispatch or real emergency connectivity. Those remain independently configured and evidence-gated.

## Existing AI Studio deployment

Google AI Studio Build can continue to publish the same repository to Cloud Run. The direct Cloud Build path is an alternative that makes GitHub `main` the deployment source of truth.

No application architecture depends on AI Studio Build.

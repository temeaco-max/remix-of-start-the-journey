# Database migration policy

Kurukoo has one semantic persistence owner: `kurukoo-persistence`. SQL.js and PostgreSQL are backend implementations selected by `KURUKOO_DATABASE_MODE`; they are never dual-written.

The current SQL.js runtime still bootstraps its legacy schema from `src/database.ts`. The canonical schema manifest remains `data/audits/database-schema-manifest.json` and must be refreshed with every reviewed schema change.

## PostgreSQL cutover foundation

`src/services/postgresPersistence.ts` provides the asynchronous PostgreSQL connection, pooling, transaction and shutdown boundary. The application currently exposes synchronous `db.run/db.exec/db.prepare` calls throughout the service layer, so PostgreSQL mode remains fail-closed until those calls are migrated to the async canonical persistence interface. A synchronous PostgreSQL shim would create write-order and transaction hazards and is explicitly prohibited.

`scripts/migrate-sqlite-to-postgres.ts` is the deterministic export/import foundation:

- default mode is dry-run and never connects to PostgreSQL;
- `--verify-only` reports source schema/table counts and important integrity targets;
- `--execute` is the explicit non-production import mode and requires `DATABASE_URL` or `POSTGRES_URL`;
- imports occur in one PostgreSQL transaction;
- source values are copied exactly, including encrypted Memory values stored as opaque text;
- no dual-write period is created;
- no production migration is started automatically.

The schema version used by the migration foundation is `2026-08-22-canonical-runtime-schema`, matching the canonical database manifest.

## Cutover gate

Before enabling PostgreSQL in a deployed environment, all of the following must pass:

1. the application persistence call surface is migrated to the async canonical adapter;
2. a fresh PostgreSQL schema passes schema/version checks;
3. migration row counts and integrity checks pass;
4. authentication, Memory/Profile, Chat, Economic Requests, Notifications, Agent state and execution/idempotency records pass restart and transaction tests;
5. two independent application processes observe the same PostgreSQL state;
6. connection-loss, rollback and schema-mismatch tests pass;
7. Cloud Run runtime validation passes against the managed PostgreSQL service.

Until then `KURUKOO_DATABASE_MODE=postgres` must remain blocked in production.

## Live cutover procedure

1. stop application writes;
2. create a verified SQL.js export/snapshot;
3. execute the PostgreSQL import;
4. verify row counts, key/integrity checks and encrypted Memory preservation;
5. switch `KURUKOO_DATABASE_MODE=postgres` and required secret/configuration values;
6. start the application and run `/readyz` plus core journey checks;
7. rollback to the SQL.js snapshot only if verification fails before PostgreSQL is accepted as the sole owner.

No live migration, DNS change, IAM change or Cloud SQL provisioning is performed by repository code.

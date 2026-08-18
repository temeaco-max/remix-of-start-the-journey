# Database migration policy

Kurukoo's current SQL.js runtime still bootstraps its legacy schema from `src/database.ts`. Do not add new schema declarations to arbitrary services.

Until the PostgreSQL persistence adapter is activated, the repository uses `data/audits/database-schema-manifest.json` to detect unreviewed schema changes. Any change to `src/database.ts` must update the manifest and include an explicit maintenance note.

The next persistence cutover must introduce a real versioned migration runner before production schema semantics change. The runner should:

1. apply ordered forward migrations;
2. record applied versions/checksums;
3. run in release/deploy, not ad hoc inside request handling;
4. fail closed on checksum drift;
5. support backup/restore verification before destructive changes;
6. expose migration readiness through `/readyz`.

Until that cutover exists, do not claim PostgreSQL support merely because the infrastructure containers exist.

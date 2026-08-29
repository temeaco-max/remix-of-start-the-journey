/* Copyright (c) 2026 temeaco-max. All rights reserved. Proprietary and confidential. */
import fs from 'node:fs';
import { execFileSync } from 'node:child_process';

const manifestPath = 'data/audits/database-schema-manifest.json';
const schemaPath = 'src/database.ts';
let gitBlobSha = '';
try { gitBlobSha = execFileSync('git', ['hash-object', schemaPath], { encoding: 'utf8' }).trim(); } catch {}
const expected = fs.existsSync(manifestPath) ? JSON.parse(fs.readFileSync(manifestPath, 'utf8')) : null;
if (!expected?.schema_git_blob_sha) {
  console.error(`Database schema manifest is missing or incomplete: ${manifestPath}`);
  process.exit(1);
}
if (expected.schema_git_blob_sha !== gitBlobSha) {
  console.error(`Database schema changed without an explicit migration/manifest update. expected=${expected.schema_git_blob_sha} actual=${gitBlobSha}`);
  process.exit(1);
}
console.log(JSON.stringify({ status: 'ok', schema_path: schemaPath, schema_git_blob_sha: gitBlobSha, manifest: manifestPath, commit: process.env.GITHUB_SHA || 'local', rule: 'schema changes require an explicit migration note and manifest update' }, null, 2));

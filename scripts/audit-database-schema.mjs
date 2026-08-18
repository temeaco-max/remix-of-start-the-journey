import fs from 'node:fs';
import crypto from 'node:crypto';
import { execFileSync } from 'node:child_process';

const manifestPath = 'data/audits/database-schema-manifest.json';
const schemaPath = 'src/database.ts';
const current = fs.readFileSync(schemaPath);
const sha256 = crypto.createHash('sha256').update(current).digest('hex');
let gitBlobSha = '';
try { gitBlobSha = execFileSync('git', ['hash-object', schemaPath], { encoding: 'utf8' }).trim(); } catch {}
const expected = fs.existsSync(manifestPath) ? JSON.parse(fs.readFileSync(manifestPath, 'utf8')) : null;
if (!expected?.schema_sha256 || !expected?.schema_git_blob_sha) {
  console.error(`Database schema manifest is missing or incomplete: ${manifestPath}`);
  process.exit(1);
}
if (expected.schema_sha256 !== sha256 || expected.schema_git_blob_sha !== gitBlobSha) {
  console.error(JSON.stringify({ status: 'drift', expected, actual: { schema_sha256: sha256, schema_git_blob_sha: gitBlobSha }, rule: 'schema changes require an explicit migration note and manifest update' }, null, 2));
  process.exit(1);
}
console.log(JSON.stringify({ status: 'ok', schema_path: schemaPath, schema_sha256: sha256, schema_git_blob_sha: gitBlobSha, manifest: manifestPath, commit: process.env.GITHUB_SHA || 'local', rule: 'schema changes require an explicit migration note and manifest update' }, null, 2));

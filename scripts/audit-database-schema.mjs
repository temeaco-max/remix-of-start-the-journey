import fs from 'node:fs';
import crypto from 'node:crypto';

const manifestPath = 'data/audits/database-schema-manifest.json';
const schemaPath = 'src/database.ts';
const current = fs.readFileSync(schemaPath);
const sha256 = crypto.createHash('sha256').update(current).digest('hex');
const gitSha = process.env.GITHUB_SHA || 'local';
const expected = fs.existsSync(manifestPath) ? JSON.parse(fs.readFileSync(manifestPath, 'utf8')) : null;

if (!expected?.schema_sha256) {
  console.error(`Database schema manifest is missing or incomplete: ${manifestPath}`);
  process.exit(1);
}

if (expected.schema_sha256 !== sha256) {
  console.error(`Database schema changed without a migration/manifest update. expected=${expected.schema_sha256} actual=${sha256}`);
  process.exit(1);
}

console.log(JSON.stringify({
  status: 'ok',
  schema_path: schemaPath,
  schema_sha256: sha256,
  manifest: manifestPath,
  commit: gitSha,
  rule: 'schema changes require an explicit migration note and manifest update',
}, null, 2));

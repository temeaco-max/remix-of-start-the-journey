/**
 * Contract test: trust routes (disputes/escrow/scam) use JWT phone only.
 * Run: npx tsx scripts/test-trust-routes.ts
 */
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';

async function main() {
  const src = await fs.readFile(new URL('../src/routes/trustRoutes.ts', import.meta.url), 'utf8');
  assert.match(src, /authenticateUser/, 'trustRoutes must use authenticateUser');
  assert.match(src, /req\.user\?\.phone|sessionPhone/, 'identity from JWT session');
  assert.match(src, /must match session|Forbidden/, 'must reject mismatched client phone');
  assert.doesNotMatch(src, /\+2348030000000/, 'no demo phone');
  assert.doesNotMatch(
    src,
    /const\s+phone\s*=\s*(req\.body|req\.query)\.phone/,
    'must not take identity solely from client body/query'
  );
  assert.match(src, /dispute|escrow|scam/i, 'trust domain present');
  console.log('test-trust-routes: PASS');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

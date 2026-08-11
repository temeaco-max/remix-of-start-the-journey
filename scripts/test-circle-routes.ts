/**
 * Contract test: circle routes use JWT phone only (no client-trusted identity).
 * Run: npx tsx scripts/test-circle-routes.ts
 */
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';

async function main() {
  const src = await fs.readFile(new URL('../src/routes/circleRoutes.ts', import.meta.url), 'utf8');
  assert.match(src, /authenticateUser/, 'circleRoutes must use authenticateUser');
  assert.match(src, /req\.user\?\.phone|sessionPhone/, 'identity from JWT session');
  assert.match(src, /must match session|Forbidden/, 'must reject mismatched client phone');
  assert.doesNotMatch(src, /\+2348030000000/, 'no demo phone');
  // Must not assign identity from body/query without JWT comparison
  assert.doesNotMatch(
    src,
    /const\s+phone\s*=\s*(req\.body|req\.query)\.phone/,
    'must not take identity solely from client body/query'
  );
  assert.match(src, /createMoneyCircle|joinMoneyCircle|recordContribution/, 'circle domain services present');
  console.log('test-circle-routes: PASS');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

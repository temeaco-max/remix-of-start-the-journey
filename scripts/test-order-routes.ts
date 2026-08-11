/**
 * Contract test: order routes use JWT identity only.
 * Run: npx tsx scripts/test-order-routes.ts
 */
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';

async function main() {
  const src = await fs.readFile(new URL('../src/routes/orderRoutes.ts', import.meta.url), 'utf8');
  assert.match(src, /authenticateUser/, 'orderRoutes must use authenticateUser');
  assert.match(src, /req\.user\?\.phone|sessionPhone/, 'identity from JWT session');
  assert.doesNotMatch(src, /\+2348030000000/, 'no demo phone');
  assert.doesNotMatch(
    src,
    /const\s+phone\s*=\s*\(req\.query\.phone as string\)\s*\|\|/,
    'must not default identity from query.phone'
  );
  assert.doesNotMatch(
    src,
    /const\s+phone\s*=\s*(req\.body|req\.query)\.phone(?!\s*&&)/,
    'must not take identity solely from client body/query'
  );
  assert.match(src, /orders|delivery-status/, 'order domain present');
  console.log('test-order-routes: PASS');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

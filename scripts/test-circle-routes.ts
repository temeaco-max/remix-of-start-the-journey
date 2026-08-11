/**
 * Contract test: circle routes use JWT phone only (no client-trusted identity).
 * Run: npx tsx scripts/test-circle-routes.ts
 */
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';

async function main() {
  const src = await fs.readFile(new URL('../src/routes/circleRoutes.ts', import.meta.url), 'utf8');
  assert.match(src, /authenticate|jwt|req\.user/i, 'circleRoutes must authenticate');
  assert.doesNotMatch(src, /req\.body\.phone|req\.query\.phone/, 'no client-trusted phone');
  assert.doesNotMatch(src, /\\+2348030000000/, 'no demo phone');
  assert.match(src, /circle/i, 'circle domain present');
  console.log('test-circle-routes: PASS');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

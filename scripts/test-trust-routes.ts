/**
 * Contract test: trust routes (disputes/escrow/scam) use JWT phone only.
 * Run: npx tsx scripts/test-trust-routes.ts
 */
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';

async function main() {
  const src = await fs.readFile(new URL('../src/routes/trustRoutes.ts', import.meta.url), 'utf8');
  assert.match(src, /authenticate|jwt|req\.user/i, 'trustRoutes must authenticate');
  assert.doesNotMatch(src, /req\.body\.phone|req\.query\.phone/, 'no client-trusted phone');
  assert.doesNotMatch(src, /\\+2348030000000/, 'no demo phone');
  assert.match(src, /dispute|escrow|scam/i, 'trust domain present');
  console.log('test-trust-routes: PASS');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

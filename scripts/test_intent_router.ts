import { routeIntent } from '../src/services/intentRouter.js';

async function assertStorefront(query: string, expectedSkill: string) {
  const result = await routeIntent(query, '+2348030000000');
  if (result.skill !== expectedSkill) throw new Error(`${query}: expected skill ${expectedSkill}, got ${result.skill}`);
  if (result.cardData?.type !== 'agentic_storefront') {
    throw new Error(`${query}: expected canonical agentic storefront card, got ${result.cardData?.type || 'none'}`);
  }
  console.log(`✓ ${query} → ${expectedSkill} → agentic_storefront`);
}

async function test() {
  await assertStorefront('I need a plumber', 'find_worker');
  await assertStorefront('I want to buy a car', 'buy_car');
  await assertStorefront('I need tickets', 'buy_ticket');
  await assertStorefront('fix my phone', 'repair');
  await assertStorefront('book an artist', 'verified_artist');
}

test().catch((error) => {
  console.error('Intent router regression test failed:', error);
  process.exitCode = 1;
});

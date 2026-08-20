import assert from 'node:assert/strict';
import { getDiscoverCategoryInventory } from '../src/services/discoverCommercialComposition.js';

const items = await getDiscoverCategoryInventory('okada', undefined, 5);
assert.ok(Array.isArray(items), 'category inventory must return an array');
for (const item of items) {
  assert.equal(typeof item.sponsored, 'boolean', 'sponsored state must be explicit');
  assert.ok(Array.isArray(item.actions), 'category Discover items need actions');
  assert.ok(item.chatAction, 'category Discover items need a Chat handoff');
}
console.log(JSON.stringify({ passed: true, category: 'okada', count: items.length }, null, 2));

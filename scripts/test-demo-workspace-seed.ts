/* Copyright (c) 2026 temeaco-max. All rights reserved. Proprietary and confidential. */
import assert from 'node:assert/strict';
import fs from 'node:fs';

const seed = fs.readFileSync('src/services/demoWorkspaceSeed.ts', 'utf8');
const database = fs.readFileSync('src/database.ts', 'utf8');

assert.match(seed, /NODE_ENV === 'production'/, 'Demo seed must have a production guard.');
assert.match(seed, /NODE_ENV === 'test'/, 'Demo seed must stay out of automated test databases.');
assert.match(seed, /KURUKOO_DEMO_DATA/, 'Demo seed must be disable-able through KURUKOO_DEMO_DATA.');
assert.match(seed, /demo_workspace_seed_version/, 'Demo seed must be versioned and idempotent.');
for (const marker of ['economic_requests', 'economic_offers', 'cart_items', 'saved_items', 'reminders', 'internal_notifications', 'agent_goals', 'messages', 'topics', 'micro_tasks']) {
  assert.match(seed, new RegExp(marker), `Demo seed missing fixture family: ${marker}`);
}
assert.match(database, /seedDemoWorkspaceState/, 'Database bootstrap must invoke the development demo seed.');

console.log('Demo workspace seed contract passed: production-safe, test-safe, idempotent, and covers the primary visual fixture families.');

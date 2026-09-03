/* Copyright (c) 2026 temeaco-max. All rights reserved. Proprietary and confidential. */
import assert from 'node:assert/strict';
import fs from 'node:fs';

const app = fs.readFileSync('views/app.ejs', 'utf8');

assert.ok(app.includes('k-app-surface'), 'Activity surface must use the unified k-app-surface loader');
assert.ok(!app.includes('kurukoo-requests-convergence'), 'Activity must use unified visual system, not section-specific CSS/JS');
assert.ok(!app.includes('data-workspace-owned-surface="requests"'), 'App view must not expose workspace ownership attributes');
assert.ok(!app.includes('section === \'requests\''), 'App view must not have conditional section blocks for Activity');

console.log('Activity Screen Convergence contract passed: unified visual system, no section-specific CSS/JS, no implementation attributes.');

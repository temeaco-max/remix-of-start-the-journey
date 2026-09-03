/* Copyright (c) 2026 temeaco-max. All rights reserved. Proprietary and confidential. */
import assert from 'node:assert/strict';
import fs from 'node:fs';

const profile = fs.readFileSync('src/services/memoryProfile.ts', 'utf8');
const routes = fs.readFileSync('src/routes/userRoutes.ts', 'utf8');
const app = fs.readFileSync('views/app.ejs', 'utf8');
const surfaceRoutes = fs.readFileSync('src/routes/appSurfaceRoutes.ts', 'utf8');

assert.match(profile, /getMemoryFacts/);
assert.match(profile, /revokeMemoryFact/);
assert.match(profile, /MemoryProvenance/);
assert.match(profile, /encryptData/);
assert.match(routes, /router\.get\('\/profile'/);
assert.match(routes, /router\.post\('\/profile\/update'/);
assert.match(routes, /sanitizeProactiveBriefPreferences/);
assert.match(routes, /voice_enabled/);
assert.match(routes, /quiet_hours/);
assert.match(routes, /interruption_sensitivity/);
assert.ok(!app.includes('kurukoo-memory-convergence'), 'Memory must use unified visual system, not section-specific CSS/JS');
assert.ok(app.includes('k-app-surface'), 'App view must use unified k-app-surface primitive');

console.log('Memory convergence contract passed: unified visual system, canonical memory facts API and owner-scoped profile mutations covered.');

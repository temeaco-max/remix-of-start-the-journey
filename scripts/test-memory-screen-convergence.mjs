import assert from 'node:assert/strict';
import fs from 'node:fs';

const profile = fs.readFileSync('src/services/memoryProfile.ts', 'utf8');
const routes = fs.readFileSync('src/routes/userRoutes.ts', 'utf8');
const screen = fs.readFileSync('public/js/kurukoo-memory-convergence.js', 'utf8');
const css = fs.readFileSync('public/css/kurukoo-memory-convergence.css', 'utf8');
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
assert.match(screen, /\/api\/profile/);
assert.match(screen, /\/api\/profile\/update/);
assert.match(screen, /\/api\/chat\/economic-requests\/memory\/facts/);
assert.match(screen, /Remove fact/);
assert.match(screen, /proactive_brief/);
assert.match(screen, /Continue in Chat/);
assert.doesNotMatch(screen, /CREATE TABLE|memory_profiles|memory_facts.*INSERT/);
assert.match(css, /k-app-section-memory/);
assert.match(css, /min-height:44px/);
assert.match(surfaceRoutes, /section === 'memory'/);
assert.match(surfaceRoutes, /kurukoo-memory-convergence\\.css/);
assert.match(surfaceRoutes, /kurukoo-memory-convergence\\.js/);

console.log('Memory convergence contract passed.');

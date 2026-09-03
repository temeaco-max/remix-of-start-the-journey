/* Copyright (c) 2026 temeaco-max. All rights reserved. Proprietary and confidential. */
import fs from 'node:fs';

function assert(condition, message) { if (!condition) throw new Error(`FAIL: ${message}`); console.log(`ok: ${message}`); }

const appSurface = fs.readFileSync('src/routes/appSurfaceRoutes.ts', 'utf8');
const app = fs.readFileSync('views/app.ejs', 'utf8');
const routes = fs.readFileSync('src/routes/discoveryRoutes.ts', 'utf8');

assert(appSurface.includes("['/discover': 'discover']") || appSurface.includes("'/discover': 'discover'"), 'canonical /discover route is registered by appSurfaceRoutes');
assert(!app.includes('kurukoo-discover-convergence'), 'Explore must use unified visual system, not section-specific CSS/JS');
assert(app.includes('k-app-surface'), 'App view must use unified k-app-surface primitive');
assert(routes.includes('/api/discover'), 'canonical Discover API exists');

console.log('PASS test-discover-surface');

/* Copyright (c) 2026 temeaco-max. All rights reserved. Proprietary and confidential. */
import assert from 'node:assert/strict';
import fs from 'node:fs';

const route = fs.readFileSync('src/routes/notificationRoutes.ts', 'utf8');
const service = fs.readFileSync('src/services/pushNotifications.ts', 'utf8');
const app = fs.readFileSync('views/app.ejs', 'utf8');
const surfaceRoutes = fs.readFileSync('src/routes/appSurfaceRoutes.ts', 'utf8');

assert.match(route, /getInternalNotifications/);
assert.match(route, /markNotificationRead/);
assert.match(service, /context_id/);
assert.match(service, /object_type/);
assert.match(service, /canonical_action/);
assert.ok(!app.includes('kurukoo-notifications-convergence.css'), 'Notifications must use unified visual system, not section-specific CSS');
assert.ok(!app.includes('kurukoo-notifications-convergence.js'), 'Notifications must use unified runtime, not section-specific JS');
assert.ok(app.includes('k-app-surface'), 'App view must use unified k-app-surface primitive');
assert.ok(!surfaceRoutes.includes('kurukoo-notifications-convergence'), 'Surface routes must not reference removed notifications convergence files');

console.log('Notifications convergence contract passed.');

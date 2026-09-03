/* Copyright (c) 2026 temeaco-max. All rights reserved. Proprietary and confidential. */
import assert from 'node:assert/strict';
import fs from 'node:fs';

const identityService = fs.readFileSync('src/services/identityContactService.ts', 'utf8');
const identityRoutes = fs.readFileSync('src/routes/identityContactRoutes.ts', 'utf8');
const relationships = fs.readFileSync('src/services/relationshipService.ts', 'utf8');
const app = fs.readFileSync('views/app.ejs', 'utf8');
const surfaceRoutes = fs.readFileSync('src/routes/appSurfaceRoutes.ts', 'utf8');

assert.match(identityService, /getPersonProfile/);
assert.match(identityService, /listContacts/);
assert.match(identityService, /canCommunicate/);
assert.match(identityService, /safetyContact/);
assert.match(identityService, /KURUKOO_WEBRTC_ENABLED/);
assert.match(identityRoutes, /router\.get\('\/contacts'/);
assert.match(identityRoutes, /router\.post\('\/contacts'/);
assert.match(identityRoutes, /communication-check/);
assert.match(relationships, /relationshipType.*follow/);
assert.ok(!app.includes('kurukoo-contacts-convergence'), 'Contacts must use unified visual system, not section-specific CSS/JS');
assert.ok(app.includes('k-app-surface'), 'App view must use unified k-app-surface primitive');

console.log('Contacts convergence contract passed: unified visual system, canonical identity/contact API and relationship boundaries covered.');

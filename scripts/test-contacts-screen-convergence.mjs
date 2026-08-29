/* Copyright (c) 2026 temeaco-max. All rights reserved. Proprietary and confidential. */
import assert from 'node:assert/strict';
import fs from 'node:fs';

const identityService = fs.readFileSync('src/services/identityContactService.ts', 'utf8');
const identityRoutes = fs.readFileSync('src/routes/identityContactRoutes.ts', 'utf8');
const relationships = fs.readFileSync('src/services/relationshipService.ts', 'utf8');
const screen = fs.readFileSync('public/js/kurukoo-contacts-convergence.js', 'utf8');
const css = fs.readFileSync('public/css/kurukoo-contacts-convergence.css', 'utf8');
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
assert.match(screen, /\/api\/contacts/);
assert.match(screen, /\/api\/relationships/);
assert.match(screen, /targetType: 'person'/);
assert.match(screen, /Message/);
assert.match(screen, /Call unavailable/);
assert.match(screen, /Safety contact/);
assert.doesNotMatch(screen, /CREATE TABLE|person_contacts/);
assert.match(css, /k-app-section-connect/);
assert.match(css, /min-height:44px/);
assert.match(surfaceRoutes, /section === 'connect'/);
assert.match(surfaceRoutes, /kurukoo-contacts-convergence\\.css/);
assert.match(surfaceRoutes, /kurukoo-contacts-convergence\\.js/);

console.log('Contacts convergence contract passed.');

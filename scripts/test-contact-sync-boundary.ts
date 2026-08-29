/* Copyright (c) 2026 temeaco-max. All rights reserved. Proprietary and confidential. */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const source = fs.readFileSync(path.resolve('src/services/contactSyncService.ts'), 'utf8');
assert.doesNotMatch(source, /DEMO_PHONE_METADATA|Yemi Alade|Oliver Smith|firstNames|lastNames/);
assert.match(source, /KURUKOO_CONTACT_SYNC_ENABLED/);
assert.match(source, /trusted_provider/);
assert.match(source, /No names will be inferred or mutated/);
assert.match(source, /updatedCount: 0/);

console.log('Contact-sync boundary regression passed: no fabricated identities, explicit provider readiness, and fail-closed mutation behavior.');

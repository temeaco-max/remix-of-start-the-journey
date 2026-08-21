import assert from 'node:assert/strict';
import fs from 'node:fs';
import { PRODUCT_SURFACE_COMPLETENESS } from '../src/services/productSurfaceCompletenessRegistry.js';

const routes = fs.readFileSync('src/routes/appSurfaceRoutes.ts', 'utf8');
const registry = fs.readFileSync('src/services/platformFeatureVisualRegistry.ts', 'utf8');
const canonical = fs.readFileSync('src/services/canonicalUrlRegistry.ts', 'utf8');

for (const surface of PRODUCT_SURFACE_COMPLETENESS) {
  assert.ok(surface.purpose, `Missing purpose: ${surface.id}`);
  assert.ok(surface.requiredRepresentations.length >= 3, `Insufficient representation contract: ${surface.id}`);
  assert.ok(surface.requiredStates.length >= 3, `Insufficient state contract: ${surface.id}`);
  for (const url of surface.canonicalUrls) {
    if (url.includes('/:') || url.includes('*')) continue;
    if (url.startsWith('/app/')) continue;
    if (url.startsWith('/admin')) continue;
    assert.ok(canonical.includes(url) || routes.includes(url) || registry.includes(`webSurface:'${url}'`) || registry.includes(`webSurface:'${url}`), `Canonical URL is not represented in route/registry contracts: ${surface.id} -> ${url}`);
  }
}

assert.ok(fs.existsSync('docs/architecture/KURUKOO_BROAD_PRODUCT_COMPLETENESS.md'), 'Broad product completeness contract is missing.');
assert.ok(fs.existsSync('docs/design/KURUKOO_BRAND_PRIMITIVES.md'), 'Brand primitive contract is missing.');
assert.ok(PRODUCT_SURFACE_COMPLETENESS.some(s => s.id === 'admin-keys-config'), 'Admin key/config completeness contract is missing.');
assert.ok(PRODUCT_SURFACE_COMPLETENESS.some(s => s.id === 'monetisation'), 'Monetisation completeness contract is missing.');
assert.ok(PRODUCT_SURFACE_COMPLETENESS.some(s => s.id === 'client-parity'), 'Client parity completeness contract is missing.');

console.log(`Product surface completeness contract passed for ${PRODUCT_SURFACE_COMPLETENESS.length} cross-domain surfaces.`);

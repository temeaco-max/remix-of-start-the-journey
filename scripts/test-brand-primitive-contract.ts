/* Copyright (c) 2026 temeaco-max. All rights reserved. Proprietary and confidential. */
import assert from 'node:assert/strict';
import { BRAND_ICON_SIZES, BRAND_PRIMITIVES, getBrandPrimitive } from '../src/services/brandPrimitiveRegistry.js';

assert.equal(getBrandPrimitive('wordmark')?.preferredSizePx, 24);
assert.equal(getBrandPrimitive('compact')?.preferredSizePx, 28);
assert.equal(getBrandPrimitive('app_icon')?.preferredSizePx, 64);
for (const size of Object.values(BRAND_ICON_SIZES)) assert.ok(size >= 16 && size <= 32, 'Semantic icon sizes must remain in the approved range.');
for (const primitive of BRAND_PRIMITIVES) assert.equal(primitive.preserveAspectRatio, true);
assert.equal(new Set(BRAND_PRIMITIVES.map(item => item.variant)).size, BRAND_PRIMITIVES.length);
console.log('Brand primitive contract passed: Kurukoo mark variants and semantic icon sizes are stable.');

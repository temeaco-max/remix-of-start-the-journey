import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { PLATFORM_FEATURE_VISUAL_CONTRACTS, assertVisualFeatureSurfaces } from '../src/services/platformFeatureVisualRegistry.js';
import { MOBILE_PLATFORM_CONTRACTS } from '../mobile/kurukoo-mobile/lib/platform-contract.js';

assertVisualFeatureSurfaces();
assert.ok(PLATFORM_FEATURE_VISUAL_CONTRACTS.length >= 40, `expected broad visual feature coverage, got ${PLATFORM_FEATURE_VISUAL_CONTRACTS.length}`);
const featureIds = new Set<string>();
for (const feature of PLATFORM_FEATURE_VISUAL_CONTRACTS) {
  assert.ok(!featureIds.has(feature.id), `duplicate visual feature id: ${feature.id}`);
  featureIds.add(feature.id);
  assert.ok(feature.label.trim(), `${feature.id}: label missing`);
  assert.ok(feature.tooltip.trim(), `${feature.id}: tooltip missing`);
  assert.ok(feature.icon.trim(), `${feature.id}: icon token missing`);
  assert.ok(feature.representations.length > 0, `${feature.id}: visual representation missing`);
  assert.ok(feature.webSurface.trim(), `${feature.id}: web surface missing`);
  assert.ok(feature.action.trim(), `${feature.id}: action missing`);
  assert.ok(feature.canonicalOwner.trim(), `${feature.id}: canonical owner missing`);
}

const mobileIds = new Set(MOBILE_PLATFORM_CONTRACTS.map(contract => contract.id));
const requiredCrossClient = ['chat','discover','ride_request','delivery','repairs','bookings','reminders','notifications','tasks','agents','points','top_up','provider_communication','webrtc_call','provider_tracking','reviews','checkout','memory','safety','explore_capabilities','channels','connect'];
for (const id of requiredCrossClient) assert.ok(mobileIds.has(id) || PLATFORM_FEATURE_VISUAL_CONTRACTS.some(feature => feature.id === id), `${id}: not represented by either cross-client contract or visual registry`);

const publicRoutes = fs.readFileSync(path.join(process.cwd(),'src/routes/publicRoutes.ts'),'utf8');
const contentRoutes = fs.readFileSync(path.join(process.cwd(),'src/routes/contentRoutes.ts'),'utf8');
for (const route of ['/help','/about','/careers','/legal','/pricing','/blog','/advertise','/partners','/channels','/explore','/network']) {
  const available = publicRoutes.includes(`router.get('${route}'`) || contentRoutes.includes(`router.get('${route}'`);
  assert.ok(available, `public feature route missing from visual feature surface: ${route}`);
}

const visualCoverage = PLATFORM_FEATURE_VISUAL_CONTRACTS.filter(feature => feature.audience.some(a => ['consumer','provider','business','agent'].includes(a)));
const discoverable = visualCoverage.filter(feature => feature.discoverable);
assert.ok(discoverable.length >= 30, `expected at least 30 discoverable user-facing features, got ${discoverable.length}`);

console.log(JSON.stringify({passed:true,totalFeatures:PLATFORM_FEATURE_VISUAL_CONTRACTS.length,userFacingFeatures:visualCoverage.length,discoverableFeatures:discoverable.length,mobileFrameworkContracts:MOBILE_PLATFORM_CONTRACTS.length},null,2));

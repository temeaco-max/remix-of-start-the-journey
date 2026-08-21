import { PLATFORM_FEATURE_VISUAL_CONTRACTS, type PlatformFeatureVisualContract } from './platformFeatureVisualRegistry.js';
import { canonicalizeUrl } from './canonicalUrlRegistry.js';

/**
 * Canonical product-facing projection of the feature registry.
 * The historical visual registry may contain compatibility URLs; this projection
 * is the only registry future UI/navigation code should consume.
 */
export const CANONICAL_PLATFORM_FEATURE_CONTRACTS: readonly PlatformFeatureVisualContract[] = PLATFORM_FEATURE_VISUAL_CONTRACTS.map(feature => ({
  ...feature,
  webSurface: canonicalizeUrl(feature.webSurface),
}));

export function getCanonicalPlatformFeatureVisualContract(id: string): PlatformFeatureVisualContract | undefined {
  return CANONICAL_PLATFORM_FEATURE_CONTRACTS.find(feature => feature.id === id);
}

export function getCanonicalDiscoverablePlatformFeatures(): PlatformFeatureVisualContract[] {
  return CANONICAL_PLATFORM_FEATURE_CONTRACTS.filter(feature => feature.discoverable);
}

export function assertCanonicalPlatformFeatureSurfaces(): void {
  const invalid = CANONICAL_PLATFORM_FEATURE_CONTRACTS.filter(feature => feature.webSurface.startsWith('/app/') || feature.webSurface.includes('?section='));
  if (invalid.length) throw new Error(`Canonical feature registry contains legacy URLs: ${invalid.map(item => `${item.id}:${item.webSurface}`).join(', ')}`);
}

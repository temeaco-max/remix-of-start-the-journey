import { PLATFORM_FEATURE_VISUAL_CONTRACTS, type PlatformFeatureVisualContract } from './platformFeatureVisualRegistry.js';
import { canonicalizeUrl } from './canonicalUrlRegistry.js';

/**
 * Canonical product-facing projection of the feature registry.
 * Historical visual contracts may contain compatibility URLs; future UI/navigation
 * code MUST consume this projection instead of PLATFORM_FEATURE_VISUAL_CONTRACTS directly.
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

// Make accidental direct use of the legacy visual registry fail during development/test.
if (process.env.NODE_ENV !== 'production') assertCanonicalPlatformFeatureSurfaces();

export type BrandMarkVariant = 'wordmark' | 'compact' | 'monogram' | 'favicon' | 'app_icon';
export type BrandContext = 'public_header' | 'public_footer' | 'auth' | 'desk_header' | 'desk_sidebar' | 'admin_header' | 'chat' | 'pwa' | 'native';

export interface BrandPrimitiveContract {
  variant: BrandMarkVariant;
  preferredSizePx: number;
  minSizePx: number;
  context: BrandContext[];
  preserveAspectRatio: true;
  accessibleName: string;
}

/**
 * Semantic brand geometry. Asset files remain the visual source; this registry
 * prevents route-specific logo/icon sizing from drifting.
 */
export const BRAND_PRIMITIVES: readonly BrandPrimitiveContract[] = [
  { variant: 'wordmark', preferredSizePx: 24, minSizePx: 20, context: ['public_header', 'public_footer', 'auth', 'desk_header', 'admin_header'], preserveAspectRatio: true, accessibleName: 'Kurukoo' },
  { variant: 'compact', preferredSizePx: 28, minSizePx: 22, context: ['desk_sidebar', 'chat', 'pwa', 'native'], preserveAspectRatio: true, accessibleName: 'Kurukoo' },
  { variant: 'monogram', preferredSizePx: 32, minSizePx: 24, context: ['chat', 'desk_sidebar', 'admin_header'], preserveAspectRatio: true, accessibleName: 'Kurukoo' },
  { variant: 'favicon', preferredSizePx: 32, minSizePx: 16, context: ['public_header', 'auth', 'pwa'], preserveAspectRatio: true, accessibleName: 'Kurukoo' },
  { variant: 'app_icon', preferredSizePx: 64, minSizePx: 48, context: ['native', 'pwa'], preserveAspectRatio: true, accessibleName: 'Kurukoo' },
] as const;

export const BRAND_ICON_SIZES = Object.freeze({ xs: 16, sm: 18, md: 20, lg: 24, xl: 28, hero: 32 });

export function getBrandPrimitive(variant: BrandMarkVariant): BrandPrimitiveContract | undefined {
  return BRAND_PRIMITIVES.find(item => item.variant === variant);
}

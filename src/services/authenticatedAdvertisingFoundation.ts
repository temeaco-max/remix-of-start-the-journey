export const AUTHENTICATED_AD_PLACEMENTS = {
  leftRail: 'authenticated_left_rail',
  contextRail: 'authenticated_context_rail',
  deskContent: 'authenticated_desk_content',
} as const;

export type AuthenticatedAdPlacement = typeof AUTHENTICATED_AD_PLACEMENTS[keyof typeof AUTHENTICATED_AD_PLACEMENTS];

export interface AuthenticatedSponsoredCardContract {
  placement: AuthenticatedAdPlacement;
  role: 'monetisation-content';
  disclosureRequired: true;
  adminManaged: true;
  approvedAssetRequired: true;
  userNavigationItem: false;
  optional: true;
  hiddenWhenUnavailable: true;
  surfaceRules: readonly string[];
}

export const AUTHENTICATED_LEFT_RAIL_SPONSORED_CARD: AuthenticatedSponsoredCardContract = {
  placement: AUTHENTICATED_AD_PLACEMENTS.leftRail,
  role: 'monetisation-content',
  disclosureRequired: true,
  adminManaged: true,
  approvedAssetRequired: true,
  userNavigationItem: false,
  optional: true,
  hiddenWhenUnavailable: true,
  surfaceRules: [
    'Render below the primary/secondary navigation and before the account footer where the shell exposes a left rail.',
    'Never occupy a navigation slot or resemble a normal Kurukoo destination.',
    'Use the campaign authority for title, image, advertiser, disclosure, destination and CTA.',
    'Use the existing /ads/:id/click tracking boundary for click-through.',
    'Do not render an unapproved or placeholder campaign asset.',
    'Remain absent when no eligible campaign exists.',
    'Do not obscure or displace core navigation on narrow screens; hide below the responsive left rail breakpoint.',
  ],
};

export const AUTHENTICATED_ADVERTISING_FOUNDATION_VERSION = '1.0.0';

import { createAdCampaign, getAdCampaigns } from './adManager.js';

/**
 * Development/visual-QA fixture for the authenticated OS left-rail placement.
 * Real deployments should use Admin-managed external campaigns instead.
 */
export async function ensureAuthenticatedLeftRailDemoAd(): Promise<void> {
  if (process.env.NODE_ENV === 'production') return;
  const campaigns = await getAdCampaigns();
  if (campaigns.some((campaign) => campaign.status === 'active' && campaign.placement === 'authenticated_left_rail')) return;

  await createAdCampaign({
    title: 'Reach customers through Kurukoo',
    desc: 'Explore disclosed, controlled business placements that appear only when an approved campaign is eligible.',
    imageUrl: '/assets/chat/sponsored-home-repair.webp',
    targetKeyword: 'business',
    creditsBudget: 50,
    campaignType: 'external',
    disclosure: 'Sponsored',
    advertiserName: 'Kurukoo demo advertiser',
    firstParty: 0,
    ctaText: 'Learn more',
    destination: '/advertise',
    placement: 'authenticated_left_rail',
    category: 'business',
    country: 'NG',
    region: '',
    frequencyCap: 3,
    priority: 30,
    targeting: JSON.stringify({ surface: 'authenticated', role: 'consumer' }),
    startAt: new Date().toISOString(),
    expiresAt: undefined,
    assetStatus: 'approved',
    approvedBy: 'development-fixture',
    impressions: 0,
    clicks: 0,
  });
}

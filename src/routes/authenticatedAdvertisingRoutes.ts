/* Copyright (c) 2026 temeaco-max. All rights reserved. Proprietary and confidential. */
import { Router, type Response } from 'express';
import { optionalAuthenticateUser, type AuthRequest } from '../middleware/auth.js';
import { getRenderableCampaigns, recordAdImpression } from '../services/adManager.js';
import { optimizeCampaignImage } from '../services/assetOptimization.js';

const router = Router();
const allowedPlacements = new Set([
  'authenticated_left_rail',
  'authenticated_context_rail',
  'authenticated_desk_content',
  'authenticated_home_promotions',
]);

async function renderPlacement(
  req: AuthRequest,
  res: Response,
  placement: string,
  options: { firstPartyOnly?: boolean; limit?: number } = {},
) {
  if (!req.user?.phone) return res.status(401).json({ error: 'Authentication required' });
  if (!allowedPlacements.has(placement)) return res.status(404).json({ error: 'Placement unavailable' });

  const limit = Math.max(1, Math.min(options.limit ?? 1, 12));
  const campaigns = await getRenderableCampaigns({
    firstParty: options.firstPartyOnly ? true : false,
    placements: [placement],
    limit,
    now: Date.now(),
  });
  const selected = options.firstPartyOnly
    ? campaigns
    : campaigns.length
      ? campaigns
      : await getRenderableCampaigns({ placements: [placement], limit, now: Date.now() });

  await Promise.all(selected.map((campaign) => recordAdImpression(Number(campaign.id)).catch(() => false)));
  res.setHeader('Cache-Control', 'private, max-age=30, stale-while-revalidate=60');
  return res.json({
    campaigns: selected.map((campaign) => {
      const optimized = optimizeCampaignImage(campaign);
      return {
        id: campaign.id,
        title: campaign.title,
        desc: campaign.desc,
        image: optimized.imageUrl,
        disclosure: campaign.disclosure || 'Sponsored',
        advertiserName: campaign.advertiserName || '',
        destination: campaign.destination || '/chat',
        clickUrl: `/ads/${encodeURIComponent(String(campaign.id))}/click`,
        ctaText: campaign.ctaText || 'Learn more',
        placement: campaign.placement || placement,
      };
    }),
  });
}

router.get('/left-rail', optionalAuthenticateUser, async (req: AuthRequest, res, next) => {
  try { await renderPlacement(req, res, 'authenticated_left_rail'); } catch (error) { next(error); }
});

router.get('/context-rail', optionalAuthenticateUser, async (req: AuthRequest, res, next) => {
  try { await renderPlacement(req, res, 'authenticated_context_rail'); } catch (error) { next(error); }
});

router.get('/desk-content', optionalAuthenticateUser, async (req: AuthRequest, res, next) => {
  try { await renderPlacement(req, res, 'authenticated_desk_content'); } catch (error) { next(error); }
});

router.get('/home-promotions', optionalAuthenticateUser, async (req: AuthRequest, res, next) => {
  try {
    await renderPlacement(req, res, 'authenticated_home_promotions', { firstPartyOnly: true, limit: 12 });
  } catch (error) {
    next(error);
  }
});

export default router;

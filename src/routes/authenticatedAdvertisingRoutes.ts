/* Copyright (c) 2026 temeaco-max. All rights reserved. Proprietary and confidential. */
import { Router } from 'express';
import { optionalAuthenticateUser, type AuthRequest } from '../middleware/auth.js';
import { getRenderableCampaigns } from '../services/adManager.js';
import { optimizeCampaignImage } from '../services/assetOptimization.js';
import { recordAdImpression } from '../services/adManager.js';

const router = Router();

router.get('/left-rail', optionalAuthenticateUser, async (req: AuthRequest, res, next) => {
  try {
    if (!req.user?.phone) return res.status(401).json({ error: 'Authentication required' });
    const campaigns = await getRenderableCampaigns({
      firstParty: false,
      placements: ['authenticated_left_rail'],
      limit: 1,
      now: Date.now(),
    });
    const firstParty = campaigns.length
      ? campaigns
      : await getRenderableCampaigns({ placements: ['authenticated_left_rail'], limit: 1, now: Date.now() });
    await Promise.all(firstParty.map((campaign) => recordAdImpression(Number(campaign.id)).catch(() => false)));
    res.setHeader('Cache-Control', 'private, max-age=30, stale-while-revalidate=60');
    res.json({
      campaigns: firstParty.map((campaign) => {
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
          placement: campaign.placement || 'authenticated_left_rail',
        };
      }),
    });
  } catch (error) {
    next(error);
  }
});

export default router;

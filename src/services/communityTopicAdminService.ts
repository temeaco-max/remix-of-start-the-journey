/* Copyright (c) 2026 temeaco-max. All rights reserved. Proprietary and confidential. */
import { getDb, saveDb } from '../database.js';
import { ensureCommunityTopicSupport } from './communityTopicService.js';

export async function setCommunityCategoryAds(categorySlug: string, enabled: boolean) {
  const db = await ensureCommunityTopicSupport();
  db.run('UPDATE topic_community_categories SET ads_enabled=?, updated_at=CURRENT_TIMESTAMP WHERE slug=?', [enabled ? 1 : 0, categorySlug]);
  db.run('UPDATE topic_community_ad_rates SET enabled=? WHERE category_slug=?', [enabled ? 1 : 0, categorySlug]);
  saveDb();
  return { categorySlug, enabled };
}

export async function setCommunitySubcategoryAds(subcategorySlug: string, enabled: boolean) {
  const db = await ensureCommunityTopicSupport();
  db.run('UPDATE topic_community_subcategories SET ads_enabled=?, updated_at=CURRENT_TIMESTAMP WHERE slug=?', [enabled ? 1 : 0, subcategorySlug]);
  db.run('UPDATE topic_community_ad_rates SET enabled=? WHERE subcategory_slug=?', [enabled ? 1 : 0, subcategorySlug]);
  saveDb();
  return { subcategorySlug, enabled };
}

export async function setCommunityAdRate(categorySlug: string, subcategorySlug: string | null, slot: string, points: number, enabled: boolean) {
  const db = await ensureCommunityTopicSupport();
  db.run('UPDATE topic_community_ad_rates SET points=?, enabled=? WHERE category_slug=? AND subcategory_slug IS ? AND slot=?', [Math.max(0, Math.floor(points)), enabled ? 1 : 0, categorySlug, subcategorySlug || null, slot]);
  saveDb();
  return { categorySlug, subcategorySlug, slot, points: Math.max(0, Math.floor(points)), enabled };
}

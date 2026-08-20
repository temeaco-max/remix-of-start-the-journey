import { getDb } from '../database.js';
import { getRenderableCampaigns } from './adManager.js';
import { matchCatalogueInventory, type CatalogueInventoryItem } from './catalogueInventoryMatcher.js';
import { getAgentNetworkSummary } from './agentNetworkCommerce.js';
import type { DiscoverItem, DiscoverSection } from './discoverExperience.js';

function productToDiscoverItem(item: CatalogueInventoryItem, section: DiscoverSection, index: number): DiscoverItem {
  const providerId = String(item.providerPhone);
  const id = `product:${providerId}:${encodeURIComponent(item.product).slice(0, 100)}`;
  const price = item.price !== undefined ? ` · ${item.currency || ''} ${item.price}`.trim() : '';
  return {
    id,
    type: 'discovery',
    section,
    title: item.product,
    detail: `${item.providerName}${price}${item.location ? ` · ${item.location}` : ''}`,
    category: item.skill,
    entityType: 'product',
    source: item.source,
    verified: item.verified,
    available: item.available,
    actions: ['open_chat', 'watch', 'save', 'act'],
    chatAction: {
      type: 'open_discovery_entity',
      id,
      prompt: `I want to know more about ${item.product} from ${item.providerName}. Show availability, price and how I can buy or book it.`,
    },
    score: 75 - index,
    sponsored: false,
  };
}

async function categoryPromotions(category: string | undefined, section: DiscoverSection): Promise<DiscoverItem[]> {
  const campaigns = await getRenderableCampaigns({ placements: ['public_discovery', 'discover_category'], limit: 12, now: Date.now() });
  const normalized = String(category || '').trim().toLowerCase();
  return campaigns
    .filter(campaign => !normalized || !String(campaign.category || '').trim() || String(campaign.category).toLowerCase() === normalized)
    .slice(0, 5)
    .map((campaign) => ({
      id: `promotion:${campaign.id}`,
      type: 'promotion',
      section,
      title: String(campaign.title || 'Sponsored offer'),
      detail: `${String(campaign.desc || '')}${campaign.advertiserName ? ` · ${campaign.advertiserName}` : ''}`,
      category: campaign.category ? String(campaign.category) : undefined,
      entityType: 'business',
      source: 'Kurukoo Advertising',
      freshnessAt: campaign.startAt || undefined,
      expiresAt: campaign.expiresAt || undefined,
      actions: ['open_chat', 'save', 'act'],
      chatAction: { type: 'open_promotion', id: String(campaign.id), prompt: `Tell me about the sponsored offer “${String(campaign.title || '')}” and what I can do with it.` },
      score: 110 + (Number(campaign.priority) || 0),
      sponsored: true,
      disclosure: String(campaign.disclosure || 'Sponsored'),
      destination: campaign.destination ? String(campaign.destination) : undefined,
      ctaText: campaign.ctaText ? String(campaign.ctaText) : 'Learn more',
    } satisfies DiscoverItem));
}

export async function getDiscoverCommercialComposition(options: {
  query?: string;
  skill?: string;
  location?: string;
  category?: string;
  limit?: number;
} = {}): Promise<{ products: DiscoverItem[]; promotions: DiscoverItem[]; agentNetwork: { activePosAgents: number; totalAgents: number; pendingAgents: number }; providersWithProducts: number }> {
  const limit = Math.min(20, Math.max(1, Number(options.limit || 8)));
  const products = options.query
    ? await matchCatalogueInventory({ query: options.query, skill: options.skill, location: options.location, max: limit })
    : [];
  const productsByProvider = new Set(products.map(product => product.providerPhone));
  const promotions = await categoryPromotions(options.category, 'today');
  return {
    products: products.map((item, index) => productToDiscoverItem(item, 'for_you', index)),
    promotions,
    agentNetwork: await getAgentNetworkSummary(),
    providersWithProducts: productsByProvider.size,
  };
}

export async function getDiscoverCategoryInventory(category: string, location?: string, limit = 12): Promise<DiscoverItem[]> {
  const db = await getDb();
  const skill = String(category || '').trim().toLowerCase();
  const terms = skill.replace(/[_-]+/g, ' ');
  const result = await matchCatalogueInventory({ query: terms, skill, location, max: Math.min(30, Math.max(1, limit)) });
  return result.map((item, index) => productToDiscoverItem(item, 'nearby', index));
}

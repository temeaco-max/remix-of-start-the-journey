import assert from 'node:assert/strict';
import { createAdCampaign, getAdCampaigns, matchAdCampaigns, seedDemoAdCampaigns } from '../src/services/adManager.js';

await seedDemoAdCampaigns();
const seeded = await getAdCampaigns();
assert.ok(seeded.length >= 3, 'first-party demo campaigns should be seeded');
assert.ok(seeded.every(campaign => campaign.campaignType === 'demo_internal'), 'campaigns must be marked internal demo campaigns');
assert.ok(seeded.every(campaign => String(campaign.disclosure || '').toLowerCase().includes('demo')), 'demo campaigns require explicit disclosure');

const title = `[Kurukoo test] advertising ${Date.now()}`;
await createAdCampaign({ title, desc: 'Controlled test campaign', imageUrl: '', targetKeyword: 'convergence', creditsBudget: 12 });
const created = (await getAdCampaigns()).find(campaign => campaign.title === title);
assert.ok(created, 'admin campaign creation should persist a campaign');
assert.equal(created?.campaignType, 'demo_internal');
assert.equal(created?.placement, 'public_discovery');

const matched = await matchAdCampaigns('convergence discovery');
assert.ok(matched.some(campaign => campaign.title === title), 'public ad matching should use the ad manager authority');
console.log(`Advertising regression passed: ${seeded.length} demo campaigns and one managed campaign verified.`);

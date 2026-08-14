import assert from 'node:assert/strict';
import { createAdCampaign, getAdCampaigns, matchAdCampaigns, seedDemoAdCampaigns } from '../src/services/adManager.js';

await seedDemoAdCampaigns();
const seeded = await getAdCampaigns();
assert.ok(seeded.length >= 3, 'first-party demo campaigns should be seeded');
const firstParty = seeded.filter(campaign => Number(campaign.firstParty) === 1);
assert.ok(firstParty.length >= 8, 'first-party Kurukoo campaign set should be seeded');
assert.ok(firstParty.every(campaign => campaign.campaignType === 'first_party'), 'first-party campaigns must use the canonical first_party type');
assert.ok(firstParty.every(campaign => campaign.advertiserName === 'Kurukoo'), 'first-party campaigns require an explicit advertiser identity');
assert.ok(firstParty.every(campaign => String(campaign.disclosure || '').toLowerCase().includes('kurukoo')), 'first-party campaigns require explicit disclosure');
assert.ok(firstParty.every(campaign => campaign.ctaText && campaign.destination), 'first-party campaigns require CTA and destination');

const title = `[Kurukoo test] advertising ${Date.now()}`;
await createAdCampaign({ title, desc: 'Controlled test campaign', imageUrl: '', targetKeyword: 'convergence', creditsBudget: 12 });
const created = (await getAdCampaigns()).find(campaign => campaign.title === title);
assert.ok(created, 'admin campaign creation should persist a campaign');
assert.equal(created?.campaignType, 'external');
assert.equal(created?.firstParty, 0);
assert.equal(created?.placement, 'public_discovery');

const matched = await matchAdCampaigns('convergence discovery');
assert.ok(matched.some(campaign => campaign.title === title), 'public ad matching should use the ad manager authority');
console.log(`Advertising regression passed: ${firstParty.length} first-party campaigns and one managed external campaign verified.`);

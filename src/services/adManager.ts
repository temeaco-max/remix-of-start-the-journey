import { getDb, saveDb } from '../database.js';

export interface AdCampaign {
    id: number;
    title: string;
    desc: string;
    imageUrl: string;
    targetKeyword: string;
    creditsBudget: number;
    creditsSpent: number;
    status: string;
    campaignType?: string;
    disclosure?: string;
    advertiserName?: string;
    firstParty?: number;
    ctaText?: string;
    destination?: string;
    priority?: number;
    targeting?: string;
    placement?: string;
    category?: string;
    country?: string;
    region?: string;
    startAt?: string;
    expiresAt?: string;
    frequencyCap?: number;
    impressions?: number;
    clicks?: number;
    createdAt: string;
    updatedAt: string;
}

function ensureAdSchema(db: any): void {
    const columns = new Set<string>();
    for (const row of db.exec('PRAGMA table_info(ad_campaigns)')[0]?.values || []) columns.add(String(row[1]));
    const additions: Array<[string, string]> = [
        ['campaign_type', "TEXT DEFAULT 'external'"],
        ['disclosure', "TEXT DEFAULT 'Sponsored'"],
        ['advertiser_name', "TEXT DEFAULT ''"],
        ['first_party', 'INTEGER DEFAULT 0'],
        ['cta_text', "TEXT DEFAULT 'Learn more'"],
        ['destination', "TEXT DEFAULT '/chat'"],
        ['priority', 'INTEGER DEFAULT 0'],
        ['targeting', "TEXT DEFAULT '{}'"],
        ['placement', "TEXT DEFAULT 'public_discovery'"],
        ['category', "TEXT DEFAULT 'community'"],
        ['country', "TEXT DEFAULT 'NG'"],
        ['region', "TEXT DEFAULT ''"],
        ['start_at', 'TEXT'],
        ['expires_at', 'TEXT'],
        ['frequency_cap', 'INTEGER DEFAULT 3'],
        ['impressions', 'INTEGER DEFAULT 0'],
        ['clicks', 'INTEGER DEFAULT 0'],
    ];
    for (const [name, definition] of additions) if (!columns.has(name)) db.run(`ALTER TABLE ad_campaigns ADD COLUMN ${name} ${definition}`);
    db.run(`UPDATE ad_campaigns SET campaign_type=COALESCE(campaign_type, 'external'), disclosure=COALESCE(disclosure, 'Sponsored'), advertiser_name=COALESCE(advertiser_name, ''), first_party=COALESCE(first_party, 0), cta_text=COALESCE(cta_text, 'Learn more'), destination=COALESCE(destination, '/chat'), priority=COALESCE(priority, 0), targeting=COALESCE(targeting, '{}'), placement=COALESCE(placement, 'public_discovery'), category=COALESCE(category, 'community'), country=COALESCE(country, 'NG'), region=COALESCE(region, ''), frequency_cap=COALESCE(frequency_cap, 3), impressions=COALESCE(impressions, 0), clicks=COALESCE(clicks, 0)`);
}


export async function getAdCampaigns(): Promise<AdCampaign[]> {
    const db = await getDb();
    ensureAdSchema(db);
    const rows = db.exec(`SELECT * FROM ad_campaigns`);
    if (rows.length === 0) return [];
    
    const campaigns: AdCampaign[] = [];
    const columns = rows[0].columns;
    for (const values of rows[0].values) {
        const campaign: any = {};
        columns.forEach((col: string, idx: number) => {
            const camelKey = col.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
            campaign[camelKey] = values[idx];
        });
        campaigns.push(campaign as AdCampaign);
    }
    return campaigns;
}

export async function createAdCampaign(campaign: Omit<AdCampaign, 'id' | 'creditsSpent' | 'status' | 'createdAt' | 'updatedAt'>): Promise<any> {
    const db = await getDb();
    ensureAdSchema(db);
    db.run(
        `INSERT INTO ad_campaigns (title, desc, image_url, target_keyword, credits_budget, campaign_type, disclosure, advertiser_name, first_party, cta_text, destination, placement, category, country, region, start_at, expires_at, frequency_cap, priority, targeting) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [campaign.title, campaign.desc, campaign.imageUrl, campaign.targetKeyword, campaign.creditsBudget, campaign.campaignType || 'external', campaign.disclosure || 'Sponsored', campaign.advertiserName || '', campaign.firstParty ? 1 : 0, campaign.ctaText || 'Learn more', campaign.destination || '/chat', campaign.placement || 'public_discovery', campaign.category || 'community', campaign.country || 'NG', campaign.region || '', campaign.startAt || null, campaign.expiresAt || null, campaign.frequencyCap || 3, campaign.priority || 0, campaign.targeting || '{}']
    );
    saveDb();
    return { success: true, message: 'Ad campaign created successfully' };
}

export async function spendAdCampaign(id: number, cost: number = 2): Promise<boolean> {
    const db = await getDb();
    ensureAdSchema(db);
    const campaignRows = db.exec(`SELECT credits_budget, credits_spent FROM ad_campaigns WHERE id = ?`, [id]);
    if (campaignRows.length === 0) return false;

    const [budget, spent] = campaignRows[0].values[0];
    const newSpent = spent + cost;

    if (newSpent >= budget) {
        db.run(`UPDATE ad_campaigns SET credits_spent = ?, status = 'completed' WHERE id = ?`, [budget, id]);
    } else {
        db.run(`UPDATE ad_campaigns SET credits_spent = ? WHERE id = ?`, [newSpent, id]);
    }
    saveDb();
    return true;
}

export async function matchAdCampaigns(query: string): Promise<AdCampaign[]> {
    const db = await getDb();
    ensureAdSchema(db);
    const allCampaigns = await getAdCampaigns();
    const cleanQuery = query.toLowerCase();

    // Return active campaigns whose keywords are found in the query
    const now = Date.now();
    const matched = allCampaigns.filter(c => {
        if (c.status !== 'active') return false;
        if (c.startAt && Date.parse(c.startAt) > now) return false;
        if (c.expiresAt && Date.parse(c.expiresAt) <= now) return false;
        const kw = c.targetKeyword.toLowerCase().trim();
        return kw && cleanQuery.includes(kw);
    });

    return matched;
}

export async function seedDemoAdCampaigns(): Promise<void> {
    const db = await getDb();
    ensureAdSchema(db);
    const campaigns = [
        ['Ask Kurukoo', 'Tell Kurukoo what you need and keep everything in one conversation.', 'chat', 'Open Chat', '/chat', 'public_home', 'community', 100],
        ['Find useful people and services nearby', 'Explore eligible providers, agents, events and activity around you.', 'nearby', 'Explore Nearby', '/discover', 'public_discovery', 'community', 90],
        ['Ask the community', 'Share or explore useful local questions, reports and experiences.', 'topics', 'Explore Topics', '/topics', 'public_content', 'community', 80],
        ['Know something useful? Contribute it.', 'Share evidence and context without presenting it as verified fulfilment.', 'contributor', 'Become a Contributor', '/chat?prompt=I%20want%20to%20contribute%20useful%20local%20information', 'public_content', 'community', 70],
        ['Let Kurukoo keep work moving', 'Create a bounded agent goal and review its progress, tools and limits.', 'agent', 'Explore Agents', '/chat?prompt=Show%20me%20my%20agents', 'public_workspace', 'agents', 60],
        ['Bring someone to Kurukoo', 'Invite someone to start a conversation-first Kurukoo relationship.', 'referral', 'Invite a Friend', '/referral-qr/', 'public_workspace', 'community', 50],
        ['Reach customers through Kurukoo', 'Explore disclosed, controlled business placements using the same campaign authority.', 'business', 'Explore Business', '/advertise', 'public_business', 'business', 40],
        ['Use Kurukoo where you already are', 'Review the connected access channels and their current readiness.', 'channels', 'Explore Channels', '/channels', 'public_channels', 'channels', 30],
    ];
    for (const [title, desc, keyword, cta, destination, placement, category, priority] of campaigns) {
        const exists = db.exec('SELECT id FROM ad_campaigns WHERE title = ? AND first_party = 1 LIMIT 1', [title]);
        if (exists.length && exists[0].values.length) continue;
        db.run(`INSERT INTO ad_campaigns (title, desc, image_url, target_keyword, credits_budget, status, campaign_type, disclosure, advertiser_name, first_party, cta_text, destination, placement, category, country, region, frequency_cap, priority, targeting) VALUES (?, ?, '', ?, 0, 'active', 'first_party', 'Kurukoo promotion', 'Kurukoo', 1, ?, ?, ?, ?, ?, '', 5, ?, ?)`, [title, desc, keyword, cta, destination, placement, category, priority, JSON.stringify({ scope: 'public', safetyExcluded: true })]);
    }
    saveDb();
    console.log('First-party Kurukoo campaigns ensured');
}

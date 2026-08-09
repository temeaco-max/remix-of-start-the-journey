import { getDb } from '../database.js';

export interface SourcedProductCard {
    title: string;
    price: string;
    source: string;
}

export async function sourceProduct(query: string, country: string): Promise<SourcedProductCard[]> {
    const isNg = true;
    const normalizedCountry = country.toLowerCase();
    const cleanQuery = query.toLowerCase().trim();

    const db = await getDb();
    const cards: SourcedProductCard[] = [];

    // Query local providers who match this skill or keyword in the given country
    try {
        const stmt = db.prepare(`
            SELECT m.name, m.location, s.skill, s.hourly_rate, s.rating 
            FROM memory_profiles m
            JOIN skills s ON m.phone = s.phone
            WHERE m.country = ? AND (s.skill LIKE ? OR s.skill = ?)
            LIMIT 3
        `);
        stmt.bind([normalizedCountry, `%${cleanQuery}%`, cleanQuery]);

        while (stmt.step()) {
            const row = stmt.getAsObject();
            const priceStr = `₦${(row.hourly_rate || 2500).toLocaleString()}/hr`;

            cards.push({
                title: `${row.name} (${row.skill})`,
                price: priceStr,
                source: `${row.location} (Local Verified Provider ★${row.rating || '4.8'})`
            });
        }
        stmt.free();
    } catch (err) {
        console.error('Error querying local providers for sourcing:', err);
    }

    // Fallback/affiliate integrations if < 3
    if (cards.length < 3) {
        const affiliateStubs: Record<string, { title: string, price: string, source: string }[]> = {
            ng: [
                { title: `${query} (Standard Dispatch Product)`, price: '₦12,500', source: 'Jumia NG (Affiliate Partner)' },
                { title: `${query} (Premium Sourced Express)`, price: '₦15,000', source: 'Konga (Affiliate Partner)' }
            ],
            
            
        };

        const list = affiliateStubs[normalizedCountry] || affiliateStubs['ng'];
        for (const item of list) {
            if (cards.length >= 3) break;
            cards.push({
                title: item.title,
                price: item.price,
                source: item.source
            });
        }
    }

    // Ensure we don't return more than 3
    return cards.slice(0, 3);
}

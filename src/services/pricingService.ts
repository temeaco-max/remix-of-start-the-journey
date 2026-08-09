import { getDb, saveDb } from '../database.js';

export async function getPricing(country: string) {
    const db = await getDb();
    const stmt = db.prepare(`SELECT plan, country, monthly_price_minor, currency, credits_per_month, features, active FROM pricing WHERE country = ? AND active = 1`);
    stmt.bind([country]);
    const plans = [];
    while (stmt.step()) {
        const row = stmt.getAsObject();
        try {
            row.features = JSON.parse(row.features as string);
        } catch {
            row.features = [];
        }
        plans.push(row);
    }
    stmt.free();
    return plans;
}

export async function getAllPricing() {
    const db = await getDb();
    const stmt = db.prepare(`SELECT plan, country, monthly_price_minor, currency, credits_per_month, features, active FROM pricing`);
    const plans = [];
    while (stmt.step()) {
        const row = stmt.getAsObject();
        try {
            row.features = JSON.parse(row.features as string);
        } catch {
            row.features = [];
        }
        plans.push(row);
    }
    stmt.free();
    return plans;
}

export async function getPlan(country: string, plan: string) {
    const db = await getDb();
    const stmt = db.prepare(`SELECT plan, country, monthly_price_minor, currency, credits_per_month, features, active FROM pricing WHERE country = ? AND plan = ?`);
    stmt.bind([country, plan]);
    let result = null;
    if (stmt.step()) {
        result = stmt.getAsObject();
        try {
            result.features = JSON.parse(result.features as string);
        } catch {
            result.features = [];
        }
    }
    stmt.free();
    return result;
}

export async function updatePlan(country: string, plan: string, data: { monthly_price_minor?: number; currency?: string; credits_per_month?: number; features?: any; active?: number }) {
    const db = await getDb();
    const existing = await getPlan(country, plan);
    if (!existing) return false;

    const price = data.monthly_price_minor !== undefined ? data.monthly_price_minor : existing.monthly_price_minor;
    const currency = data.currency !== undefined ? data.currency : existing.currency;
    const credits = data.credits_per_month !== undefined ? data.credits_per_month : existing.credits_per_month;
    const features = data.features !== undefined ? (typeof data.features === 'string' ? data.features : JSON.stringify(data.features)) : JSON.stringify(existing.features);
    const active = data.active !== undefined ? data.active : existing.active;

    db.run(`UPDATE pricing SET monthly_price_minor = ?, currency = ?, credits_per_month = ?, features = ?, active = ? WHERE country = ? AND plan = ?`,
        [price, currency, credits, features, active, country, plan]);
    saveDb();
    return true;
}

export async function createPlan(data: { plan: string; country: string; monthly_price_minor: number; currency: string; credits_per_month: number; features: any; active?: number }) {
    const db = await getDb();
    const featuresStr = typeof data.features === 'string' ? data.features : JSON.stringify(data.features);
    const active = data.active !== undefined ? data.active : 1;

    db.run(`INSERT OR REPLACE INTO pricing (plan, country, monthly_price_minor, currency, credits_per_month, features, active) VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [data.plan, data.country, data.monthly_price_minor, data.currency, data.credits_per_month, featuresStr, active]);
    saveDb();
    return true;
}

export async function deletePlan(country: string, plan: string) {
    const db = await getDb();
    db.run(`UPDATE pricing SET active = 0 WHERE country = ? AND plan = ?`, [country, plan]);
    saveDb();
    return true;
}

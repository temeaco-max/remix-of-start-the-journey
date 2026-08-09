import { getDb, saveDb } from '../database.js';

/**
 * Points Engine (Kurukoo Loyalty Token System) — Blueprint §7
 *
 * 1 Point = ₦1 equivalent value (NG) / £0.002 (UK).
 * Closed-loop, unidirectional loyalty tokens — CBN compliant (POINTS_COMPLIANCE.md).
 *
 * Points are EARNED via daily engagement, referrals, and job completion.
 * Points are SPENT only on Kurukoo's own services: Boost Listing, Kuru Pulse
 * "Go Live", extra rides, liveCast signals, and subscription discounts.
 *
 * Hard rules (Blueprint §7):
 *  - No airtime redemption (airtime gifting is a platform marketing expense).
 *  - No P2P transfer between users.
 *  - No fiat symbol in the UI ("500 Points", never "₦500").
 *  - Provider lead fees are paid via direct Points deduction.
 *  - Provider grace policy: up to 3 leads on Points before the provider is paused.
 */

// ─── Blueprint §7 — fixed awards & costs ───────────────────────────────────
export const POINTS_AWARDS = {
    DAILY_ENGAGEMENT: 1,        // WhatsApp/PWA/USSD daily engagement
    REFERRAL: 200,             // per verified referred subscriber
    JOB_COMPLETION_MIN: 1,     // provider job completion (lower bound)
    JOB_COMPLETION_MAX: 5,     // provider job completion (upper bound)
    STAR_BONUS: 1,            // 5-star rating received
} as const;

export const POINTS_COSTS = {
    RIDE_REQUEST: 1,           // basic ride request
    EXTRA_RIDE: 2,            // each ride beyond free allowance
    PULSE_GO_LIVE_BLOCK: 5,   // per 30-min "Go Live" block
    BOOST_LISTING: 10,        // 24-hour listing boost
    LIVECAST_SIGNAL: 1,       // each liveCast signal
} as const;

// Provider lead charges by provider type (Blueprint §7).
export const LEAD_CHARGES: Record<string, number> = {
    okada: 50, keke: 50, car: 50, taxi: 50,
    bicycle_delivery: 30,
    hawker: 20, street_food: 20,
    wheelbarrow: 20, truck_pusher: 20,
    professional: 50,
};

export async function addPoints(phone: string, amount: number, description: string): Promise<void> {
    const pointsEconomyEnabled = process.env.CREDIT_ECONOMY_ENABLED !== 'false';
    if (!pointsEconomyEnabled) {
        console.log(`[POINTS CONTINGENCY] Skipping addPoints for ${phone} - Points Economy is disabled.`);
        return;
    }

    const db = await getDb();
    db.run('BEGIN TRANSACTION');
    try {
        db.run(`UPDATE memory_profiles SET points_balance = COALESCE(points_balance, 0) + ?, wallet_balance_minor = COALESCE(wallet_balance_minor, 0) + ? WHERE phone = ?`, [amount, amount, phone]);
        db.run(`INSERT INTO credit_transactions (phone, amount, type, description) VALUES (?, ?, 'credit', ?)`, [phone, amount, description]);
        db.run('COMMIT');
        saveDb();
    } catch (err) {
        db.run('ROLLBACK');
        console.error('Failed to add points:', err);
    }
}

export async function deductPoints(phone: string, amount: number, description: string, allowGrace = false): Promise<{ success: boolean; isGrace?: boolean; remainingPoints?: number }> {
    const pointsEconomyEnabled = process.env.CREDIT_ECONOMY_ENABLED !== 'false';
    if (!pointsEconomyEnabled) {
        console.log(`[POINTS CONTINGENCY] Skipping deductPoints for ${phone} - Points Economy is disabled.`);
        return { success: true };
    }

    const db = await getDb();
    db.run('BEGIN TRANSACTION');
    try {
        const stmt = db.prepare(`SELECT COALESCE(points_balance, 0) as points, COALESCE(grace_leads, 0) as grace_leads FROM memory_profiles WHERE phone = ?`);
        stmt.bind([phone]);
        if (!stmt.step()) {
            stmt.free();
            db.run('ROLLBACK');
            return { success: false };
        }
        const row = stmt.getAsObject();
        const currentPoints = (row.points ?? 0) as number;
        const graceLeads = (row.grace_leads ?? 0) as number;
        stmt.free();

        if (currentPoints < amount) {
            // Provider grace policy (Blueprint §7): allow up to 3 leads on Points, then pause.
            if (!allowGrace || graceLeads >= 3) {
                db.run('ROLLBACK');
                return { success: false, remainingPoints: currentPoints };
            }
            db.run(`UPDATE memory_profiles SET points_balance = COALESCE(points_balance, 0) - ?, wallet_balance_minor = COALESCE(wallet_balance_minor, 0) - ?, grace_leads = grace_leads + 1 WHERE phone = ?`, [amount, amount, phone]);
            db.run(`INSERT INTO credit_transactions (phone, amount, type, description) VALUES (?, ?, 'debit_grace', ?)`, [phone, -amount, description]);
            db.run('COMMIT');
            saveDb();
            return { success: true, isGrace: true, remainingPoints: currentPoints - amount };
        }

        db.run(`UPDATE memory_profiles SET points_balance = COALESCE(points_balance, 0) - ?, wallet_balance_minor = COALESCE(wallet_balance_minor, 0) - ? WHERE phone = ?`, [amount, amount, phone]);
        db.run(`INSERT INTO credit_transactions (phone, amount, type, description) VALUES (?, ?, 'debit', ?)`, [phone, -amount, description]);
        db.run('COMMIT');
        saveDb();
        return { success: true, remainingPoints: currentPoints - amount };
    } catch (err) {
        db.run('ROLLBACK');
        console.error('Failed to deduct points:', err);
        return { success: false };
    }
}

export async function getPointsBalance(phone: string): Promise<number> {
    const db = await getDb();
    const stmt = db.prepare(`SELECT COALESCE(points_balance, 0) as points FROM memory_profiles WHERE phone = ?`);
    stmt.bind([phone]);
    let points = 0;
    if (stmt.step()) {
        points = stmt.getAsObject().points as number;
    }
    stmt.free();
    return points;
}

/** Recent Points transaction history for a profile (newest first). */
export async function getPointsHistory(phone: string, limit = 50): Promise<unknown[]> {
    const db = await getDb();
    const stmt = db.prepare(`SELECT * FROM credit_transactions WHERE phone = ? ORDER BY id DESC LIMIT ?`);
    stmt.bind([phone, limit]);
    const rows: unknown[] = [];
    while (stmt.step()) {
        rows.push(stmt.getAsObject());
    }
    stmt.free();
    return rows;
}

/**
 * Spend Points on a Kurukoo feature (Boost Listing, Go Live, extra ride, liveCast).
 * Feature spends never use the provider grace policy — insufficient balance simply fails.
 */
export async function spendPoints(phone: string, amount: number, feature: string): Promise<{ success: boolean; remainingPoints?: number }> {
    const res = await deductPoints(phone, amount, `Spend: ${feature}`, false);
    return { success: res.success, remainingPoints: res.remainingPoints };
}

/** Convenience awarders matching the Blueprint §7 table. */
export async function awardDailyEngagement(phone: string): Promise<void> {
    await addPoints(phone, POINTS_AWARDS.DAILY_ENGAGEMENT, 'Daily engagement bonus');
}
export async function awardReferral(phone: string): Promise<void> {
    await addPoints(phone, POINTS_AWARDS.REFERRAL, 'Referral reward (new subscriber)');
}
export async function awardJobCompletion(phone: string, rating = 5): Promise<void> {
    // +1 to +5 scaled by the star rating received (Blueprint §7).
    const clamped = Math.max(POINTS_AWARDS.JOB_COMPLETION_MIN, Math.min(POINTS_AWARDS.JOB_COMPLETION_MAX, Math.round(rating)));
    await addPoints(phone, clamped, `Job completion bonus (${clamped})`);
}
export async function awardStarBonus(phone: string): Promise<void> {
    await addPoints(phone, POINTS_AWARDS.STAR_BONUS, '5-star rating bonus');
}

/** Top Points holders — used for the provider leaderboard (Blueprint §9/§36). */
export async function getPointsLeaderboard(limit = 10): Promise<unknown[]> {
    const db = await getDb();
    const stmt = db.prepare(`SELECT phone, name, COALESCE(points_balance, 0) as points, subscription_tier FROM memory_profiles ORDER BY points DESC LIMIT ?`);
    stmt.bind([limit]);
    const rows: unknown[] = [];
    while (stmt.step()) {
        rows.push(stmt.getAsObject());
    }
    stmt.free();
    return rows;
}

// Backward-compatible aliases (legacy credit naming).
export const addCredits = addPoints;
export const deductCredits = async (phone: string, amount: number, description: string): Promise<boolean> => {
    const res = await deductPoints(phone, amount, description);
    return res.success;
};

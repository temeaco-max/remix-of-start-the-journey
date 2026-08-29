/* Copyright (c) 2026 temeaco-max. All rights reserved. Proprietary and confidential. */
import { getDb } from '../database.js';
import { getDailyPersonalizedQuestion } from './progressiveOnboarding.js';

export async function triggerDailyEngagementCheck(phone: string): Promise<{ q: string, options: string[] } | null> {
    const db = await getDb();
    const stmt = db.prepare(`SELECT preferences FROM memory_profiles WHERE phone = ?`);
    stmt.bind([phone]);
    let prefs: any = {};
    if (stmt.step()) {
        const obj = stmt.getAsObject();
        prefs = obj.preferences ? JSON.parse(obj.preferences) : {};
    }
    stmt.free();

    if (prefs.onboarding_complete !== true) {
        return null; // Don't trigger daily questions if onboarding isn't done
    }

    const currentDay = prefs.engagement_day || 0;
    const nextDay = currentDay + 1;
    if (nextDay > 7) {
        return null; // Completed the 7-day personalized sequence
    }

    const questionObj = getDailyPersonalizedQuestion(nextDay);
    prefs.engagement_day = nextDay;
    prefs.last_engagement_prompt_at = new Date().toISOString();

    db.run(`UPDATE memory_profiles SET preferences = ? WHERE phone = ?`, [JSON.stringify(prefs), phone]);

    // Record sent question
    db.run(`INSERT INTO sent_questions (phone, question) VALUES (?, ?)`, [phone, questionObj.q]);

    return questionObj;
}

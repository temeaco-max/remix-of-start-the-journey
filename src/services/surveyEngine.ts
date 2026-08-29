/* Copyright (c) 2026 temeaco-max. All rights reserved. Proprietary and confidential. */
import { getDb, saveDb } from '../database.js';
import { addPoints as addCredits } from './pointsEngine.js';

export interface SurveyPrompt {
    question: string;
    options: string[];
    image?: string;
}

export function getSurveyPrompt(topic: string): SurveyPrompt {
    return {
        question: `Would you ever buy ${topic} if we negotiated a bulk discount near you?`,
        options: ['Yes, definitely', 'No']
    };
}

// 1. Hourly survey scheduler
let surveyInterval: NodeJS.Timeout | null = null;

export function startSurveyScheduler(): void {
    if (surveyInterval) return;

    console.log('Survey Engine Hourly Scheduler has started successfully.');

    // Run every hour to dispatch surveys to active profiles
    surveyInterval = setInterval(async () => {
        try {
            await dispatchSurveySweep();
        } catch (err) {
            console.error('Error running hourly survey sweep:', err);
        }
    }, 60 * 60 * 1000); // 1 Hour
}

export async function dispatchSurveySweep(): Promise<void> {
    const db = await getDb();
    
    // Select active users who haven't completed onboarding and received a survey in the last 24h
    const stmt = db.prepare(`
        SELECT phone, preferences FROM memory_profiles 
        WHERE is_available = 1
        LIMIT 5
    `);

    const users: { phone: string, preferences: any }[] = [];
    while (stmt.step()) {
        const row = stmt.getAsObject();
        users.push({
            phone: row.phone,
            preferences: row.preferences ? JSON.parse(row.preferences) : {}
        });
    }
    stmt.free();

    // Select items from survey inventory
    const itemStmt = db.prepare(`SELECT item FROM survey_inventory LIMIT 3`);
    const items: string[] = [];
    while (itemStmt.step()) {
        items.push(itemStmt.getAsObject().item);
    }
    itemStmt.free();

    if (items.length === 0) {
        items.push('50kg Bag of Rice', 'Cooking Palm Oil', 'Tubers of Yam');
    }

    for (const user of users) {
        const randomItem = items[Math.floor(Math.random() * items.length)];
        const prompt = getSurveyPrompt(randomItem);

        // Record sent question
        db.run(
            `INSERT INTO sent_questions (phone, question) VALUES (?, ?)`,
            [user.phone, prompt.question]
        );

        // Push to user messages as an inline card message
        const cardDataJson = JSON.stringify({
            type: 'survey',
            question: prompt.question,
            options: prompt.options
        });

        db.run(
            `INSERT INTO messages (phone, sender, content, channel, card_data) VALUES (?, 'assistant', ?, 'pwa', ?)`,
            [user.phone, `Survey: ${prompt.question}`, cardDataJson]
        );
    }
    saveDb();
}

// 2. Submit response & trigger +1 reward
export async function submitSurveyResponse(phone: string, question: string, answer: string): Promise<{ success: boolean; reward: number }> {
    const db = await getDb();

    // Update memory profile's preferences to store this response (intelligence profile expansion)
    const stmt = db.prepare(`SELECT preferences FROM memory_profiles WHERE phone = ?`);
    stmt.bind([phone]);
    let preferences: any = {};
    if (stmt.step()) {
        const row = stmt.getAsObject();
        preferences = row.preferences ? JSON.parse(row.preferences) : {};
    }
    stmt.free();

    if (!preferences.survey_answers) {
        preferences.survey_answers = {};
    }
    preferences.survey_answers[question] = answer;

    db.run(
        `UPDATE memory_profiles SET preferences = ? WHERE phone = ?`,
        [JSON.stringify(preferences), phone]
    )


    // Confirm the credit reward (+1) is triggered on survey response
    await addCredits(phone, 1, `Earned +1 Credit for responding to survey: "${question}"`);

    saveDb();
    return { success: true, reward: 1 };
}

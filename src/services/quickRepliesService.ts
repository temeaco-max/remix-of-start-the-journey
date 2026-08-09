import { getDb } from '../database.js';

export async function getQuickReplies(phone: string): Promise<string[]> {
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
        const step = prefs.onboarding_step || 'start';
        if (step === 'ask_intent') {
            return ['Find Services', 'Earn Money', 'Both'];
        }
        if (step === 'ask_skills') {
            return ['plumber', 'driver', 'baker', 'none'];
        }
        if (step === 'confirm_code') {
            return ['CONFIRM'];
        }
        return [];
    }

    // Default Main Menu Quick Replies
    return [
        'Request Ride 🚲',
        'Find Worker 🔧',
        'Circle Savings 💰',
        'Check Balance 💳',
        'Emergency SOS 🚨'
    ];
}

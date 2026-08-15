import { getDb, saveDb } from '../database.js';
import { decryptData, encryptData } from './memoryProfile.js';

/**
 * Onboarding is progressive guidance, not a hard conversational gate.
 * Once a user has supplied a name, or has an active Economic Request, normal
 * Chat ownership must remain available. Users should never have to complete a
 * profile survey before Kurukoo can help with an immediate request.
 */
export async function isOnboarding(phone: string): Promise<boolean> {
    const db = await getDb();
    const stmt = db.prepare(`SELECT name, preferences FROM memory_profiles WHERE phone = ?`);
    stmt.bind([phone]);
    let onboarding = false;
    let name: string | null = null;
    if (stmt.step()) {
        const obj = stmt.getAsObject();
        name = obj.name ? String(obj.name).trim() : null;
        const prefs = obj.preferences ? JSON.parse(decryptData(String(obj.preferences))) : {};
        onboarding = prefs.onboarding_complete !== true;
    }
    stmt.free();
    if (!onboarding) return false;

    // A supplied identity is enough to let the conversational system continue.
    // Remaining profile enrichment can happen progressively instead of blocking.
    if (name) return false;

    // Never let onboarding capture a live economic workflow. The request owner
    // must remain available for requirement collection and continuation.
    try {
        const active = db.prepare(`SELECT id FROM economic_requests WHERE phone = ? AND status IN ('requested','awaiting_match','partially_matched','matched','quoting','quoted','awaiting_confirmation','reserved','payment_pending','paid','in_fulfillment') ORDER BY updated_at DESC LIMIT 1`);
        active.bind([phone]);
        const hasActiveRequest = active.step();
        active.free();
        if (hasActiveRequest) return false;
    } catch {
        // If the optional request table is unavailable during early bootstrap,
        // preserve the original onboarding behaviour rather than crashing Chat.
    }

    return true;
}

export async function handleOnboardingInput(phone: string, text: string): Promise<{ reply: string, cardData?: any }> {
    const db = await getDb();
    const stmt = db.prepare(`SELECT name, preferences, is_available FROM memory_profiles WHERE phone = ?`);
    stmt.bind([phone]);
    let name: string | null = null;
    let prefs: any = {};
    if (stmt.step()) {
        const obj = stmt.getAsObject();
        name = obj.name;
        prefs = obj.preferences ? JSON.parse(decryptData(String(obj.preferences))) : {};
    }
    stmt.free();

    const step = prefs.onboarding_step || 'start';

    if (step === 'start') {
        prefs.onboarding_step = 'ask_intent';
        db.run(`UPDATE memory_profiles SET name = ?, preferences = ? WHERE phone = ?`, [text, encryptData(JSON.stringify(prefs)), phone]);
        saveDb();
        return {
            reply: `Nice to meet you, ${text}! Are you here to find services, earn from your skills, or both?`,
            cardData: { type: 'survey', question: 'Select Your Primary Intent', options: ['Find Services', 'Earn Money', 'Both'] }
        };
    } else if (step === 'ask_intent') {
        prefs.onboarding_step = 'ask_skills';
        prefs.primary_intent = text;
        db.run(`UPDATE memory_profiles SET preferences = ? WHERE phone = ?`, [encryptData(JSON.stringify(prefs)), phone]);
        saveDb();
        return {
            reply: `Excellent choice! What kind of work or skills can you do? (e.g. plumber, baker, driver, coder, or reply 'none' if you only want to find services)`,
            cardData: { type: 'quick_replies', options: ['plumber', 'driver', 'baker', 'none'] }
        };
    } else if (step === 'ask_skills') {
        const cleanSkill = text.toLowerCase().trim();
        if (cleanSkill.includes('ride') || cleanSkill.includes('find') || cleanSkill.includes('help') || cleanSkill.includes('support') || cleanSkill === 'none') {
            prefs.onboarding_complete = true;
            prefs.onboarding_step = 'done';
            db.run(`UPDATE memory_profiles SET wallet_balance_minor = wallet_balance_minor + 20, preferences = ? WHERE phone = ?`, [encryptData(JSON.stringify(prefs)), phone]);
            saveDb();
            return {
                reply: `🎉 Account activated automatically with 20 Credits onboarding bonus! Processing your request: "${text}"...`,
                cardData: { type: 'reload_wallet', status: 'success' }
            };
        }
        prefs.onboarding_step = 'confirm_code';
        if (cleanSkill !== 'none') {
            prefs.skills = [cleanSkill];
            db.run(`INSERT OR IGNORE INTO skills (phone, skill, source, confidence, is_available) VALUES (?, ?, 'explicit', 1.0, 1)`, [phone, cleanSkill]);
        }
        db.run(`UPDATE memory_profiles SET preferences = ? WHERE phone = ?`, [encryptData(JSON.stringify(prefs)), phone]);
        saveDb();
        return {
            reply: `Almost done! To secure your identity and activate your account, please reply with the word CONFIRM (or type any request to proceed).`,
            cardData: { type: 'survey', question: 'Type CONFIRM to activate', options: ['CONFIRM'] }
        };
    } else if (step === 'confirm_code') {
        if (text.toUpperCase().trim() === 'CONFIRM' || text.length > 0) {
            prefs.onboarding_complete = true;
            prefs.onboarding_step = 'done';
            let exploreMention = '';
            if (prefs.explore_entry_category) {
                exploreMention = ` Since you explored ${prefs.explore_entry_category} earlier, would you like me to connect you with a verified provider for that right away?`;
            }
            db.run(`UPDATE memory_profiles SET wallet_balance_minor = wallet_balance_minor + 20, preferences = ? WHERE phone = ?`, [encryptData(JSON.stringify(prefs)), phone]);
            saveDb();
            return {
                reply: `🎉 Congratulations! Your Kurukoo account is now fully active.${exploreMention} We have credited 20 Credits to your balance as an onboarding bonus.`,
                cardData: { type: 'reload_wallet', status: 'success' }
            };
        } else {
            return { reply: `Please type CONFIRM exactly to activate your account.` };
        }
    }

    return { reply: `Welcome! Let's get started. What's your name?` };
}

export async function onboardNewUser(phone: string): Promise<string> {
    const db = await getDb();
    db.run(`INSERT OR IGNORE INTO memory_profiles (phone, name) VALUES (?, ?)`, [phone, null]);
    const prefs = { onboarding_step: 'start', onboarding_complete: false };
    db.run(`UPDATE memory_profiles SET name = NULL, preferences = ? WHERE phone = ?`, [encryptData(JSON.stringify(prefs)), phone]);
    saveDb();
    return `Welcome to Kurukoo! I am your AI assistant to help you request anything and earn from your skills. Let's get you set up in 3 simple steps.\n\nFirst, what is your name?`;
}

export function getDailyPersonalizedQuestion(day: number): { q: string, options: string[] } {
    const questions: Record<number, { q: string, options: string[] }> = {
        1: { q: 'Do you usually work from a stationary shop or move around as a mobile provider?', options: ['Stationary Shop', 'Mobile / Delivery', 'Both'] },
        2: { q: 'Would you like reminders to appear in Web Chat and your private notification inbox?', options: ['Yes, remind me', 'No reminders'] },
        3: { q: 'Do you have your own transport (motorcycle, bicycle, car) for dispatch work?', options: ['Yes, Motorbike/Car', 'Yes, Bicycle', 'No vehicle'] },
        4: { q: 'Do you save money in group circles with family or friends?', options: ['Yes, actively', 'Sometimes', 'No, never'] },
        5: { q: 'Would you like to use personal safety check-ins for selected journeys or routines?', options: ['Yes, explain check-ins', 'Maybe later', 'No'] },
        6: { q: 'Do you want to receive daily news and market price intelligence updates?', options: ['Yes, please', 'No, thanks'] },
        7: { q: 'Would you like verified product information when you ask what is available nearby?', options: ['Yes, show verified options', 'No, thanks'] }
    };
    return questions[day] || { q: 'How is your experience with Kurukoo so far?', options: ['Excellent', 'Good', 'Could be better'] };
}

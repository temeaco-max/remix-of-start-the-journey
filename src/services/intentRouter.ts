import { classifyWithFastText } from './fastTextService.js';
import { queryUnifiedAI, type AIProvider } from './unifiedAiEngine.js';
import { getProfile } from './memoryProfile.js';
import { delegateToAgentForSkill } from './aiAgentService.js';
import { getDb, saveDb } from '../database.js';
import { getSkillFlow } from './skillFlows.js';
import type { IntentRoutingResult } from '../types.js';

const ACTION_INTENTS = new Set([
    'ride_request', 'order_food', 'find_worker', 'universal_vendor_order', 'sports_matchmaking',
    'event_coverage', 'how_to_video', 'security_booking', 'circle_create', 'artist_booking'
]);

function actionCard(intent: string): any {
    if (intent === 'ride_request') return { type: 'ride_picker', options: ['Okada', 'Keke', 'Taxi'], escrowProtected: true };
    if (intent === 'order_food' || intent === 'universal_vendor_order') return { type: 'service_search', category: 'food', escrowProtected: true };
    if (intent === 'find_worker') return { type: 'worker_match', status: 'searching', escrowProtected: true };
    if (intent === 'sports_matchmaking') return { type: 'sports_search' };
    if (intent === 'event_coverage') return { type: 'event_coverage', status: 'offer' };
    if (intent === 'security_booking') return { type: 'security_booking', escrowProtected: true };
    if (intent === 'artist_booking') return { type: 'artist_booking', status: 'verification_required', escrowProtected: true };
    return undefined;
}

function flowReply(intent: string, flow: Awaited<ReturnType<typeof getSkillFlow>>): string {
    if (!flow) return `I can help with ${intent.replace(/_/g, ' ')}.`;
    const action = flow.post_match_action || 'match a suitable provider';
    const questions = flow.question_set ? flow.question_set.replace(/[\[\]{}]/g, '').trim() : '';
    return questions
        ? `I can help with this. ${questions} I’ll use the Kurukoo flow to ${action.toLowerCase()} and show you the next step before anything is committed.`
        : `I can help with this. I’ll use the Kurukoo flow to ${action.toLowerCase()} and show you the next step before anything is committed.`;
}

async function balanceReply(phone?: string): Promise<string> {
    if (!phone) return 'Your Kurukoo Points balance is available in the header.';
    const profile = await getProfile(phone, 'conversation_balance');
    const points = profile?.points_balance ?? 0;
    const location = profile?.location || 'your area';
    return `🪙 **${points} Points**\n\nKurukoo remembers you’re in **${location}**. Your Points stay attached to the same Memory Profile across channels.`;
}

async function keepAlive(phone?: string): Promise<IntentRoutingResult> {
    if (phone) {
        try {
            const db = await getDb();
            db.run(`INSERT INTO profile_access_log (phone, service_name, action) VALUES (?, 'Conversation', 'PRESENCE_REFRESH')`, [phone]);
            saveDb();
        } catch { /* telemetry must never block chat */ }
    }
    return { skill: 'presence_refresh', reply: '🟢 **You’re active.** Kurukoo is keeping your conversation context and presence synchronized across channels.' };
}

export async function routeIntent(query: string, phone?: string, provider?: AIProvider): Promise<IntentRoutingResult> {
    const q = query.trim().toLowerCase();
    if (!q) return { skill: 'general_question', reply: 'Tell me what you need.' };

    if (q === 'reset onboarding') return { skill: 'general_question', reply: 'Onboarding reset is available from your profile settings.' };
    if (q.includes('balance') || q.includes('points') || q.includes('wallet') || q.includes('credits')) return { skill: 'view_balance', reply: await balanceReply(phone) };
    if (q.includes('show nearby') || q.includes('nearby active') || q.includes('radar') || q.includes('where are providers')) return { skill: 'nearby_radar', reply: '📡 **Nearby Radar is on.** I’ll use your shared presence and Memory Profile to surface providers around you.', cardData: { type: 'nearby_radar' } };

    if (q.includes('book an artist') || q.includes('book a musician') || q.includes('book a dj') || q.includes('book a celebrity') || q.includes('hire an artist')) {
        const flow = await getSkillFlow('artist_booking').catch(() => null);
        return {
            skill: 'artist_booking',
            reply: '🎤 I can coordinate a creator/artist booking, but I’ll only present verified representatives and the booking terms before any escrow is funded. Tell me the artist/act, event date, venue/city, expected set or appearance, and budget.',
            cardData: actionCard('artist_booking') || flow ? { ...(actionCard('artist_booking') || {}), flow } : undefined
        };
    }

    if (q.includes('price check') || q.includes('market price') || q.includes('how much is')) {
        const result = await delegateToAgentForSkill('price_checker', query, phone);
        if (result.success) return { skill: 'price_check', reply: result.reply };
    }
    if (q.includes('dispute') || q.includes('complain') || q.includes('scam') || q.includes('safety')) {
        const result = await delegateToAgentForSkill('support_triage', query, phone);
        if (result.success) return { skill: 'support_triage', reply: result.reply };
    }
    if (q.includes('bin day') || q.includes('mot reminder') || q.includes('council tax') || q.includes('energy tariff')) {
        const result = await delegateToAgentForSkill('bin_day', query, phone);
        if (result.success) return { skill: 'life_admin', reply: result.reply };
    }

    const classification = classifyWithFastText(query);
    console.info(`[Kurukoo Router] intent=${classification?.intent || 'general_question'} confidence=${classification?.confidence?.toFixed(2) || 'n/a'}`);

    if (classification && ACTION_INTENTS.has(classification.intent)) {
        const flow = await getSkillFlow(classification.intent).catch(() => null);
        const cardData = actionCard(classification.intent);
        let reply = '';
        switch (classification.intent) {
            case 'ride_request': reply = '🚗 I can arrange that. Where are you going, and do you want an Okada, Keke, or Taxi?'; break;
            case 'order_food':
            case 'universal_vendor_order': reply = '🍔 Tell me what you want and your area. I’ll find a suitable local vendor and show you the total before you confirm.'; break;
            case 'find_worker': reply = '🔧 Tell me the job and your area. I’ll search for a verified worker and show the escrow-protected option before you commit.'; break;
            case 'sports_matchmaking': reply = '⚽ Tell me the sport, area, and whether you want a team, league, match, pitch, or watch party.'; break;
            case 'event_coverage': reply = '📸 I can help coordinate event coverage. Tell me the event location, date, and what you need captured.'; break;
            case 'how_to_video': reply = '🎥 Tell me what you want to learn. I can turn a practical guide into a structured how-to video workflow.'; break;
            case 'security_booking': reply = '🛡️ Tell me the location, date/time, and duration. I’ll route a vetted security booking with escrow protection.'; break;
            case 'circle_create': reply = flowReply(classification.intent, flow); break;
            default: reply = flowReply(classification.intent, flow);
        }
        return { skill: classification.intent, reply, cardData };
    }

    const ai = await queryUnifiedAI(query, { provider, phone });
    return { skill: 'general_question', reply: ai.text, cardData: ai.provider === 'SmolLM2' ? { type: 'ai_metadata', provider: ai.provider, model: ai.model } : undefined };
}

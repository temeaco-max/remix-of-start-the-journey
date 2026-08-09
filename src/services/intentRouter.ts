import { classifyIntentFastText } from './fastTextService.js';
import { queryGroq } from './groqService.js';
import { queryUnifiedAI, AIProvider } from './unifiedAiEngine.js';
import { queryGemini } from './geminiService.js';
import { IntentRoutingResult } from '../types.js';
import { getSkillFlow } from './skillFlows.js';
import { getProfile } from './memoryProfile.js';
import { delegateToAgentForSkill, findAgentForSkill } from './aiAgentService.js';
import { getDb, saveDb, getSystemSetting } from '../database.js';

export async function routeIntent(query: string, phone?: string, provider?: AIProvider): Promise<IntentRoutingResult> {
    const q = query.toLowerCase();

    // Keep-Alive Webhook Interceptor for WhatsApp session clock reset
    if (q.includes('show nearby active providers') || q.includes('active providers') || q.includes('verify your session') || q.includes('reset keep-alive')) {
        if (phone) {
            try {
                const db = await getDb();
                const stmt = db.prepare(`SELECT * FROM memory_profiles WHERE phone = ?`);
                stmt.bind([phone]);
                let profile = null;
                if (stmt.step()) {
                    profile = stmt.getAsObject();
                }
                stmt.free();

                const prefs = profile && profile.preferences ? JSON.parse(profile.preferences) : {};
                prefs.last_keep_alive_reset_at = new Date().toISOString();
                prefs.whatsapp_session_state = 'active_free';
                prefs.sim_hours_since_interaction = 0;

                if (profile) {
                    db.run(`UPDATE memory_profiles SET preferences = ? WHERE phone = ?`, 
                        [JSON.stringify(prefs), phone]);
                }

                db.run(`INSERT INTO profile_access_log (phone, service_name, action) VALUES (?, 'WhatsAppKeepAlive', 'WEBHOOK_INTERCEPTED_SESSION_CLOCK_RESET')`, [phone]);
                saveDb();
            } catch (err) {
                console.error('Failed to auto-reset keep-alive in routeIntent:', err);
            }
        }
        return {
            skill: 'keep_alive_reset',
            reply: `🔍 *Kurukoo Live Radar:*\nWe found 3 active transit providers (Okadas) and 2 delivery riders near you right now!\n\nYour free 24-hour conversation window has been successfully extended for *FREE*!`
        };
    }

    // Specific onboarding/general patterns first
    if (q.includes('log in') || q.includes('login') || q.includes('sign in')) return { skill: 'view_profile', reply: 'You can view your profile by accessing the drawer menu.' };
    if (q.includes('sign up') || q.includes('register')) return { skill: 'general_question', reply: 'You can sign up by typing your phone number in the chat.' };
    
    // Balance / Points / Wallet check
    if (q.includes('balance') || q.includes('points') || q.includes('wallet') || q.includes('how much credit') || q.includes('credit')) {
        let balance = 30;
        let tier = 'Base';
        let signals = 30;
        if (phone) {
            const profile = await getProfile(phone, 'intent_router');
            if (profile) {
                balance = profile.wallet_balance_minor ?? 30;
                tier = profile.subscription_tier ?? 'Base';
                signals = profile.livecast_signals_remaining ?? 30;
            }
        }
        return {
            skill: 'view_balance',
            reply: `💰 *Your Kurukoo Balance & Status*\n• Points Balance: *${balance} Points*\n• Subscription Tier: *${tier}*\n• liveCast Signals Remaining: *${signals}*\n\nNeed to top up Points or change your tier? Tap your balance in the app or reply TOPUP.`
        };
    }

    // AI Agent Routing: Price Check / Market Discovery
    if (q.includes('price check') || q.includes('how much is') || q.includes('cheapest price') || q.includes('market price')) {
        const agentRes = await delegateToAgentForSkill('price_checker', query, phone);
        if (agentRes.success) {
            return { skill: 'price_check', reply: agentRes.reply };
        }
    }

    // AI Agent Routing: Support & Dispute Triage / Emergency
    if (q.includes('dispute') || q.includes('complain') || q.includes('scam') || q.includes('emergency') || q.includes('safety')) {
        const agentRes = await delegateToAgentForSkill('support_triage', query, phone);
        if (agentRes.success) {
            return { skill: 'support_triage', reply: agentRes.reply };
        }
    }

    // AI Agent Routing: UK Life Admin & Reminders (MOT, Bin Day, Council Tax)
    if (q.includes('bin day') || q.includes('mot reminder') || q.includes('council tax') || q.includes('energy tariff') || q.includes('lost pet')) {
        const agentRes = await delegateToAgentForSkill('bin_day', query, phone);
        if (agentRes.success) {
            return { skill: 'bin_day', reply: agentRes.reply };
        }
    }

    // AI Agent Routing: Arbitrage Trade Match / Buyer
    if (q.includes('arbitrage') || q.includes('wholesale supplier') || q.includes('trade deal')) {
        const agentRes = await delegateToAgentForSkill('buyer', query, phone);
        if (agentRes.success) {
            return { skill: 'trade_match', reply: agentRes.reply };
        }
    }

    if (q.includes('hello') || q.includes('hi') || q.includes('are you there') || q.includes('thank you') || q === 'thanks' || q.includes('thanks') || q === 'thank' || q === 'ok' || q === 'okay' || q === 'yes' || q === 'no' || q === 'cool' || q === 'awesome' || q === 'perfect' || q.includes('what is my request')) {
        const unifiedRes = await queryUnifiedAI(query, { provider, phone });
        return { skill: 'general_question', reply: unifiedRes.text };
    }


    // Check if user is confirming an order or selecting a ride option / sponsored deal
    if (q.includes('confirm order:') || q.includes('i request a ride:') || q.includes('order now') || q.includes('okada (') || q.includes('keke (') || q.includes('taxi') || q.includes('bicycle delivery')) {
        let itemName = query;
        if (q.includes('confirm order:')) itemName = query.replace(/confirm order:\s*/i, '');
        else if (q.includes('i request a ride:')) itemName = query.replace(/i request a ride:\s*/i, '');
        
        return {
            skill: 'order_confirmed',
            reply: `✅ *Booking Confirmed & Dispatched!*\n• Selected Service: *${itemName}*\n• Status: Matched with verified local provider.\n• ETA: 3–5 minutes away.\n\nYour 20 Points bonus has been applied. Enjoy your ride/service!`,
            cardData: {
                type: 'order_success',
                title: 'Booking Dispatched',
                desc: `Successfully matched with verified local provider for "${itemName}".`,
                status: 'verified_lead_generated'
            }
        };
    }

    // ----------------------------------------------------
    // DYNAMIC AUTONOMOUS AI AGENT FLOW (Grok & Gemini Style)
    // ----------------------------------------------------
    const isServiceRequest = q.includes('ride') || q.includes('transport') || q.includes('taxi') || q.includes('okada') || q.includes('keke') || q.includes('cab') || q.includes('car') ||
                            q.includes('food') || q.includes('hungry') || q.includes('eat') || q.includes('suya') || q.includes('rice') || q.includes('caterer') || q.includes('masa') ||
                            q.includes('plumber') || q.includes('electrician') || q.includes('mechanic') || q.includes('fix') || q.includes('repair') || q.includes('parts') || q.includes('security') || q.includes('guard') || q.includes('bill') || q.includes('electricity') || q.includes('meter');

    if (isServiceRequest) {
        try {
            const systemPrompt = `You are Kurukoo, an ultra-smart, highly autonomous everyday AI Agent for transit (rides/deliveries), food, local artisans, and life-admin across Nigeria (Ibadan, Lagos, Abuja, Enugu, etc.) and the UK.
Your task is to analyze the user's request and output a strictly valid JSON response.
Do NOT include any markdown formatting, backticks (\`\`\`), or wordy introductions. Just output the raw JSON.

Categories:
- "ride" (e.g. Okada/Motorcycle, Keke/Tricycle, Taxi/Car)
- "food" (e.g. Suya & Masa, Rice & Yam Bundle, Local Caterer Platter)
- "artisan" (e.g. Mobile Mechanic, Event Security, Electricity Bill/Utility, Plumber, Electrician)

For booking classes ("ride", "food", "artisan"):
1. Assess if you have enough details to lock a specific service.
   - For "ride": Needs destination and ride type (Okada, Keke, or Taxi). If ride type is missing, hasAllDetails must be false.
   - For "food": Needs specific item (Suya & Masa, Rice & Yam Bundle, or Local Caterer Platter). If missing, hasAllDetails must be false.
   - For "artisan": Needs specific service type (Mobile Mechanic, Event Security, Electricity Bill, Plumber, etc.). If missing, hasAllDetails must be false.
2. If hasAllDetails is false, reply asking a friendly, localized clarifying question (e.g. "Ku Kurukoo! I can arrange a ride for you. Which do you prefer? Okada, Keke, or Taxi?"). Include options in the reply.
3. If hasAllDetails is true, set selectedType to the matched option (e.g. "Okada") and formulate a conversational reply explaining you are launching the Kurukoo autonomous matching engine.

Format:
{
  "category": "ride" | "food" | "artisan",
  "hasAllDetails": true | false,
  "selectedType": "Okada" | "Keke" | "Taxi" | "Suya & Masa" | "Rice & Yam Bundle" | "Local Caterer Platter" | "Mobile Mechanic" | "Event Security" | "Electricity Bill" | null,
  "reply": "Conversational reply. Localize with warm Nigerian/UK pidgin/slang when appropriate (e.g. 'Ku Kurukoo!', 'Wetin you wan ride today?'). Keep it clear.",
  "thoughts": "Your internal agent thinking monologue about intent, entity extraction, or route/GPS parameters."
}
`;

            const wrappedQuery = `<USER_INPUT>\n${query}\n</USER_INPUT>`;
            const geminiRaw = await queryGemini(wrappedQuery, { 
                systemInstruction: systemPrompt,
                responseMimeType: 'application/json'
            });
            console.log("[Autonomous Agent] Raw response:", geminiRaw);
            
            // Extract JSON from response in case there are backticks
            let cleanJson = geminiRaw;
            if (cleanJson.includes('```json')) {
                cleanJson = cleanJson.split('```json')[1].split('```')[0].trim();
            } else if (cleanJson.includes('```')) {
                cleanJson = cleanJson.split('```')[1].split('```')[0].trim();
            }
            cleanJson = cleanJson.trim();

            const parsed = JSON.parse(cleanJson);
            if (parsed && parsed.category) {
                return {
                    skill: 'autonomous_agent',
                    reply: parsed.reply,
                    cardData: {
                        type: 'autonomous_agent_state',
                        category: parsed.category,
                        hasAllDetails: parsed.hasAllDetails,
                        selectedType: parsed.selectedType,
                        thoughts: parsed.thoughts
                    }
                };
            }
        } catch (err) {
            console.warn("[Autonomous Agent] Failed parsing or querying Gemini autonomous state, using fallback:", err);
        }

        // Rule-based graceful fallback matching if Gemini fails/API limit reached
        let targetSkill = '';
        if (q.includes('ride') || q.includes('okada') || q.includes('keke') || q.includes('car')) targetSkill = 'driver';
        else if (q.includes('food') || q.includes('hungry') || q.includes('caterer') || q.includes('rice')) targetSkill = 'caterer';
        else if (q.includes('plumber') || q.includes('electrician') || q.includes('mechanic') || q.includes('worker') || q.includes('fix')) targetSkill = 'artisan';

        if (targetSkill) {
            const flow = await getSkillFlow(targetSkill);
            let replyStr = `I've matched your request.`;
            if (flow) {
                replyStr = `Found flow for ${targetSkill}: ${flow.post_match_action}. Instructions: ${flow.fulfillment_instructions}`;
            }
            
            let cardData: any = {};
            if (targetSkill === 'driver') cardData = { type: 'ride_picker', options: ['Okada (₦500)', 'Keke (₦800)', 'Taxi / Car (₦2,000)'] };
            else if (targetSkill === 'caterer') cardData = { type: 'product_card', title: 'Bodija Market Fresh Rice & Yam Bundle', price: '₦12,500' };
            else if (targetSkill === 'artisan') cardData = { type: 'worker_match', status: 'verified_lead_generated' };

            // Mimic the autonomous response format so client acts identically
            let selectedOption = null;
            if (q.includes('okada')) selectedOption = 'Okada';
            else if (q.includes('keke')) selectedOption = 'Keke';
            else if (q.includes('taxi') || q.includes('car') || q.includes('cab')) selectedOption = 'Taxi';

            return {
                skill: 'autonomous_agent',
                reply: replyStr,
                cardData: {
                    type: 'autonomous_agent_state',
                    category: targetSkill === 'driver' ? 'ride' : targetSkill === 'caterer' ? 'food' : 'artisan',
                    hasAllDetails: !!selectedOption,
                    selectedType: selectedOption,
                    thoughts: `Auto-extracted intent from user query using Rule Fallback engine.`
                }
            };
        }
    }

    if (q.includes('pulse') || q.includes('go live')) {
        return {
            skill: 'nearby_pulse_start',
            reply: `Nearby Pulse activated! Broadcasting your mobile skill to nearby users for 30 minutes.`
        };
    }

    // Try FastText / Groq fallback for open-ended queries
    const useGroqRouting = await getSystemSetting('use_groq_routing', 'false') === 'true';
    if (!useGroqRouting) {
        const fastTextRes = classifyIntentFastText(q);
        if (fastTextRes !== 'unknown') {
            return {
                skill: fastTextRes,
                reply: `Processed request via FastText intent: ${fastTextRes}`
            };
        }
    }

    const unifiedRes = await queryUnifiedAI(query, { provider, phone });
    return {
        skill: 'general_question',
        reply: unifiedRes.text
    };
}

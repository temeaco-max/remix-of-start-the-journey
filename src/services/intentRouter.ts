import { queryUnifiedAI, type AIProvider } from './unifiedAiEngine.js';
import { getProfile, updateProfile } from './memoryProfile.js';
import { delegateToAgentForSkill } from './aiAgentService.js';
import { getContextualIntentSuggestions, getEconomicCategory, getKnownSkills, getSkillFlow } from './skillFlows.js';
import { classifyWithFastText } from './fastTextService.js';
import { advanceStorefront, previewStorefrontCard, startStorefrontSession, tryResumeStorefront } from './agenticStorefront.js';
import { searchKnownEconomicOffers } from './economicParticipants.js';
import { cancelReminder, createReminder, listReminders } from './reminderService.js';
import { cancelAgentGoal, listAgentGoals } from './agentRuntime.js';
import { matchAdCampaigns } from './adManager.js';
import type { IntentRoutingResult } from '../types.js';

const ACTION_INTENTS = new Set(['ride_request', 'order_food', 'find_worker', 'universal_vendor_order', 'sports_matchmaking', 'event_coverage', 'how_to_video', 'security_booking', 'circle_create', 'artist_booking', 'national_events']);
const STOREFRONT_INTENTS = new Set(['ride_request', 'order_food', 'find_worker', 'universal_vendor_order', 'security_booking']);

const CANONICAL_ALIASES: Array<[RegExp, string]> = [
  [/\b(jollof|fried rice|meal for|food for)\b/, 'order_food'],
  [/\b(buy|purchase|get)\b.*\b(car|vehicle)\b|\b(car|vehicle)\b.*\b(buy|purchase)\b/, 'buy_car'],
  [/\b(buy|purchase|get)\b.*\btickets?\b|\btickets?\b.*\b(buy|purchase|get)\b/, 'buy_ticket'],
  [/\b(phone|device|laptop|computer|screen)\b.*\brepair\b|\brepair\b.*\b(phone|device|laptop|computer|screen)\b/, 'repair'],
  [/\b(source|source me|find|procure)\b.*\b(product|products|goods|item)\b|\b(phone\s+charger|charger|replacement\s+part|spare\s+part|phone\s+accessory)\b/, 'product_sourcing'],
  [/\b(bodyguard|security guard|security personnel|private security)\b/, 'security_personnel'],
  [/\b(plumber|electrician|mechanic|carpenter|tailor|cleaner|technician|painter|decorator|tiler|roofer|mason|welder)\b/, 'find_worker'],
  [/\b(order|get|buy)\b.*\b(food|meal|rice|groceries|groceries?)\b/, 'order_food'],
  [/\b(okada|motorbike|motorcycle)\b/, 'okada_rider'],
  [/\bkeke|tricycle\b/, 'keke_driver'],
  [/\b(taxi|cab|uber|ride-hailing)\b/, 'taxi_driver'],
  [/\b(ride|trip)\b/, 'ride_request'],
  [/\b(book|hire|need|get)\b.*\b(artist|musician|dj|celebrity|performer|creator)\b/, 'verified_artist'],
  [/\b(football|basketball|tennis|pitch|match|league|team|player)\b/, 'sports_matchmaking'],
  [/\b(verify|evidence|capture|report|contributor|event coverage)\b/, 'event_coverage'],
  [/\b(happening|event|events|weekend|calendar|daily picks)\b/, 'national_events']
];

function skillForIntent(intent: string): string {
  if (intent === 'ride_request') return 'ride_request';
  if (intent === 'order_food' || intent === 'universal_vendor_order') return 'order_food';
  if (intent === 'find_worker') return 'find_worker';
  if (intent === 'security_booking') return 'security_personnel';
  if (intent === 'artist_booking') return 'verified_artist';
  return intent;
}

function actionCard(intent: string): any {
  if (STOREFRONT_INTENTS.has(intent)) return previewStorefrontCard(skillForIntent(intent));
  if (intent === 'sports_matchmaking') return { type: 'sports_search' };
  if (intent === 'event_coverage') return { type: 'event_coverage', status: 'offer' };
  if (intent === 'national_events') return { type: 'events_list' };
  if (intent === 'artist_booking') return previewStorefrontCard('verified_artist');
  return undefined;
}

function requirementPrompt(category: string | null, skill: string): string {
  switch (category) {
    case 'transport-mobility': return 'Where are you going, when do you need it, and do you have a vehicle preference?';
    case 'food-drink': return 'What do you want, where should it be delivered or collected, and when?';
    case 'repairs-maintenance': return 'What needs fixing, where are you, and how urgent is it?';
    case 'events-entertainment': return 'What is the event, date, location, expected audience, and budget?';
    case 'automotive-mechanics': return 'What vehicle or service do you need, where are you, and when?';
    case 'classifieds-marketplace': return 'What exactly are you looking for, your budget, and your preferred area?';
    case 'gigs-microtasks': return 'What needs to be done, where, when, and what budget or rate do you have?';
    case 'professional-services': return 'What outcome do you need, where are you, and what deadline or budget applies?';
    case 'sports-recreation': return 'Which sport or activity, where, when, and how many people are involved?';
    case 'health-medical': return 'What service do you need, where are you, and how soon do you need help?';
    default: return `Tell me what you need for ${skill.replace(/_/g, ' ')}, where you need it, and when.`;
  }
}

function flowReply(intent: string, flow: any): string {
  if (!flow) return `I can help with ${intent.replace(/_/g, ' ')}. ${requirementPrompt(getEconomicCategory(intent), intent)}`;
  const action = flow.post_match_action || 'match a suitable provider';
  const questions = flow.question_set ? flow.question_set.replace(/[\[\]{}]/g, '').trim() : '';
  return questions ? `I can help with this. ${questions} I’ll use the Kurukoo flow to ${action.toLowerCase()} and show you the next step before anything is committed.` : `I can help with this. ${requirementPrompt(flow.category || getEconomicCategory(intent), intent)} I’ll use the Kurukoo flow to ${action.toLowerCase()} and show you the next step before anything is committed.`;
}

function matchCanonicalSkill(query: string): string | null {
  for (const [pattern, skill] of CANONICAL_ALIASES) if (pattern.test(query)) return skill;
  const skills = getKnownSkills().filter(skill => skill.length >= 4);
  for (const skill of skills) {
    const phrase = skill.replace(/_/g, ' ').toLowerCase();
    if (query.includes(phrase)) return skill;
  }
  return null;
}

async function balanceReply(phone?: string): Promise<string> {
  if (!phone) return 'Your Kurukoo Points balance is available in the header.';
  const profile = await getProfile(phone, 'conversation_balance');
  const points = profile?.points_balance ?? 0;
  const location = profile?.location || 'your area';
  return `🪙 **${points} Points**\n\nKurukoo remembers you’re in **${location}**. Your Points stay attached to the same Memory Profile across channels.`;
}

function isResumePhrase(q: string): boolean {
  return /\b(continue|resume|open request|my request|the match|found a match|provider matched|pick up|where we left|deferred request|continue with)\b/.test(q);
}

function parseReminderQuery(q: string): { dueAt: string; title: string; displayTime: string } | null {
  const rel = q.match(/^remind me\s+(?:in\s+)?(\d+)\s+(minute|minutes|hour|hours|day|days)\s+(?:to\s+)?(.+)$/i);
  if (rel) {
    const amount = Number(rel[1]);
    const unit = rel[2].toLowerCase();
    const multiplier = unit.startsWith('hour') ? 3600_000 : unit.startsWith('day') ? 86400_000 : 60_000;
    const ms = amount * multiplier;
    if (Number.isFinite(ms) && ms > 0) {
      const dueAt = new Date(Date.now() + ms).toISOString();
      return { dueAt, title: rel[3].trim(), displayTime: `in ${amount} ${unit}` };
    }
  }
  
  const abs = q.match(/^remind me\s+(?:(every\s+day|every\s+week|daily|weekly)?\s*)?(?:on\s+([a-z]+)\s+)?(?:(tomorrow|today)\s+)?(?:(?:at\s+)?(\d{1,2})(?::(\d{2}))?\s*(am|pm)?\s+)?(?:to\s+)?(.+)$/i);
  if (abs) {
    const recurrence = abs[1]?.toLowerCase();
    const day = abs[2]?.toLowerCase();
    const relative = abs[3]?.toLowerCase();
    let hour = Number(abs[4] || 9);
    const min = Number(abs[5] || 0);
    const meridiem = abs[6]?.toLowerCase();
    
    if (meridiem === 'pm' && hour < 12) hour += 12;
    if (meridiem === 'am' && hour === 12) hour = 0;
    
    const d = new Date();
    d.setHours(hour, min, 0, 0);
    if (relative === 'tomorrow') d.setDate(d.getDate() + 1);
    if (day) {
      const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
      const target = days.indexOf(day);
      if (target !== -1) {
        let diff = target - d.getDay();
        if (diff <= 0) diff += 7;
        d.setDate(d.getDate() + diff);
      }
    }
    if (d.getTime() <= Date.now() && !day && !relative) d.setDate(d.getDate() + 1);
    
    return { dueAt: d.toISOString(), title: abs[7].trim(), displayTime: `${relative || day ? `${relative || day} at ` : ''}${d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}${recurrence ? ` (${recurrence})` : ''}` };
  }
  return null;
}

function suggestionCard(intent: string) {
  const suggestions = getContextualIntentSuggestions(intent);
  return suggestions.length ? { type: 'intent_suggestions', intent, suggestions } : undefined;
}

function decorateCardWithSuggestions(card: any, intent: string) {
  const suggestions = getContextualIntentSuggestions(intent);
  return suggestions.length ? { ...(card || {}), suggestions } : card;
}

function extractFollowUpPatch(q: string, skill: string): Record<string, unknown> {
  const patch: Record<string, unknown> = {};
  if (skill === 'find_worker') {
    const location = q.match(/\b(?:in|at)\s+([a-z][a-z\s-]{2,40})$/i)?.[1] || (q.includes('ikeja') ? 'Ikeja' : undefined);
    if (location) patch.location = location.trim().replace(/[.!?]+$/, '');
    if (/\b(tomorrow|today|tonight|evening|morning|afternoon|this week)\b/i.test(q)) patch.time = q.trim();
    if (!location && !patch.time && /^(the )?(bathroom|kitchen|roof|car|phone|fridge|sink)\b/i.test(q)) patch.service = q.trim().replace(/[.!?]+$/, '');
  }
  if (skill === 'order_food') {
    const quantity = q.match(/\bfor\s+(\d+)\s*(?:people|persons)?\b/i)?.[1];
    if (quantity) patch.quantity = quantity;
    const items = q.replace(/\bfor\s+\d+\s*(?:people|persons)?\b/i, '').trim().replace(/[.!?]+$/, '');
    if (items && !/^(in|at)\b/i.test(items)) patch.items = items;
    const location = q.match(/\b(?:in|at)\s+([a-z][a-z\s-]{2,40})$/i)?.[1];
    if (location) patch.location = location.trim().replace(/[.!?]+$/, '');
  }
  return patch;
}

async function applyFollowUpSlot(phone: string, q: string): Promise<IntentRoutingResult | null> {
  const active = await tryResumeStorefront(phone);
  if (!active?.requestId) return null;
  const patch = extractFollowUpPatch(q, active.skill);
  if (!Object.keys(patch).length) return null;
  const card = await advanceStorefront(phone, active.requestId, patch);
  return { skill: active.skill, reply: card.message, cardData: card };
}

async function handleExplicitMemory(phone: string, q: string): Promise<IntentRoutingResult | null> {
  const remember = q.match(/^remember that\s+(.+)$/i);
  if (remember) {
    const statement = remember[1].trim();
    const profile = await getProfile(phone, 'conversation_memory');
    const preferences = { ...(profile?.preferences || {}) };
    if (/\b(prefer|want|like)\b.*\b(short|simple|concise|brief)\b/i.test(statement)) preferences.response_style = 'concise';
    else if (/\bevening\b.*\breminder/i.test(statement)) preferences.reminder_time_preference = 'evening';
    else return { skill: 'memory', reply: 'I can remember preferences such as how you like answers or when you prefer reminders. Tell me that preference in a specific way.' };
    await updateProfile(phone, 'conversation_memory', { preferences });
    return { skill: 'memory', reply: 'Got it. I’ll keep that preference with your Kurukoo Memory Profile.' };
  }
  if (/^(what do you remember about me|what do you know about me)\??$/i.test(q)) {
    const profile = await getProfile(phone, 'conversation_memory');
    const preferences = profile?.preferences || {};
    const items = [preferences.response_style === 'concise' ? 'you prefer short, simple answers' : '', preferences.reminder_time_preference === 'evening' ? 'you prefer evening reminders' : ''].filter(Boolean);
    return { skill: 'memory', reply: items.length ? `I remember that ${items.join(' and ')}.` : 'I do not have any saved preferences for you yet.' };
  }
  return null;
}

export async function routeIntent(query: string, phone?: string, provider?: AIProvider): Promise<IntentRoutingResult> {
  const q = query.trim().toLowerCase();
  if (!q) return { skill: 'general_question', reply: 'Tell me what you need.' };

  if (phone) {
    const memoryResult = await handleExplicitMemory(phone, q);
    if (memoryResult) return memoryResult;
  }
  if (/^(what is kurukoo|what does kurukoo do|explain kurukoo)\??$/i.test(q)) {
    const profile = phone ? await getProfile(phone, 'conversation_explanation') : null;
    const concise = profile?.preferences?.response_style === 'concise';
    return { skill: 'general_question', reply: concise ? 'Kurukoo is one conversation for everyday help: it can answer questions, remember preferences, set reminders, coordinate verified services, and keep requests moving without pretending a payment or provider action happened.' : 'Kurukoo is an everyday utility assistant in one conversation. It can answer questions, remember preferences, set reminders, coordinate verified services and products, and keep requests moving through truthful states before any payment or external action.' };
  }
  if (phone && /^(what have you been doing for me|what are you doing for me)\??$/i.test(q)) {
    const [reminders, active, goals] = await Promise.all([listReminders(phone), tryResumeStorefront(phone), listAgentGoals(phone)]);
    const parts = [];
    if (reminders.length) parts.push(`one active reminder (${reminders[0].title})`);
    if (active) parts.push(`an open ${active.skill.replace(/_/g, ' ')} request (${active.stage})`);
    const activeGoal = goals.find(goal => ['active', 'waiting', 'needs_user', 'blocked'].includes(goal.status));
    if (activeGoal) parts.push(`a bounded follow-up goal (${activeGoal.status})`);
    return { skill: 'general_question', reply: parts.length ? `Right now I’m tracking ${parts.join(', ')}. I have not claimed a provider, price, payment, or external action unless the relevant evidence is recorded.` : 'Nothing is actively running for you right now. I can answer a question, remember a preference, set a reminder, or help coordinate a request.' };
  }
  if (phone && /^cancel\s+(the\s+)?reminder\b/.test(q)) {
    const reminders = await listReminders(phone);
    const reminder = reminders[0];
    if (!reminder) return { skill: 'reminder', reply: 'There is no active reminder to cancel.' };
    const cancelled = await cancelReminder(phone, String(reminder.id));
    return { skill: 'reminder', reply: cancelled ? `Cancelled your reminder: **${reminder.title}**.` : 'I could not cancel that reminder.' };
  }
  if (phone && /^(cancel that|stop following|stop checking)\b/.test(q)) {
    const goals = await listAgentGoals(phone);
    const activeGoal = goals.find(goal => ['active', 'waiting', 'needs_user', 'blocked'].includes(goal.status));
    if (activeGoal) {
      const cancelled = await cancelAgentGoal(phone, activeGoal.id);
      return { skill: 'autonomous_agent', reply: cancelled?.summary || 'I stopped following up on that objective.', cardData: { type: 'agent_goal', goal: cancelled } };
    }
    const active = await tryResumeStorefront(phone);
    if (active?.requestId) {
      const card = await advanceStorefront(phone, active.requestId, {}, 'cancel');
      return { skill: active.skill, reply: card.message, cardData: card };
    }
    return { skill: 'general_question', reply: 'There is no active follow-up for me to cancel.' };
  }
  if (/^remind me\b/.test(q)) {
    if (!phone || phone.startsWith('anon_')) return { skill: 'reminder', reply: 'I can save that reminder as soon as you sign in, so it stays with your Kurukoo profile.' };
    const reminder = parseReminderQuery(q);
    if (reminder) {
      try {
        const created = await createReminder(phone, { title: reminder.title, dueAt: reminder.dueAt });
        return { skill: 'reminder', reply: `⏰ Done. I’ll remind you **${created.title}** (${reminder.displayTime}).`, cardData: decorateCardWithSuggestions({ type: 'reminder', reminder: created }, 'reminder') };
      } catch (e) {
        return { skill: 'reminder', reply: e instanceof Error ? e.message : 'I could not create that reminder.' };
      }
    }
    return { skill: 'reminder', reply: 'I can set that reminder. Tell me the time, for example: “Remind me in 20 minutes to call Mum” or “Remind me tomorrow at 9am to check reports”.' };
  }

  if (q === 'reset onboarding') return { skill: 'general_question', reply: 'Onboarding reset is available from your profile settings.' };
  if (/^(ask the community|share with the community|post to the community)\b/i.test(q)) return { skill: 'topic', reply: 'I can help you draft a community Topic. Nothing from this private conversation will be shared automatically; review the draft and choose what to publish.', cardData: { type: 'topic_draft', status: 'review_required', privacy: 'private_by_default', source: 'explicit_user_request', content: '' } };
  if (q.includes('balance') || q.includes('points') || q.includes('wallet') || q.includes('credits')) return { skill: 'view_balance', reply: await balanceReply(phone) };
  if (q.includes('show nearby') || q.includes('nearby active') || q.includes('radar') || q.includes('where are providers')) return { skill: 'nearby_radar', reply: '📡 **Nearby Radar is on.** I’ll use your shared presence and Memory Profile to surface providers around you.', cardData: { type: 'nearby_radar' } };

  if (q.includes('emergency contact') || q.includes('safety contact')) {
    if (!phone || phone.startsWith('anon_')) return { skill: 'safety_contact', reply: 'I can save your personal emergency contacts as soon as you sign in, so they stay with your Kurukoo profile.' };
    const addMatch = q.match(/add\s+(.+?)\s+as\s+(?:my\s+)?(?:emergency|safety)\s+contact/i);
    if (addMatch) {
      const name = addMatch[1].trim();
      return {
        skill: 'safety_contact',
        reply: `I've captured **${name}** as a potential safety contact. To finish adding them, please provide their phone number.`,
        cardData: { type: 'safety_contact_capture', name }
      };
    }
    return { skill: 'safety_contact', reply: 'I can manage your safety contacts. You can add a contact by saying “Add [Name] as my emergency contact” or review them in the context inspector.', cardData: suggestionCard('safety_contact') };
  }

  if (phone && isResumePhrase(q)) {
    try {
      const resumed = await tryResumeStorefront(phone);
      if (resumed) return { skill: resumed.skill || 'find_worker', reply: resumed.message, cardData: resumed };
    } catch (e) {
      console.warn('[Router] resume failed:', e);
    }
  }

  if (phone && q.length <= 80 && !matchCanonicalSkill(q) && !/^(continue|ask the community|keep checking)\b/.test(q)) {
    const followUp = await applyFollowUpSlot(phone, q);
    if (followUp) return followUp;
  }

  if (phone && (/\b(listing|offer)\b/.test(q) || /\b[a-z][a-z-]{1,40}['’]s\b/.test(q))) {
    try {
      const offers = await searchKnownEconomicOffers(query, 3);
      if (offers.length) return { skill: 'product_sourcing', reply: `I found ${offers.length === 1 ? 'a known seller offer' : 'known seller offers'} matching that reference. Choose one to start a single Economic Request.`, cardData: { type: 'agentic_storefront', stage: 'offer_review', skill: 'product_sourcing', title: 'Known seller offers', message: 'Choose a verified seller offer to continue.', knownOffers: offers, escrowProtected: false, progress: 55 } };
    } catch (e) {
      console.warn('[Router] known offer lookup failed:', e);
    }
  }

  const directSkill = matchCanonicalSkill(q);
  if (directSkill && phone) {
    try {
      if (directSkill === 'product_sourcing') {
        const offers = await searchKnownEconomicOffers(query, 3);
        if (offers.length) {
          return {
            skill: directSkill,
            reply: `I found ${offers.length === 1 ? 'one known seller offer' : `${offers.length} known seller offers`} matching that product. Choose one to continue through the existing Economic Request flow.`,
            cardData: { type: 'agentic_storefront', stage: 'offer_review', skill: directSkill, title: 'Known seller offers', message: 'These are verified seller references, not a stock or payment confirmation.', knownOffers: offers, escrowProtected: false, progress: 55 },
          };
        }
      }
      const worker = q.match(/\b(plumber|electrician|mechanic|carpenter|tailor|cleaner|technician|painter|decorator|tiler|roofer|mason|welder)\b/i)?.[1];
      const seed = directSkill === 'find_worker' && worker ? { service: worker } : directSkill === 'product_sourcing' ? { product: query.trim() } : directSkill === 'order_food' && /\b(jollof|fried rice|for\s+\d+)\b/i.test(q) ? extractFollowUpPatch(q, directSkill) : {};
      const card = await startStorefrontSession(phone, directSkill, seed);
      const reply = directSkill === 'product_sourcing' ? `${card.message} I’ll only show a product card when a verified seller reference is available; I will not invent stock, price, or delivery.` : card.message;
      return { skill: directSkill, reply, cardData: decorateCardWithSuggestions(card, directSkill) };
    } catch (e) {
      console.warn('[Router] storefront start failed:', e);
    }
  }

  if (q.includes('price check') || q.includes('market price') || q.includes('how much is')) {
    const result = await delegateToAgentForSkill('price_checker', query, phone);
    if (result.success) return { skill: 'price_check', reply: result.reply };
  }
  if (q.includes('dispute') || q.includes('complain') || q.includes('scam') || q.includes('safety')) {
    const result = await delegateToAgentForSkill('support_triage', query, phone);
    if (result.success) return { skill: 'support_triage', reply: result.reply };
  }

  const classification = classifyWithFastText(query);
  if (classification && ACTION_INTENTS.has(classification.intent)) {
    const flowSkill = skillForIntent(classification.intent);
    const flow = await getSkillFlow(flowSkill).catch(() => null);
    if (phone && STOREFRONT_INTENTS.has(classification.intent)) {
      try {
        const card = await startStorefrontSession(phone, flowSkill, {});
        return { skill: flowSkill, reply: card.message, cardData: card };
      } catch (e) {
        console.warn('[Router] storefront start failed:', e);
      }
    }
    const cardData = decorateCardWithSuggestions(actionCard(classification.intent), flowSkill) || suggestionCard(flowSkill);
    const reply = flowReply(flowSkill, flow);
    return { skill: flowSkill, reply, cardData };
  }

  if (phone && q.split(/\s+/).length <= 6) {
    try {
      const resumed = await tryResumeStorefront(phone);
      if (resumed && ['quote_review', 'fulfillment', 'deferred', 'offer_review', 'delivery_selection', 'seller_handover', 'delivery_in_progress'].includes(resumed.stage)) return { skill: resumed.skill || 'find_worker', reply: resumed.message, cardData: resumed };
    } catch {}
  }

  const ai = await queryUnifiedAI(query, { provider, phone });
  const cardData: any = ai.provider === 'SmolLM2' ? { type: 'ai_metadata', provider: ai.provider, model: ai.model } : undefined;

  const ads = await matchAdCampaigns(query);
  const sponsored = ads.map(ad => ({ title: ad.title, desc: ad.desc, keyword: ad.targetKeyword }));

  if (sponsored.length > 0) {
    const finalCard = cardData || { type: 'intent_suggestions', intent: 'general_question', suggestions: [] };
    finalCard.sponsored = sponsored;
    return { skill: 'general_question', reply: ai.text, cardData: finalCard };
  }

  return { skill: 'general_question', reply: ai.text, cardData };
}

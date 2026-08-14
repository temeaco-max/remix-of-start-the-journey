import { appendChatMessage, listChatMessages } from './chatConversationService.js';
import { getProfile } from './memoryProfile.js';
import { isOnboarding, handleOnboardingInput } from './progressiveOnboarding.js';
import { routeIntent } from './intentRouter.js';
import { getAuthState, setAuthState, handleConversationalAuth } from './conversationalAuthService.js';
import { handleSafetyContactInput, setSafetyCaptureState } from './safetyService.js';
import { createConversationGoal } from './agentRuntime.js';
import { advanceStorefront } from './agenticStorefront.js';
import { getEconomicRequest } from './skillFlows.js';
import type { IntentRoutingResult } from '../types.js';

function parseCardData(row: any): any | null {
  if (!row?.card_data) return null;
  try { return typeof row.card_data === 'string' ? JSON.parse(row.card_data) : row.card_data; } catch { return null; }
}

function extractRequirementPatch(message: string, card: any, current: any): Record<string, unknown> {
  const text = message.trim();
  const fields = Array.isArray(card?.fields) ? card.fields : [];
  const keys = new Set(fields.map((field: any) => String(field?.key || '')));
  const patch: Record<string, unknown> = {};
  const setFirst = (names: string[], value: unknown) => {
    const key = names.find(name => keys.has(name));
    if (key && value !== undefined && value !== '') patch[key] = value;
  };
  if (/\b(cancel|stop|don't want|do not want|no longer need)\b/i.test(text)) return { __cancel: true };
  const budget = text.match(/(?:₦|ngn|naira)\s*([\d,]+)|\b([\d,]+)\s*(?:ngn|naira)\b/i);
  if (budget) setFirst(['budget', 'amount', 'rate', 'price'], (budget[1] || budget[2] || '').replace(/,/g, ''));
  const time = text.match(/\b(today|tonight|tomorrow(?:\s+(?:morning|afternoon|evening|night))?|this\s+weekend|next\s+week|next\s+month|saturday|sunday|monday|tuesday|wednesday|thursday|friday)\b/i);
  if (time) setFirst(['time', 'when', 'departure_time', 'event_date', 'date'], time[1]);
  const fromTo = text.match(/\bfrom\s+(.+?)\s+to\s+(.+?)(?:\s+(?:tomorrow|today|on\s+\w+)|[.!?]|$)/i);
  if (fromTo) {
    setFirst(['origin', 'pickup', 'pickup_location'], fromTo[1].trim());
    setFirst(['destination', 'dropoff', 'dropoff_location'], fromTo[2].trim());
  }
  const location = text.match(/\b(?:in|at|near|around|within)\s+([A-Za-z][A-Za-z .'-]{1,50}?)(?=\s+(?:tomorrow|today|on|for|with|and|,|\.|!|\?|$))/i);
  if (location) setFirst(['location', 'venue', 'city', 'venue_or_city', 'origin'], location[1].trim());
  if (!location && /^[A-Za-z][A-Za-z .'-]{1,40}[.!?]?$/.test(text) && (keys.has('location') || keys.has('city') || keys.has('venue'))) {
    setFirst(['location', 'city', 'venue', 'venue_or_city'], text.replace(/[.!?]+$/, '').trim());
  }
  const service = text.match(/\b(plumb(?:er|ing)?|electri(?:cian|cal)?|paint(?:er|ing)?|decorat(?:or|ing)?|til(?:er|ing)?|roof(?:er|ing)?|mason|welder|mechanic|carpenter|cleaner|tailor|charger|cater(?:ing|er)?|food|ride)\b/i);
  if (service) {
    const raw = service[1].toLowerCase();
    const normalized = raw.startsWith('paint') ? 'painter' : raw.startsWith('plumb') ? 'plumber' : raw.startsWith('electri') ? 'electrician' : raw.startsWith('decorat') ? 'decorator' : raw.startsWith('til') ? 'tiler' : raw.startsWith('roof') ? 'roofer' : raw.startsWith('cater') ? 'catering' : raw;
    setFirst(['service', 'skill', 'job', 'description', 'product'], normalized);
  }
  const currentMissing = fields.filter((field: any) => field?.required && (current?.requirements?.[field.key] == null || String(current.requirements[field.key]).trim() === '')).map((field: any) => field.key);
  if (!Object.keys(patch).length && currentMissing.length === 1 && text.length <= 120) patch[currentMissing[0]] = text.replace(/[.!?]+$/, '').trim();
  return patch;
}

async function continueActiveRequest(phone: string, conversationId: string | undefined, message: string): Promise<{ reply: string; cardData: any; skill: string } | null> {
  if (!conversationId) return null;
  const history = await listChatMessages(phone, { conversationId, limit: 60 });
  for (let i = history.length - 1; i >= 0; i -= 1) {
    const card = parseCardData(history[i]);
    if (!card?.requestId || card.type !== 'agentic_storefront') continue;
    const request = await getEconomicRequest(String(card.requestId));
    if (!request || request.phone !== phone || ['completed', 'cancelled', 'abandoned', 'failed'].includes(request.status)) continue;
    const patch = extractRequirementPatch(message, card, request);
    if (patch.__cancel) {
      const cancelled = await advanceStorefront(phone, request.id, {}, 'cancel');
      return { reply: cancelled.message, cardData: cancelled, skill: request.skill };
    }
    if (!Object.keys(patch).length) return null;
    const updated = await advanceStorefront(phone, request.id, patch, undefined);
    return { reply: updated.message, cardData: updated, skill: request.skill };
  }
  return null;
}

export interface CanonicalChatTurnInput {
  phone: string;
  message: string;
  channel: string;
  conversationId?: string;
  attachment?: unknown;
}

export interface CanonicalChatTurnResult {
  phone: string;
  conversationId: string;
  userMessageId: number;
  reply: string;
  cardData?: any;
  authSuccess?: { phone: string; token: string };
  agentGoal?: { id: string; status: string; objective: string; summary?: string; autonomy?: string; economicRequestId?: string };
  classificationSource?: 'fasttext' | 'rules' | 'fallback';
  intentConfidence?: number;
}

/** The single server-side authority for a Kurukoo conversational turn. */
export async function processCanonicalChatTurn(input: CanonicalChatTurnInput): Promise<CanonicalChatTurnResult> {
  const phone = String(input.phone || '').trim();
  const message = String(input.message || '').trim();
  if (!phone || !message) throw new Error('Phone and message are required');

  const userMessage = await appendChatMessage({
    phone,
    sender: 'user',
    content: message,
    channel: input.channel,
    conversationId: input.conversationId,
    metadata: input.attachment ? { attachment: input.attachment } : undefined,
  });

  let reply = '';
  let cardData: any = undefined;
  let authSuccess: { phone: string; token: string } | undefined;
  let agentGoal: any = null;
  let classificationSource: 'fasttext' | 'rules' | 'fallback' | undefined;
  let intentConfidence: number | undefined;
  const isGuest = phone.startsWith('anon_');
  const authState = isGuest ? await getAuthState(phone) : { state: 'none' as const, data: {} };

  const profile = await getProfile(phone, 'canonical_chat_turn');
  const prefs: any = profile?.preferences && typeof profile.preferences === 'object' ? profile.preferences : {};
  const safetyState = prefs.safety_capture_state || 'none';

  if (isGuest && authState.state !== 'none') {
    const result = await handleConversationalAuth(phone, message);
    reply = result.reply;
    cardData = result.cardData;
    if (result.authenticated && result.token && result.phone) authSuccess = { phone: result.phone, token: result.token };
  } else if (!isGuest && safetyState !== 'none') {
    const result = await handleSafetyContactInput(phone, message);
    reply = result.reply;
    cardData = result.cardData;
  } else if (!isGuest && await isOnboarding(phone)) {
    const result = await handleOnboardingInput(phone, message);
    reply = result.reply;
    cardData = result.cardData;
  } else {
    const continued = await continueActiveRequest(phone, input.conversationId, message);
    const routing: IntentRoutingResult = continued || await routeIntent(message, phone);
    classificationSource = routing.classificationSource;
    intentConfidence = routing.intentConfidence;
    cardData = routing.cardData;
    const explicitAgentIntent = routing.skill === 'autonomous_agent' || /\b(keep checking|keep looking|monitor|watch for|tell me when|let me know when|check again)\b/i.test(message);
    agentGoal = !isGuest && explicitAgentIntent ? await createConversationGoal({
      phone,
      conversationId: userMessage.conversationId,
      skill: routing.skill,
      objective: message,
      economicRequestId: typeof cardData?.requestId === 'string' ? cardData.requestId : undefined,
      source: input.channel === 'web_qr' ? 'qr' : 'conversation',
    }) : null;

    if (routing.skill && routing.skill !== 'general_question' && routing.skill !== 'autonomous_agent' && isGuest) {
      await setAuthState(phone, 'awaiting_name', { intent: routing.skill, continuationCard: cardData });
      reply = `${routing.reply}\n\nI can help with that. Before I save this for you, let's create your Kurukoo profile. What's your name?`;
      cardData = {
        type: 'auth_in_chat_start',
        title: 'Create Your Profile',
        message: 'Your request is captured. Tell me your name to continue.',
        continuationCard: routing.cardData,
      };
    } else {
      // Native assistance remains native. Economic Requests are created and
      // advanced only by canonical request services invoked by the router.
      reply = routing.reply;
    }
  }

  if (cardData?.type === 'safety_contact_capture') {
    await setSafetyCaptureState(phone, 'awaiting_phone', { name: cardData.name });
  }

  return persistTurn({
    userMessage,
    phone,
    channel: input.channel,
    reply,
    cardData,
    authSuccess,
    agentGoal,
    classificationSource,
    intentConfidence,
  });
}

async function persistTurn(args: {
  userMessage: { id: number; conversationId: string };
  phone: string;
  channel: string;
  reply: string;
  cardData?: any;
  authSuccess?: { phone: string; token: string };
  agentGoal?: any;
  classificationSource?: 'fasttext' | 'rules' | 'fallback';
  intentConfidence?: number;
}): Promise<CanonicalChatTurnResult> {
  await appendChatMessage({
    phone: args.phone,
    sender: 'assistant',
    content: args.reply.trim(),
    channel: args.channel,
    conversationId: args.userMessage.conversationId,
    cardData: args.cardData,
    metadata: { ai: true, canonical_turn: true },
  });
  return {
    phone: args.phone,
    conversationId: args.userMessage.conversationId,
    userMessageId: args.userMessage.id,
    reply: args.reply.trim(),
    cardData: args.cardData,
    authSuccess: args.authSuccess,
    agentGoal: args.agentGoal,
    classificationSource: args.classificationSource,
    intentConfidence: args.intentConfidence,
  };
}

export default processCanonicalChatTurn;

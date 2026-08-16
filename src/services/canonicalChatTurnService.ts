import { appendChatMessage, listChatMessages } from './chatConversationService.js';
import { getProfile, recordMemoryFact } from './memoryProfile.js';
import { isOnboarding, handleOnboardingInput } from './progressiveOnboarding.js';
import { routeIntent } from './intentRouter.js';
import { generateConversationalResponse } from './conversationalGenerationService.js';
import { getAuthState, setAuthState, handleConversationalAuth } from './conversationalAuthService.js';
import { handleSafetyContactInput, setSafetyCaptureState } from './safetyService.js';
import { cancelAgentGoal, createConversationGoal, getAgentGoal, goalTimeline, pauseAgentGoal, resumeAgentGoal } from './agentRuntime.js';
import { advanceStorefront, resumeStorefrontFromRequest, tryResumeStorefront } from './agenticStorefront.js';
import { getEconomicRequest } from './skillFlows.js';
import type { IntentRoutingResult } from '../types.js';
import { persistCoordinatorEvent } from './coordinatorStore.js';
import { arbitrateChatContext, type ContextArbitrationDecision } from './contextArbitration.js';
import { getDiscoveryEntity } from './discoveryNetwork.js';
import { getInternalNotificationById } from './pushNotifications.js';

function parseCardData(row: any): any | null {
  if (!row?.card_data) return null;
  try { return typeof row.card_data === 'string' ? JSON.parse(row.card_data) : row.card_data; } catch { return null; }
}

function isNewGuestRequestAfterAuthPrompt(message: string): boolean {
  const text = message.trim();
  if (!text || text.length < 3) return false;
  return /[?]/.test(text) || /^(also\b|please\s+(?:find|help|get|book|arrange|coordinate|source)\b|can you\b|could you\b|would you\b|what\b|how\b|where\b|when\b|why\b|i\s+(?:need|want|would like|am looking|can)|help\b|give me\b|find\b|show\b|compare\b|plan\b|remind\b|get\b|book\b|check\b|someone\b|anyone\b)/i.test(text) || /\b(?:clean|cleaning|housekeeping|house|home|flat|weekend|tomorrow|today)\b/i.test(text);
}

function isStandaloneName(message: string): boolean {
  const text = message.trim();
  return text.length >= 2 && text.length <= 60 && /^[A-Za-z][A-Za-z0-9 .'-]*$/.test(text) && !/\b(?:need|want|find|book|repair|plumber|ride|food|help|remind|compare|plan|venue|service|please|someone|anyone|clean|cleaning|housekeeping|house|home|flat|weekend|tomorrow|today)\b/i.test(text);
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
  if (time) { setFirst(['time', 'when', 'departure_time', 'event_date', 'date'], time[1]); setFirst(['urgency'], time[1]); }
  const device = text.match(/\b(?:it\s+is|it's|this\s+is|for)\s+(?:an?\s+|the\s+)?((?:iphone|ipad|android|samsung|pixel|laptop|computer|tablet|phone|mobile)[a-z0-9 .-]{0,24}?)(?=\s+with\b|\s+that\b|\s+which\b|[,.!?]|$)/i);
  if (device) setFirst(['device_or_asset', 'device', 'asset', 'product'], device[1].trim());
  const fault = text.match(/\bwith\s+(.+?)(?=\.\s*(?:i['’]m|i am|i'm)\b|\s+(?:in|at|near|around|within)\b|\s+and\s+(?:need|want|would)\b|[.!?]|$)/i);
  if (fault) setFirst(['issue', 'fault', 'problem', 'description'], fault[1].trim());
  const correctionField = text.match(/\b(?:change|correct|update|set)\s+(?:the\s+)?(pickup|origin|destination|dropoff|location|venue|service|skill|budget|price)\s+(?:to|as)\s+(.+?)(?:[.!?]|$)/i);
  if (correctionField) {
    const field = correctionField[1].toLowerCase();
    const value = correctionField[2].trim();
    const names = field === 'pickup' || field === 'origin' ? ['origin', 'pickup', 'pickup_location'] : field === 'destination' || field === 'dropoff' ? ['destination', 'dropoff', 'dropoff_location'] : field === 'service' || field === 'skill' ? ['service', 'skill', 'job', 'description'] : field === 'budget' || field === 'price' ? ['budget', 'amount', 'rate', 'price'] : [field];
    setFirst(names, value);
  }
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
  const service = text.match(/\b(plumb(?:er|ing)?|electri(?:cian|cal)?|paint(?:er|ing)?|decorat(?:or|ing)?|til(?:er|ing)?|roof(?:er|ing)?|mason|welder|mechanic|carpenter|cleaner|clean|cleaning|housekeeping|tailor|charger|cater(?:ing|er)?|food|ride)\b/i);
  if (service) {
    const raw = service[1].toLowerCase();
    const normalized = raw.startsWith('paint') ? 'painter' : raw.startsWith('plumb') ? 'plumber' : raw.startsWith('electri') ? 'electrician' : raw.startsWith('clean') || raw.startsWith('housekeep') ? 'house_cleaner' : raw.startsWith('decorat') ? 'decorator' : raw.startsWith('til') ? 'tiler' : raw.startsWith('roof') ? 'roofer' : raw.startsWith('cater') ? 'catering' : raw;
    setFirst(['service', 'skill', 'job', 'description', 'product'], normalized);
  }
  const currentMissing = fields.filter((field: any) => field?.required && (current?.requirements?.[field.key] == null || String(current.requirements[field.key]).trim() === '')).map((field: any) => field.key);
  if (!Object.keys(patch).length && currentMissing.length === 1 && text.length <= 120) patch[currentMissing[0]] = text.replace(/[.!?]+$/, '').trim();
  return patch;
}

async function continueActiveRequest(phone: string, conversationId: string | undefined, message: string, selectedRequestId?: string): Promise<{ reply: string; cardData: any; skill: string } | null> {
  const normalized = message.trim().toLowerCase();
  if (
    /^(remind me|cancel (the )?reminder|remember that|what do you remember|forget that|what notifications|show (my )?notifications|show (my )?reminders|what provider and model)\b/.test(normalized) ||
    /\b(immediate danger|ambulance|fire service|life[- ]threatening|emergency)\b/.test(normalized) ||
    /^(pause|resume|cancel that|cancel it|stop following|stop checking)\b/.test(normalized)
  ) return null;
  if (!conversationId && !selectedRequestId) return null;
  const history = await listChatMessages(phone, selectedRequestId ? { limit: 100 } : { conversationId, limit: 60 });
  const clarificationCard = history.map(row => parseCardData(row)).reverse().find(card => card?.type === 'context_clarification' && typeof card?.ambiguousInput === 'string');
  const effectiveMessage = /^(use (?:it|that) for the current request|apply (?:it|that) to the current request)\b/i.test(message.trim()) && clarificationCard ? String(clarificationCard.ambiguousInput) : message;
  for (let i = history.length - 1; i >= 0; i -= 1) {
    const card = parseCardData(history[i]);
    if (!card?.requestId || card.type !== 'agentic_storefront') continue;
    if (selectedRequestId && String(card.requestId) !== selectedRequestId) continue;
    const request = await getEconomicRequest(String(card.requestId));
    if (!request || request.phone !== phone || ['completed', 'cancelled', 'abandoned', 'failed'].includes(request.status)) continue;
    const patch = extractRequirementPatch(effectiveMessage, card, request);
    if (request.skill === 'find_worker') {
      const workerCorrection = message.match(/\b(plumber|electrician|mechanic|carpenter|tailor|cleaner|clean|cleaning|housekeeping|technician|painter|decorator|tiler|roofer|mason|welder)\b/i)?.[1]?.toLowerCase();
      if (workerCorrection) patch.service = /^(?:clean|housekeep)/i.test(workerCorrection) ? 'house_cleaner' : workerCorrection;
    }
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
  contextAction?: { type: string; entityId?: string; contextId?: string; conversationId?: string; canonicalAction?: string; objectType?: string; objectId?: string };
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
  modelProvider?: string;
  model?: string;
  extractionSource?: 'deterministic' | 'generative' | 'none';
  extractedEntities?: Record<string, unknown>;
  canonicalAction?: string;
  progressStage?: 'processing' | 'understanding' | 'preparing' | 'checking' | 'coordinating' | 'information' | 'safety' | 'coordination' | 'ready' | 'complete';
  latencyMs?: number;
  contextDecision?: ContextArbitrationDecision;
  conversationQualityScore?: number;
  conversationQualityIssues?: string[];
  conversationGenerationEscalated?: boolean;
  conversationGenerationAttempts?: number;
  conversationContextTurns?: number;
}

function shouldUseUniversalConversationOwner(routing: IntentRoutingResult): boolean {
  if (routing.skill !== 'general_question') return false;
  if (routing.canonicalAction) return false;
  if (typeof routing.cardData?.requestId === 'string') return false;
  if (routing.cardData?.type && /(?:economic_request|agentic_storefront|checkout|payment|reminder|notification|safety|provider_profile|seller_offer|topic_draft|events_list|sports_search)/i.test(String(routing.cardData.type))) return false;
  return true;
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
    metadata: input.attachment || input.contextAction ? { attachment: input.attachment, contextAction: input.contextAction } : undefined,
  });

  let reply = '';
  let cardData: any = undefined;
  let authSuccess: { phone: string; token: string } | undefined;
  let agentGoal: any = null;
  let classificationSource: 'fasttext' | 'rules' | 'fallback' | undefined;
  let intentConfidence: number | undefined;
  let modelProvider: string | undefined;
  let model: string | undefined;
  let extractionSource: 'deterministic' | 'generative' | 'none' | undefined;
  let extractedEntities: Record<string, unknown> | undefined;
  let canonicalAction: string | undefined;
  let progressStage: 'processing' | 'understanding' | 'preparing' | 'checking' | 'coordinating' | 'information' | 'safety' | 'coordination' | 'ready' | 'complete' | undefined;
  let conversationQualityScore: number | undefined;
  let conversationQualityIssues: string[] | undefined;
  let conversationGenerationEscalated: boolean | undefined;
  let conversationGenerationAttempts: number | undefined;
  let conversationContextTurns: number | undefined;
  const startedAt = Date.now();
  const isGuest = phone.startsWith('anon_');
  const authState = isGuest ? await getAuthState(phone) : { state: 'none' as const, data: {} };
  const standaloneNameAuth = isGuest && authState.state === 'none' && isStandaloneName(message);

  const profile = await getProfile(phone, 'canonical_chat_turn');
  const prefs: any = profile?.preferences && typeof profile.preferences === 'object' ? profile.preferences : {};
  const safetyState = prefs.safety_capture_state || 'none';
  const explicitDiscoveryEntityId = input.contextAction?.type === 'open_discovery_entity' && input.contextAction.entityId ? String(input.contextAction.entityId) : undefined;
  const explicitDiscoveryEntity = explicitDiscoveryEntityId ? await getDiscoveryEntity(explicitDiscoveryEntityId) : null;
  const continuationAction = input.contextAction?.type === 'resume_canonical_context' ? input.contextAction : null;
  const allowedContinuationPairs = new Set(['agent_goal:agent.goal.resume', 'agent_goal:agent.goal.review', 'economic_request:economic_request.review_match', 'notification:notification.open', 'discovery_entity:discovery.context.open']);
  let continuationObject: any = null;
  const continuationPair = continuationAction?.objectType && continuationAction.canonicalAction ? `${continuationAction.objectType}:${continuationAction.canonicalAction}` : '';
  if (continuationAction && !isGuest && continuationPair && allowedContinuationPairs.has(continuationPair) && continuationAction.objectType && continuationAction.objectId) {
    if (continuationAction.objectType === 'agent_goal') continuationObject = await getAgentGoal(phone, continuationAction.objectId);
    else if (continuationAction.objectType === 'economic_request') {
      const request = await getEconomicRequest(continuationAction.objectId);
      continuationObject = request && request.phone === phone ? request : null;
    } else if (continuationAction.objectType === 'discovery_entity') continuationObject = await getDiscoveryEntity(continuationAction.objectId);
    else if (continuationAction.objectType === 'notification') {
      const notificationId = Number(continuationAction.objectId);
      continuationObject = Number.isSafeInteger(notificationId) && notificationId > 0 ? await getInternalNotificationById(notificationId, phone) : null;
    }
  }
  const contextDecision = isGuest ? undefined : await arbitrateChatContext({ phone, message, conversationId: input.conversationId });

  if (!isGuest && continuationAction) {
    if (!continuationObject || !continuationAction.canonicalAction || !allowedContinuationPairs.has(continuationPair)) {
      reply = 'That exact continuation is no longer available or is not authorized for this account. I have not substituted another request, goal, notification or provider.';
      cardData = { type: 'canonical_context_unavailable', contextId: continuationAction.contextId, objectType: continuationAction.objectType, objectId: continuationAction.objectId, exactContext: true };
      canonicalAction = 'context.continuation.unavailable';
      progressStage = 'information';
    } else {
      reply = 'I have reopened the exact Kurukoo context. I will keep its identity and ownership unchanged while we continue.';
      cardData = { type: 'canonical_context', contextId: continuationAction.contextId, conversationId: continuationAction.conversationId || input.conversationId, canonicalAction: continuationAction.canonicalAction, objectType: continuationAction.objectType, objectId: continuationAction.objectId, lifecycle: continuationObject.status || continuationObject.lifecycle || continuationObject.delivery_state || 'active', exactContext: true, ownerScoped: true };
      canonicalAction = continuationAction.canonicalAction;
      progressStage = 'understanding';
    }
  } else if (!isGuest && explicitDiscoveryEntityId) {
    if (!explicitDiscoveryEntity) {
      reply = 'That discovery context is no longer available, so I have not substituted another place or provider.';
      cardData = { type: 'discovery_context_unavailable', entityId: explicitDiscoveryEntityId };
      canonicalAction = 'discovery.context.unavailable';
      progressStage = 'information';
    } else {
      const status = explicitDiscoveryEntity.verified && explicitDiscoveryEntity.available ? 'available' : explicitDiscoveryEntity.lifecycle;
      reply = `I’ll keep this exact discovery context with our conversation: ${explicitDiscoveryEntity.name}. It is recorded as ${status}, sourced from ${explicitDiscoveryEntity.source}, and its location is approximate. Tell me what you want to do with it.`;
      cardData = { type: 'discovery_context', entityId: explicitDiscoveryEntity.id, entityType: explicitDiscoveryEntity.entityType, lifecycle: status, source: explicitDiscoveryEntity.source, evidenceLevel: explicitDiscoveryEntity.evidenceLevel, approximateLocation: true, exactContext: true };
      canonicalAction = 'discovery.context.open';
      progressStage = 'understanding';
    }
  } else if (!isGuest && contextDecision?.relation === 'clarify' && contextDecision.clarification) {
    reply = contextDecision.clarification;
    cardData = { type: 'context_clarification', selectedContext: contextDecision.selectedContext, preserveContextIds: contextDecision.preserveContextIds, confidence: contextDecision.confidence, ambiguousInput: message, options: ['Use it for the current request', 'Treat it as new information'] };
    progressStage = 'understanding';
  } else if (!isGuest && contextDecision?.selectedContext === 'memory' && /^(treat (?:it|that) as new information|keep (?:it|that) as new information)\b/i.test(message.trim())) {
    const history = await listChatMessages(phone, { conversationId: input.conversationId, limit: 20 });
    const clarification = history.map(row => parseCardData(row)).reverse().find(card => card?.type === 'context_clarification' && typeof card?.ambiguousInput === 'string');
    if (clarification?.ambiguousInput) {
      await recordMemoryFact(phone, 'conversation_context', clarification.ambiguousInput, 'user_declared', { confidence: 0.82, sourceRef: `chat:${input.conversationId || 'current'}:clarification` });
      reply = 'I’ll keep that as information you shared, separate from the current request. You can ask me to forget it later.';
      cardData = { type: 'memory_fact_recorded', field: 'conversation_context', provenance: 'user_declared', sourceConversationId: input.conversationId };
    } else {
      reply = 'I could not find the earlier clarification to store safely, so I have not changed your request or memory.';
      cardData = { type: 'memory_fact_not_recorded', reason: 'clarification_context_not_found' };
    }
    progressStage = 'information';
  } else if (isGuest && (authState.state !== 'none' || standaloneNameAuth) && !((authState.state === 'awaiting_name' || authState.state === 'awaiting_phone' || authState.state === 'awaiting_otp') && isNewGuestRequestAfterAuthPrompt(message))) {
    if (standaloneNameAuth) await setAuthState(phone, 'awaiting_name', {});
    const result = await handleConversationalAuth(phone, message);
    reply = result.reply;
    cardData = result.cardData;
    if (result.authenticated && result.token && result.phone) {
      authSuccess = { phone: result.phone, token: result.token };
      if (!result.cardData) reply = `${result.reply}\n\nWhat would you like to get done today?`;
    }
  } else if (!isGuest && safetyState !== 'none') {
    const result = await handleSafetyContactInput(phone, message);
    reply = result.reply;
    cardData = result.cardData;
  } else if (!isGuest && await isOnboarding(phone)) {
    const result = await handleOnboardingInput(phone, message);
    reply = result.reply;
    cardData = result.cardData;
  } else {
    const controlAction = message.trim().match(/^(?:pause(?: that| it)?|resume(?: that| it)?|cancel(?: that| it)?|stop following|stop checking)\s*$/i)?.[0].toLowerCase() || '';
    if (!isGuest && controlAction) {
      const timeline = await goalTimeline(phone, input.conversationId);
      if (!timeline.goal) {
        if (controlAction.startsWith('cancel')) {
          const routedCancel = await routeIntent(message, phone);
          reply = routedCancel.reply;
          cardData = routedCancel.cardData;
          classificationSource = routedCancel.classificationSource;
          intentConfidence = routedCancel.intentConfidence;
          modelProvider = routedCancel.modelProvider;
          model = routedCancel.model;
          extractionSource = routedCancel.extractionSource;
          extractedEntities = routedCancel.extractedEntities;
          canonicalAction = routedCancel.canonicalAction;
          progressStage = routedCancel.progressStage;
        } else {
          reply = 'There is no active autonomous objective to control in this conversation.';
        }
      } else {
        const updated = controlAction.startsWith('pause') ? await pauseAgentGoal(phone, timeline.goal.id) : controlAction.startsWith('resume') ? await resumeAgentGoal(phone, timeline.goal.id) : await cancelAgentGoal(phone, timeline.goal.id);
        agentGoal = updated;
        reply = updated?.summary || 'The autonomous objective state was updated.';
        progressStage = 'ready';
      }
    } else if (isGuest && authState.state !== 'none' && isNewGuestRequestAfterAuthPrompt(message)) {
      await setAuthState(phone, 'none');
    }
    if (!(!isGuest && controlAction)) {
      const controlCommand = /^(?:pause(?: that| it)?|resume(?: that| it)?|cancel(?: that| it)?|stop following|stop checking)\s*$/i.test(message.trim());
      const contextSwitch = contextDecision && (contextDecision.relation === 'switch' || contextDecision.relation === 'create');
      let continued: { reply: string; cardData: any; skill: string } | null = null;
      if (!controlCommand && !contextSwitch && contextDecision?.relation === 'resume' && contextDecision.selectedContext === 'economic_request') {
        const requestContextId = contextDecision.selectedContextId?.startsWith('request:') ? contextDecision.selectedContextId.slice('request:'.length) : undefined;
        const resumed = requestContextId ? await resumeStorefrontFromRequest(phone, requestContextId) : await tryResumeStorefront(phone);
        if (resumed) continued = { reply: resumed.message, cardData: resumed, skill: resumed.skill };
      } else if (!controlCommand && !contextSwitch) {
        const selectedRequestId = contextDecision?.selectedContextId?.startsWith('request:') ? contextDecision.selectedContextId.slice('request:'.length) : undefined;
        continued = await continueActiveRequest(phone, input.conversationId, message, selectedRequestId);
      }
      const routing: IntentRoutingResult = continued || await routeIntent(message, phone, undefined, contextDecision, input.conversationId);
      classificationSource = routing.classificationSource;
      intentConfidence = routing.intentConfidence;
      modelProvider = routing.modelProvider;
      model = routing.model;
      extractionSource = routing.extractionSource;
      extractedEntities = routing.extractedEntities;
      canonicalAction = routing.canonicalAction;
      progressStage = routing.progressStage;
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
        reply = `${routing.reply}\n\nIf you want Kurukoo to save or continue this request, tell me your name and I’ll take you through sign-in.`;
        cardData = { type: 'auth_conversation', step: 'name', title: 'A quick introduction', message: 'I’m Kurukoo. Tell me your name and I’ll keep this conversation connected while we continue your request.', continuationCard: routing.cardData };
      } else if (shouldUseUniversalConversationOwner(routing)) {
        const history = await listChatMessages(phone, { conversationId: userMessage.conversationId, limit: 12 });
        const priorAssistantReplies = history.filter(row => String(row.sender || '') === 'assistant' && String(row.id || '') !== String(userMessage.id)).slice(-4).map(row => String(row.content || '').trim()).filter(Boolean);
        const activeContextIds = [...(contextDecision?.preserveContextIds || []), contextDecision?.selectedContextId].filter((value): value is string => Boolean(value));
        const pendingFields = Array.isArray(routing.cardData?.fields) ? routing.cardData.fields.filter((field: any) => field?.required).map((field: any) => String(field.key || '')).filter(Boolean).slice(0, 8) : [];
        const knownFacts = [profile?.name ? `name is ${profile.name}` : '', profile?.location ? `usual area is ${profile.location}` : ''].filter(Boolean);
        const generated = await generateConversationalResponse({ prompt: message, phone, threadId: userMessage.conversationId, contextHint: contextDecision ? { selectedContext: contextDecision.selectedContext, relation: contextDecision.relation, confidence: contextDecision.confidence, preserveContextIds: contextDecision.preserveContextIds } : undefined, activeContextIds, knownFacts, pendingFields, priorAssistantReplies });
        reply = generated.text;
        cardData = undefined;
        modelProvider = generated.provider;
        model = generated.model;
        classificationSource = generated.provider === 'Kurukoo Template' ? 'fallback' : classificationSource || 'rules';
        canonicalAction = undefined;
        progressStage = 'complete';
        conversationQualityScore = generated.quality.score;
        conversationQualityIssues = generated.quality.issues;
        conversationGenerationEscalated = generated.escalated;
        conversationGenerationAttempts = generated.attemptCount;
        conversationContextTurns = generated.contextTurns;
      } else {
        reply = routing.reply;
      }
    }
  }

  if (cardData?.type === 'safety_contact_capture') await setSafetyCaptureState(phone, 'awaiting_phone', { name: cardData.name });

  return persistTurn({ userMessage, phone, channel: input.channel, reply, cardData, authSuccess, agentGoal, classificationSource, intentConfidence, modelProvider, model, extractionSource, extractedEntities, canonicalAction, progressStage, latencyMs: Date.now() - startedAt, contextDecision, conversationQualityScore, conversationQualityIssues, conversationGenerationEscalated, conversationGenerationAttempts, conversationContextTurns });
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
  modelProvider?: string;
  model?: string;
  extractionSource?: 'deterministic' | 'generative' | 'none';
  extractedEntities?: Record<string, unknown>;
  canonicalAction?: string;
  progressStage?: 'processing' | 'understanding' | 'preparing' | 'checking' | 'coordinating' | 'information' | 'safety' | 'coordination' | 'ready' | 'complete';
  latencyMs?: number;
  contextDecision?: ContextArbitrationDecision;
  conversationQualityScore?: number;
  conversationQualityIssues?: string[];
  conversationGenerationEscalated?: boolean;
  conversationGenerationAttempts?: number;
  conversationContextTurns?: number;
}): Promise<CanonicalChatTurnResult> {
  await appendChatMessage({
    phone: args.phone,
    sender: 'assistant',
    content: args.reply.trim(),
    channel: args.channel,
    conversationId: args.userMessage.conversationId,
    cardData: args.cardData,
    metadata: {
      ai: true,
      canonical_turn: true,
      conversation_generation_owner: args.conversationQualityScore !== undefined,
      conversation_quality: args.conversationQualityScore !== undefined ? { score: args.conversationQualityScore, issues: args.conversationQualityIssues || [], escalated: Boolean(args.conversationGenerationEscalated), attempts: args.conversationGenerationAttempts, contextTurns: args.conversationContextTurns } : undefined,
      context_decision: args.contextDecision ? { selectedContext: args.contextDecision.selectedContext, relation: args.contextDecision.relation, confidence: args.contextDecision.confidence, ambiguous: args.contextDecision.ambiguous, preserveContextIds: args.contextDecision.preserveContextIds } : undefined,
    },
  });
  await persistCoordinatorEvent({
    id: `chat-turn:${args.userMessage.id}`,
    type: 'chat.turn.completed',
    occurredAt: new Date().toISOString(),
    producer: 'canonicalChatTurnService',
    correlationId: `conversation:${args.userMessage.conversationId}`,
    ownerPhone: args.phone.startsWith('anon_') ? undefined : args.phone,
    economicRequestId: typeof args.cardData?.requestId === 'string' ? args.cardData.requestId : undefined,
    agentGoalId: typeof args.agentGoal?.id === 'string' ? args.agentGoal.id : undefined,
    payload: {
      messageId: args.userMessage.id,
      channel: args.channel,
      classificationSource: args.classificationSource,
      intentConfidence: args.intentConfidence,
      modelProvider: args.modelProvider,
      model: args.model,
      extractionSource: args.extractionSource,
      canonicalAction: args.canonicalAction,
      progressStage: args.progressStage,
      conversationGeneration: args.conversationQualityScore !== undefined ? { owner: 'conversationalGenerationService', score: args.conversationQualityScore, issues: args.conversationQualityIssues || [], escalated: Boolean(args.conversationGenerationEscalated), attempts: args.conversationGenerationAttempts, contextTurns: args.conversationContextTurns } : undefined,
      context: args.contextDecision ? { selectedContext: args.contextDecision.selectedContext, relation: args.contextDecision.relation, confidence: args.contextDecision.confidence, ambiguous: args.contextDecision.ambiguous, preserveContextIds: args.contextDecision.preserveContextIds } : undefined,
      cardType: typeof args.cardData?.type === 'string' ? args.cardData.type : undefined,
      requestId: typeof args.cardData?.requestId === 'string' ? args.cardData.requestId : undefined,
      agentGoalStatus: typeof args.agentGoal?.status === 'string' ? args.agentGoal.status : undefined,
      latencyMs: args.latencyMs,
    },
    sensitivity: args.phone.startsWith('anon_') ? 'public' : 'personal',
    provenance: { source: 'canonical_service', sourceId: String(args.userMessage.id), evidenceLevel: 'persisted_state' },
    policy: { autonomousAllowed: false, confirmationRequired: 'none' },
    schemaVersion: 1,
  });
  return { phone: args.phone, conversationId: args.userMessage.conversationId, userMessageId: args.userMessage.id, reply: args.reply.trim(), cardData: args.cardData, authSuccess: args.authSuccess, agentGoal: args.agentGoal, classificationSource: args.classificationSource, intentConfidence: args.intentConfidence, modelProvider: args.modelProvider, model: args.model, extractionSource: args.extractionSource, extractedEntities: args.extractedEntities, canonicalAction: args.canonicalAction, progressStage: args.progressStage, latencyMs: args.latencyMs, contextDecision: args.contextDecision, conversationQualityScore: args.conversationQualityScore, conversationQualityIssues: args.conversationQualityIssues, conversationGenerationEscalated: args.conversationGenerationEscalated, conversationGenerationAttempts: args.conversationGenerationAttempts, conversationContextTurns: args.conversationContextTurns };
}

export default processCanonicalChatTurn;

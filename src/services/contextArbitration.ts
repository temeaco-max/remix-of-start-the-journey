/* Copyright (c) 2026 temeaco-max. All rights reserved. Proprietary and confidential. */
import { listChatConversations, listChatMessages } from './chatConversationService.js';
import { getProfile } from './memoryProfile.js';
import { detectRelativeReference } from './conversationQualityService.js';

export type ConversationalContextType =
  | 'general'
  | 'onboarding'
  | 'memory'
  | 'safety'
  | 'reminder'
  | 'notification'
  | 'economic_request'
  | 'provider_network'
  | 'product_cart'
  | 'agent_goal'
  | 'topic_switch';

export type ContextTurnRelation =
  | 'answer'
  | 'correction'
  | 'control'
  | 'resume'
  | 'create'
  | 'switch'
  | 'clarify'
  | 'continue';

export interface ActiveContextSummary {
  contextId: string;
  type: ConversationalContextType;
  conversationId?: string;
  state?: string;
  pendingFields?: string[];
  provenance: 'persisted_card' | 'memory_profile' | 'deterministic_signal';
  lastActivity?: string;
}

export interface ContextArbitrationDecision {
  selectedContext: ConversationalContextType;
  selectedContextId?: string;
  relation: ContextTurnRelation;
  confidence: number;
  ambiguous: boolean;
  preserveContextIds: string[];
  activeContexts: ActiveContextSummary[];
  clarification?: string;
  reason: string;
}

const ACTIVE_REQUEST_STATES = new Set([
  'requested', 'awaiting_match', 'partially_matched', 'matched', 'quoting',
  'quoted', 'awaiting_confirmation', 'reserved', 'payment_pending', 'paid', 'in_fulfillment',
]);

function lower(value: string): string { return value.trim().toLowerCase(); }

const KNOWN_LOCATION_NAMES = new Set(['ikeja', 'yaba', 'lagos', 'lekki', 'ajah', 'surulere', 'maryland', 'vi', 'victoria island', 'mainland', 'ibadan', 'abuja', 'port harcourt']);

function isLikelyName(text: string): boolean {
  if (/^(?:hi|hey|hello|hiya|yo|sup|morning|afternoon|evening|good\s+(?:morning|afternoon|evening)|how\s+are\s+you|how're\s+you|how\s+are\s+things)[.!?,\s]*$/i.test(text.trim())) return false;
  if (KNOWN_LOCATION_NAMES.has(lower(text).replace(/[.!?]+$/, ''))) return false;
  return text.length >= 2 && text.length <= 60 && /^[A-Za-z][A-Za-z0-9 .'-]*$/.test(text)
    && !/\b(?:need|want|find|book|repair|plumber|ride|food|help|remind|compare|plan|venue|service|cancel|pause|resume|check|show)\b/i.test(text);
}

function inferType(card: any): ConversationalContextType | null {
  if (!card) return null;
  if (card.type === 'agentic_storefront' && typeof card.requestId === 'string') return 'economic_request';
  if (card.type === 'product' || card.type === 'cart' || card.type === 'checkout') return 'product_cart';
  if (card.type === 'safety_contact_capture' || card.type === 'safety') return 'safety';
  if (card.type === 'reminder') return 'reminder';
  if (card.type === 'notification') return 'notification';
  if (card.type === 'agent_goal' || card.type === 'agentic_goal') return 'agent_goal';
  return null;
}

function parseCard(value: unknown): any | null {
  if (!value) return null;
  try { return typeof value === 'string' ? JSON.parse(value) : value; } catch { return null; }
}

function pendingFieldsFor(card: any): string[] {
  const fields = Array.isArray(card?.fields) ? card.fields : [];
  return fields.filter((field: any) => field?.required).map((field: any) => String(field.key || '')).filter(Boolean);
}

export function isAffirmativeConfirmation(text: string): boolean {
  return /^(?:(?:yes|okay|ok|alright)[, ]+)?(?:go ahead|confirm|approve|do it|proceed)(?:[.!]?|\s+please[.!]?)$|^(?:yes|okay|ok|alright)(?:[.!]?|\s+please[.!]?)$/i.test(text.trim());
}

function signalType(text: string): { type: ConversationalContextType; confidence: number; relation: ContextTurnRelation } | null {
  const value = lower(text);
  if (/\b(?:thinking about|considering|maybe|wondering whether|not sure whether)\b/.test(value)) return null;
  if (/\b(immediate danger|life[- ]threatening|emergency|ambulance|fire service|unsafe|hurt|threat)\b/.test(value)) return { type: 'safety', confidence: 0.99, relation: 'create' };
  if (/^(remember that|remember |what do you remember|forget that|forget )/.test(value)) return { type: 'memory', confidence: 0.98, relation: 'continue' };
  if (/^(remind me|set (?:me )?a reminder|cancel (the )?reminder|show (my )?reminders)/.test(value)) return { type: 'reminder', confidence: 0.97, relation: 'create' };
  // A problem description is exploration, not authorization. It must switch the
  // conversational focus without allowing an active request to claim the turn.
  if (/(?:^|\b)(?:my|the)\s+(?:phone|iphone|android|laptop|computer|screen|device)\s+(?:is\s+)?(?:acting\s+(?:weird|strange)|not\s+working|keeps?\s+going|has\s+been\s+acting)|\b(?:acting\s+(?:weird|strange)|not\s+working|having\s+(?:a\s+)?problem|something\s+is\s+wrong)\b/.test(value) && !/^i\s+(?:need|want)\s+someone\b/.test(value)) return { type: 'topic_switch', confidence: 0.94, relation: 'switch' };
  if (/^(what notifications|show (my )?notifications|mark .* notification|dismiss .* notification)/.test(value)) return { type: 'notification', confidence: 0.97, relation: 'continue' };
  if (/^(?:okay[, ]*)?(go back to|resume (?:my|the)|return to|continue with)\b/.test(value)) return { type: 'economic_request', confidence: 0.9, relation: 'resume' };
  if (/^(use (?:it|that) for the current request|apply (?:it|that) to the current request)\b/.test(value)) return { type: 'economic_request', confidence: 0.96, relation: 'answer' };
  if (/^(treat (?:it|that) as new information|keep (?:it|that) as new information)\b/.test(value)) return { type: 'memory', confidence: 0.96, relation: 'continue' };
  if (/^(change|correct|update|actually|no[, ]|not\b)/.test(value) || /\b(instead|rather)\b/.test(value)) return { type: 'economic_request', confidence: 0.88, relation: 'correction' };
  if (/^(pause|resume|cancel that|cancel it|stop following|stop checking)\b/.test(value)) return { type: 'agent_goal', confidence: 0.98, relation: 'control' };
  if (/\b(cart|checkout|add .* to cart|buy|purchase|product|charger|groceries|food order)\b/.test(value)) return { type: 'product_cart', confidence: 0.82, relation: 'create' };
  if (/\b(keep checking|keep looking|monitor|watch for|tell me when|let me know when|check again)\b/.test(value)) return { type: 'agent_goal', confidence: 0.94, relation: 'create' };
  if (/^(i need|i want|help me|find me|book me|get me|can you find|can you book)\b/.test(value) || /\b(plumber|electrician|mechanic|carpenter|tailor|cleaner|ride|food|groceries)\b/.test(value)) return { type: 'economic_request', confidence: 0.84, relation: 'create' };
  return null;
}

export async function arbitrateChatContext(input: {
  phone: string;
  message: string;
  conversationId?: string;
}): Promise<ContextArbitrationDecision> {
  const text = String(input.message || '').trim();
  const activeContexts: ActiveContextSummary[] = [];
  const profile = await getProfile(input.phone, 'context_arbitration');
  const prefs = profile?.preferences && typeof profile.preferences === 'object' ? profile.preferences as Record<string, any> : {};
  if (prefs.auth_in_chat_state && prefs.auth_in_chat_state !== 'none') activeContexts.push({ contextId: `auth:${input.phone}`, type: 'onboarding', state: String(prefs.auth_in_chat_state), provenance: 'memory_profile' });
  if (prefs.safety_capture_state && prefs.safety_capture_state !== 'none') activeContexts.push({ contextId: `safety:${input.phone}`, type: 'safety', state: String(prefs.safety_capture_state), provenance: 'memory_profile' });

  const conversations = await listChatConversations(input.phone, 8);
  const conversationIds = Array.from(new Set([
    input.conversationId,
    ...conversations.map(conversation => String(conversation.id || '')).filter(Boolean),
  ].filter(Boolean) as string[]));
  for (const conversationId of conversationIds) {
    const history = await listChatMessages(input.phone, { conversationId, limit: 80 });
    for (const row of history.slice().reverse()) {
      const card = parseCard((row as any).card_data);
      const type = inferType(card);
      if (!type) continue;
      const id = type === 'economic_request' ? `request:${String(card.requestId)}` : `${type}:${conversationId}`;
      if (activeContexts.some(context => context.contextId === id)) continue;
      const state = card.status || card.state;
      if (type !== 'economic_request' || !state || ACTIVE_REQUEST_STATES.has(String(state))) {
        activeContexts.push({ contextId: id, type, conversationId, state: state ? String(state) : undefined, pendingFields: pendingFieldsFor(card), provenance: 'persisted_card', lastActivity: String((row as any).created_at || '') });
      }
    }
  }

  const signal = signalType(text);
  const relative = detectRelativeReference(text);
  const request = activeContexts.find(context => context.type === 'economic_request');
  const preserved = activeContexts.map(context => context.contextId);

  if (request && /\b(?:thinking about|considering|maybe|wondering whether|not sure whether)\b/.test(lower(text))) {
    return {
      selectedContext: 'general',
      relation: 'switch',
      confidence: 0.86,
      ambiguous: false,
      preserveContextIds: preserved,
      activeContexts,
      reason: 'Exploratory language remains conversation-only and cannot mutate or continue an active request.'
    };
  }

  if (signal?.type === 'topic_switch' && !request) {
    return {
      selectedContext: 'general',
      relation: 'continue',
      confidence: 0.72,
      ambiguous: false,
      preserveContextIds: preserved,
      activeContexts,
      reason: 'Problem description remains ordinary conversation when no active request needs protection.',
    };
  }

  if (signal?.relation === 'resume') {
    return {
      selectedContext: signal.type,
      selectedContextId: signal.type === 'economic_request' ? request?.contextId : activeContexts.find(context => context.type === signal.type)?.contextId,
      relation: 'resume',
      confidence: signal.confidence,
      ambiguous: false,
      preserveContextIds: preserved.filter(id => id !== request?.contextId),
      activeContexts,
      reason: 'Explicit resume language takes precedence over generic relative-reference detection and targets the owner-scoped request context.',
    };
  }

  if (request && isAffirmativeConfirmation(text)) { return { selectedContext: 'economic_request', selectedContextId: request.contextId, relation: 'answer', confidence: 0.96, ambiguous: false, preserveContextIds: preserved.filter(id => id !== request.contextId), activeContexts, reason: 'Affirmative confirmation is scoped to the current owner-selected economic request before identity-like clarification or generic routing.' }; }

  if (request && /\b(?:the )?(?:cheaper|less expensive|lower[- ]priced|more affordable)\b|\b(?:lower|reduce|cut)\s+(?:the )?price\b/i.test(text)) {
    return {
      selectedContext: 'economic_request',
      selectedContextId: request.contextId,
      relation: 'answer',
      confidence: 0.93,
      ambiguous: false,
      preserveContextIds: preserved.filter(id => id !== request.contextId),
      activeContexts,
      reason: 'Explicit price-comparison language is scoped to the active economic request and does not claim reminder or agent-goal context.',
    };
  }

  if (relative && activeContexts.length > 0) {
    const candidates = activeContexts.filter(context => context.type !== 'onboarding');
    const ordinal = relative.target === 'first' ? 0 : relative.target === 'second' ? 1 : -1;
    const selected = ordinal >= 0 ? candidates[ordinal] : (candidates.length === 1 && (relative.target === 'current' || relative.target === 'previous') ? candidates[0] : undefined);
    if (selected) {
      return {
        selectedContext: selected.type,
        selectedContextId: selected.contextId,
        relation: relative.target === 'previous' ? 'resume' : 'answer',
        confidence: relative.confidence,
        ambiguous: false,
        preserveContextIds: preserved.filter(id => id !== selected.contextId),
        activeContexts,
        reason: 'Relative reference resolved against a single safe or explicit ordinal context; unrelated contexts preserved.',
      };
    }
    return {
      selectedContext: 'topic_switch',
      relation: 'clarify',
      confidence: Math.min(0.65, relative.confidence),
      ambiguous: true,
      preserveContextIds: preserved,
      activeContexts,
      clarification: `I have more than one active context. Which one do you mean by “${relative.target === 'other' ? 'the other one' : 'that one'}”? You can name the request, reminder, safety check-in, notification, or agent task.`,
      reason: 'Relative reference is unsafe to resolve by recency or semantic similarity when multiple active contexts exist.',
    };
  }

  if (signal) {
    const conflictingRequest = request && signal.type !== 'economic_request';
    return {
      selectedContext: signal.type,
      selectedContextId: signal.type === 'economic_request' && signal.relation !== 'create' ? request?.contextId : activeContexts.find(context => context.type === signal.type)?.contextId,
      relation: conflictingRequest ? 'switch' : signal.relation,
      confidence: signal.confidence,
      ambiguous: false,
      preserveContextIds: preserved,
      activeContexts,
      reason: conflictingRequest ? 'Explicit higher-priority context signal; unrelated active request preserved.' : 'Explicit deterministic context signal.',
    };
  }

  if (request && isLikelyName(text) && request.pendingFields?.some(field => /location|city|venue|origin|pickup|destination/i.test(field))) {
    return {
      selectedContext: 'topic_switch',
      selectedContextId: request.contextId,
      relation: 'clarify',
      confidence: 0.55,
      ambiguous: true,
      preserveContextIds: preserved,
      activeContexts,
      clarification: `I can keep the ${request.state === 'deferred' ? 'open ' : ''}request safe. Is “${text}” a person’s name, or should I use it as the location for this request?`,
      reason: 'Short identity-like input conflicts with a pending location field; clarification prevents request corruption.',
    };
  }

  if (request) {
    return {
      selectedContext: 'economic_request',
      selectedContextId: request.contextId,
      relation: 'answer',
      confidence: request.pendingFields?.length ? 0.72 : 0.61,
      ambiguous: false,
      preserveContextIds: preserved.filter(id => id !== request.contextId),
      activeContexts,
      reason: 'No higher-priority context signal; continue the owner-scoped active request.',
    };
  }

  return {
    selectedContext: 'general',
    relation: 'continue',
    confidence: 0.5,
    ambiguous: false,
    preserveContextIds: preserved,
    activeContexts,
    reason: 'No active context or deterministic switch signal was found.',
  };
}

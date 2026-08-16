export interface ConversationQualityContext {
  latestUserMessage: string;
  assistantReply: string;
  activeContextIds?: string[];
  selectedContextId?: string;
  relation?: string;
  canonicalAction?: string;
  cardType?: string;
  knownFacts?: string[];
  pendingFields?: string[];
  priorAssistantReplies?: string[];
}

export type ConversationQualityIssue =
  | 'empty_response'
  | 'internal_metadata_leak'
  | 'repetition'
  | 'asks_known_fact'
  | 'premature_action'
  | 'context_drop'
  | 'overloaded_questions'
  | 'template_language';

export interface ConversationQualityAssessment {
  score: number;
  issues: ConversationQualityIssue[];
  repairable: boolean;
  conversational: boolean;
  preservedContext: boolean;
}

const INTERNAL_PATTERNS = [
  /\b(?:system prompt|internal conversation orientation|living memory|memory_facts|stable:|episodic:|open_intention|recent_tail)\b/i,
  /\b(?:intent|classification|confidence|route|routing|canonical service|model provider)\s*[:=]/i,
];

const GENERIC_TEMPLATE_PATTERNS = [
  /^(?:I(?:'m| am) here (?:with you|and ready to help))\.?$/i,
  /^Tell me a little more about what you mean\.?$/i,
  /^I(?:'m| am) here and ready to help\.?$/i,
  /^I can help (?:with|coordinate) (?:that|this)\.?$/i,
  /^I(?:'m| am) ready\.? Tell me what (?:you need|you'd like)\.?$/i,
];

const ACTION_LANGUAGE = /\b(?:book|order|hire|find someone|arrange|schedule|pay|cancel|subscribe|dispatch|send|confirm|create|set a reminder)\b/i;
const EXPLORATORY_LANGUAGE = /\b(?:thinking about|maybe|might|could|wondering|what do you think|tell me about|how does|what(?:'s| is) a good)\b/i;

function normalize(value: string): string {
  return String(value || '').toLowerCase().replace(/[^a-z0-9\s]/g, ' ').replace(/\s+/g, ' ').trim();
}

function tokenSet(value: string): Set<string> {
  return new Set(normalize(value).split(' ').filter(token => token.length > 2));
}

function overlap(a: string, b: string): number {
  const left = tokenSet(a);
  const right = tokenSet(b);
  if (!left.size || !right.size) return 0;
  let common = 0;
  for (const token of left) if (right.has(token)) common += 1;
  return common / Math.max(1, Math.min(left.size, right.size));
}

function asksForKnownFact(reply: string, facts: string[]): boolean {
  if (!facts.length) return false;
  const text = normalize(reply);
  return facts.some(fact => {
    const value = normalize(fact);
    if (!value) return false;
    const probes = value.split(' ').filter(part => part.length > 3);
    if (!probes.length) return false;
    return probes.some(part => new RegExp(`\\b(?:what|which|where|when|what is|tell me)\\b[^?]{0,80}\\b${part.replace(/[.*+?^${}()|[\\]\\\\]/g, '\\$&')}\\b`, 'i').test(text));
  });
}

/**
 * Cheap, deterministic post-generation guard. It does not own routing, memory,
 * Economic Requests, or actions. It only evaluates whether a natural-language
 * response appears consistent with the canonical conversational context.
 */
export function assessConversationQuality(context: ConversationQualityContext): ConversationQualityAssessment {
  const reply = String(context.assistantReply || '').trim();
  const user = String(context.latestUserMessage || '').trim();
  const issues: ConversationQualityIssue[] = [];
  let score = 1;

  if (!reply) {
    issues.push('empty_response');
    score -= 0.7;
  }

  if (INTERNAL_PATTERNS.some(pattern => pattern.test(reply))) {
    issues.push('internal_metadata_leak');
    score -= 0.65;
  }

  const normalizedReply = normalize(reply);
  const repeated = normalizedReply.length > 20 && (context.priorAssistantReplies || []).some(previous => overlap(reply, previous) >= 0.9);
  if (repeated) {
    issues.push('repetition');
    score -= 0.3;
  }

  if (asksForKnownFact(reply, context.knownFacts || [])) {
    issues.push('asks_known_fact');
    score -= 0.35;
  }

  const exploratory = EXPLORATORY_LANGUAGE.test(user) && !ACTION_LANGUAGE.test(user);
  if (exploratory && context.cardType && /(?:economic_request|agentic_storefront|checkout|payment|subscription)/i.test(context.cardType)) {
    issues.push('premature_action');
    score -= 0.55;
  }

  const active = context.activeContextIds || [];
  if (active.length > 0 && context.selectedContextId && !active.includes(context.selectedContextId)) {
    issues.push('context_drop');
    score -= 0.65;
  }

  const questionCount = (reply.match(/\?/g) || []).length;
  if (questionCount > 2) {
    issues.push('overloaded_questions');
    score -= 0.2;
  }

  if (GENERIC_TEMPLATE_PATTERNS.some(pattern => pattern.test(reply)) && !ACTION_LANGUAGE.test(user)) {
    issues.push('template_language');
    score -= 0.12;
  }

  const preservedContext = !issues.includes('context_drop') && (!context.selectedContextId || active.includes(context.selectedContextId));
  score = Math.max(0, Math.min(1, score));
  const repairable = issues.some(issue => ['empty_response', 'internal_metadata_leak', 'repetition', 'asks_known_fact', 'overloaded_questions', 'template_language'].includes(issue));

  return {
    score,
    issues,
    repairable,
    conversational: score >= 0.72 && !issues.includes('internal_metadata_leak'),
    preservedContext,
  };
}

export interface RelativeReferenceResolution {
  reference: string;
  target: 'current' | 'previous' | 'second' | 'first' | 'other' | 'unknown';
  confidence: number;
}

/** Deterministic hints for arbitration; never mutates canonical state. */
export function detectRelativeReference(message: string): RelativeReferenceResolution | null {
  const text = normalize(message);
  if (/\b(?:that one|this one|same one|that guy|that person|that place|same place|same thing)\b/.test(text)) return { reference: message, target: 'current', confidence: 0.84 };
  if (/\b(?:the other|other guy|other one|different one)\b/.test(text)) return { reference: message, target: 'other', confidence: 0.88 };
  if (/\b(?:the second|number two|option 2|2nd)\b/.test(text)) return { reference: message, target: 'second', confidence: 0.92 };
  if (/\b(?:the first|number one|option 1|1st)\b/.test(text)) return { reference: message, target: 'first', confidence: 0.92 };
  if (/\b(?:earlier|previous|before|go back to)\b/.test(text)) return { reference: message, target: 'previous', confidence: 0.86 };
  return null;
}

export function classifyConversationDifficulty(message: string, context?: Pick<ConversationQualityContext, 'activeContextIds' | 'knownFacts' | 'pendingFields'>): 'simple' | 'normal' | 'complex' | 'deep' {
  const text = String(message || '').trim();
  const words = text.split(/\s+/).filter(Boolean).length;
  const references = detectRelativeReference(text) !== null;
  const contexts = context?.activeContextIds?.length || 0;
  const pending = context?.pendingFields?.length || 0;
  const correction = /\b(?:actually|instead|forget that|wait|no|change|correct|not that|go back|resume)\b/i.test(text);
  const multiPart = /[.!?].+[.!?]/s.test(text);
  if (references && contexts > 1 || correction && (contexts > 0 || pending > 0) || words > 60 || contexts > 2) return 'deep';
  if (references || correction || contexts > 1 || multiPart || words > 35) return 'complex';
  if (pending > 0 || words > 15 || /\b(?:why|how|compare|explain|maybe|could)\b/i.test(text)) return 'normal';
  return 'simple';
}

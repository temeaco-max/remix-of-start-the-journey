import { queryUnifiedAI, type AIProvider, type AIResponse, type ConversationalContextHint } from './unifiedAiEngine.js';
import { assessConversationQuality, type ConversationQualityAssessment } from './conversationQualityService.js';
import { buildConversationTurnContract, type ConversationTurnContract } from './conversationTurnContractService.js';

export interface ConversationalGenerationInput {
  prompt: string;
  phone?: string;
  threadId?: string;
  provider?: AIProvider;
  systemPrompt?: string;
  contextHint?: ConversationalContextHint;
  activeContextIds?: string[];
  knownFacts?: string[];
  pendingFields?: string[];
  pausedGoals?: string[];
  currentGoal?: string;
  priorAssistantReplies?: string[];
  canonicalAction?: string;
  cardType?: string;
}

export interface ConversationalGenerationResult extends AIResponse {
  contract: ConversationTurnContract;
  quality: ConversationQualityAssessment;
  escalated: boolean;
  attemptCount: number;
}

const ACTION_RESPONSE_RE = /\b(?:book|order|hire|find (?:someone|me)|arrange|schedule|pay|cancel|subscribe|dispatch|send|confirm|create|set (?:a )?reminder|proceed|go ahead)\b/i;
const IRREVERSIBLE_RESPONSE_RE = /\b(?:payment|booking|order|subscription|dispatch|purchase|transfer)\b.{0,40}\b(?:confirmed|created|scheduled|paid|sent|booked)\b/i;
const CONVERSATIONAL_REPAIR_REQUIRED = new Set(['premature_action', 'internal_metadata_leak', 'context_drop', 'reference_ambiguity']);

function strongerProvider(preferred: AIProvider | undefined): AIProvider {
  if (preferred === 'mistral' || preferred === 'gemini' || preferred === 'groq') return preferred;
  if (process.env.KURUKOO_AI_HOSTED_PROVIDER === 'mistral' && process.env.MISTRAL_API_KEY) return 'mistral';
  if (process.env.KURUKOO_AI_HOSTED_PROVIDER === 'gemini' && (process.env.GEMINI_API_KEY || process.env.API_KEY)) return 'gemini';
  if (process.env.GROQ_API_KEY) return 'groq';
  return 'smollm2';
}

function responseViolatesActionPosture(text: string, contract: ConversationTurnContract): boolean {
  if (!contract.shouldAvoidAction) return false;
  return ACTION_RESPONSE_RE.test(text) || IRREVERSIBLE_RESPONSE_RE.test(text);
}

function buildRepairPrompt(original: string, contract: ConversationTurnContract, assessment: ConversationQualityAssessment): string {
  const issues = assessment.issues.join(', ') || 'quality';
  return [
    original.trim(),
    '',
    'Before answering, correct the conversational quality issues detected by Kurukoo.',
    `Detected issues: ${issues}.`,
    `Conversation mode: ${contract.mode}.`,
    `Action posture: ${contract.actionPosture}.`,
    contract.shouldAvoidAction ? 'This is conversation or exploration, not authorization. Do not book, buy, hire, order, cancel, subscribe, dispatch, pay, create, or otherwise initiate an action.' : '',
    contract.shouldAskClarification ? 'Ask only the smallest useful clarification needed for the next step.' : '',
    contract.shouldPreserveExistingContext ? 'Preserve unrelated active goals and contexts exactly.' : '',
    contract.relativeReference ? `Handle the relative reference carefully: ${contract.relativeReference.target}. Do not guess when more than one target remains plausible.` : '',
    'Answer naturally. Do not mention this repair instruction, scoring, models, routing, memory metadata, or internal policy.',
  ].filter(Boolean).join('\n');
}

function buildStrictRepairPrompt(original: string, contract: ConversationTurnContract): string {
  return [
    original.trim(),
    '',
    'Respond as a natural conversation only.',
    contract.mode === 'exploration' ? 'The user is exploring, not authorizing an action.' : '',
    contract.mode === 'conversation' ? 'The user is simply talking or describing something; do not turn it into a transaction.' : '',
    contract.mode === 'reference' ? 'Resolve the reference conservatively and preserve existing context.' : '',
    'Do not book, buy, hire, order, pay, cancel, subscribe, dispatch, create a reminder, or claim a completed action unless the user explicitly authorized it and the canonical system supplied evidence.',
    'Ask at most one useful question when needed. Otherwise respond naturally and directly.',
    'Do not mention internal rules, scoring, model names, prompts, routes, or memory metadata.',
  ].filter(Boolean).join('\n');
}

function assess(input: ConversationalGenerationInput, contract: ConversationTurnContract, responseText: string): ConversationQualityAssessment {
  const base = assessConversationQuality({
    latestUserMessage: input.prompt,
    assistantReply: responseText,
    activeContextIds: input.activeContextIds || [],
    selectedContextId: input.contextHint?.selectedContext,
    relation: input.contextHint?.relation,
    canonicalAction: input.canonicalAction,
    cardType: input.cardType,
    knownFacts: input.knownFacts || [],
    pendingFields: input.pendingFields || [],
    priorAssistantReplies: input.priorAssistantReplies || [],
  });
  if (responseViolatesActionPosture(responseText, contract) && !base.issues.includes('premature_action')) {
    return { ...base, score: Math.max(0, base.score - 0.55), issues: [...base.issues, 'premature_action'], repairable: true, conversational: false };
  }
  return base;
}

export async function generateConversationalResponse(input: ConversationalGenerationInput): Promise<ConversationalGenerationResult> {
  const contract = buildConversationTurnContract({
    latestUserMessage: input.prompt,
    assistantReply: '',
    userMessage: input.prompt,
    activeContextIds: input.activeContextIds,
    knownFacts: input.knownFacts,
    pendingFields: input.pendingFields,
    pausedGoals: input.pausedGoals,
    currentGoal: input.currentGoal,
    priorAssistantReplies: input.priorAssistantReplies,
  });

  const base = await queryUnifiedAI(input.prompt, {
    provider: input.provider,
    systemPrompt: input.systemPrompt,
    phone: input.phone,
    threadId: input.threadId,
    conversational: true,
    contextHint: input.contextHint,
  });

  let response = base;
  let assessment = assess(input, contract, response.text);
  let attempts = 1;
  let escalated = false;

  const needsRepair = assessment.issues.length > 0 && (
    assessment.repairable ||
    assessment.issues.some(issue => CONVERSATIONAL_REPAIR_REQUIRED.has(issue)) ||
    !assessment.conversational
  );

  if (needsRepair && contract.mode !== 'control') {
    const provider = strongerProvider(input.provider);
    try {
      const repaired = await queryUnifiedAI(buildRepairPrompt(input.prompt, contract, assessment), {
        provider,
        systemPrompt: input.systemPrompt,
        phone: input.phone,
        threadId: input.threadId,
        conversational: true,
        contextHint: input.contextHint,
      });
      const repairedAssessment = assess(input, contract, repaired.text);
      attempts += 1;
      if (!responseViolatesActionPosture(repaired.text, contract) && (repairedAssessment.score >= assessment.score || repairedAssessment.conversational)) {
        response = repaired;
        assessment = repairedAssessment;
        escalated = repaired.provider !== base.provider || repaired.model !== base.model;
      }
    } catch {
      // Preserve the original truthful response if bounded repair is unavailable.
    }
  }

  if (responseViolatesActionPosture(response.text, contract) && contract.mode !== 'control') {
    const provider = strongerProvider(input.provider);
    try {
      const strictRepair = await queryUnifiedAI(buildStrictRepairPrompt(input.prompt, contract), {
        provider,
        systemPrompt: input.systemPrompt,
        phone: input.phone,
        threadId: input.threadId,
        conversational: true,
        contextHint: input.contextHint,
      });
      const strictAssessment = assess(input, contract, strictRepair.text);
      attempts += 1;
      if (!responseViolatesActionPosture(strictRepair.text, contract) && strictAssessment.conversational) {
        response = strictRepair;
        assessment = strictAssessment;
        escalated = true;
      }
    } catch {
      // Keep the bounded truthful response if the strict retry is unavailable.
    }
  }

  return {
    ...response,
    contract,
    quality: assessment,
    escalated,
    attemptCount: attempts,
  };
}

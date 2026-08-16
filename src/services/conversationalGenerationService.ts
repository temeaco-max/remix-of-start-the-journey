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

function strongerProvider(preferred: AIProvider | undefined): AIProvider {
  if (preferred === 'mistral' || preferred === 'gemini' || preferred === 'groq') return preferred;
  if (process.env.KURUKOO_AI_HOSTED_PROVIDER === 'mistral' && process.env.MISTRAL_API_KEY) return 'mistral';
  if (process.env.KURUKOO_AI_HOSTED_PROVIDER === 'gemini' && (process.env.GEMINI_API_KEY || process.env.API_KEY)) return 'gemini';
  if (process.env.GROQ_API_KEY) return 'groq';
  return 'smollm2';
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
    contract.shouldAvoidAction ? 'Do not initiate an action from this turn unless the user explicitly authorizes it.' : '',
    contract.shouldAskClarification ? 'Ask only the smallest useful clarification needed for the next step.' : '',
    contract.shouldPreserveExistingContext ? 'Preserve unrelated active goals/contexts exactly.' : '',
    'Answer naturally. Do not mention this repair instruction, scoring, models, routing, memory metadata, or internal policy.',
  ].filter(Boolean).join('\n');
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
  let assessment = assessConversationQuality({
    latestUserMessage: input.prompt,
    assistantReply: response.text,
    activeContextIds: input.activeContextIds || [],
    selectedContextId: input.contextHint?.selectedContext,
    relation: input.contextHint?.relation,
    canonicalAction: input.canonicalAction,
    cardType: input.cardType,
    knownFacts: input.knownFacts || [],
    pendingFields: input.pendingFields || [],
    priorAssistantReplies: input.priorAssistantReplies || [],
  });

  let attempts = 1;
  let escalated = false;
  const shouldRepair = assessment.repairable && !contract.shouldAvoidAction && assessment.issues.length > 0;

  if (shouldRepair || (!assessment.conversational && contract.mode !== 'control' && !contract.shouldAvoidAction)) {
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
      const repairedAssessment = assessConversationQuality({
        latestUserMessage: input.prompt,
        assistantReply: repaired.text,
        activeContextIds: input.activeContextIds || [],
        selectedContextId: input.contextHint?.selectedContext,
        relation: input.contextHint?.relation,
        canonicalAction: input.canonicalAction,
        cardType: input.cardType,
        knownFacts: input.knownFacts || [],
        pendingFields: input.pendingFields || [],
        priorAssistantReplies: input.priorAssistantReplies || [],
      });
      attempts += 1;
      if (repairedAssessment.score >= assessment.score || repairedAssessment.conversational) {
        response = repaired;
        assessment = repairedAssessment;
        escalated = repaired.provider !== base.provider || repaired.model !== base.model;
      }
    } catch {
      // Preserve the original truthful response if bounded repair is unavailable.
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

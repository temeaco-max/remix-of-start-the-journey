import {
  assessConversationQuality,
  classifyConversationDifficulty,
  detectRelativeReference,
  type ConversationQualityContext,
  type ConversationQualityAssessment,
} from './conversationQualityService.js';

export type ConversationMode = 'conversation' | 'exploration' | 'action' | 'reference' | 'clarification' | 'control';
export type ModelTier = 'local' | 'compact' | 'strong';

export interface ConversationIntelligenceInput extends ConversationQualityContext {
  userMessage: string;
  activeGoals?: string[];
  pausedGoals?: string[];
  pendingFields?: string[];
  currentGoal?: string;
  userHasExplicitlyAuthorizedAction?: boolean;
}

export interface ConversationIntelligenceDecision {
  mode: ConversationMode;
  modelTier: ModelTier;
  difficulty: ReturnType<typeof classifyConversationDifficulty>;
  relativeReference: ReturnType<typeof detectRelativeReference>;
  quality: ConversationQualityAssessment;
  shouldGenerateNaturalResponse: boolean;
  shouldRequireCanonicalAction: boolean;
  shouldAvoidAction: boolean;
  shouldAskClarification: boolean;
  shouldPreserveExistingContext: boolean;
  shouldEscalateModel: boolean;
  reasons: string[];
}

const EXPLORATION_RE = /\b(?:thinking about|maybe|might|wondering|what do you think|what would you do|tell me about|how does|what(?:'s| is) a good|considering)\b/i;
const EXPLICIT_ACTION_RE = /\b(?:please|go ahead|do it|handle it|book|buy|order|hire|arrange|schedule|pay|cancel|subscribe|dispatch|send|confirm|set (?:a )?reminder|find me|find someone)\b/i;
const CLARIFICATION_RE = /\?$|\b(?:what do you need|what information|which one|which option|where|when|how much|what kind)\b/i;
const CONTROL_RE = /^(?:pause|resume|cancel|stop|forget|continue|go back)(?:\s|$)/i;

function countWords(value: string): number {
  return value.trim().split(/\s+/).filter(Boolean).length;
}

function determineMode(input: ConversationIntelligenceInput): ConversationMode {
  const text = input.userMessage.trim();
  const relative = detectRelativeReference(text);
  if (CONTROL_RE.test(text)) return 'control';
  if (relative) return 'reference';
  if (EXPLICIT_ACTION_RE.test(text) && !EXPLORATION_RE.test(text)) return 'action';
  if (CLARIFICATION_RE.test(text) && !EXPLICIT_ACTION_RE.test(text)) return 'clarification';
  if (EXPLORATION_RE.test(text)) return 'exploration';
  return 'conversation';
}

/**
 * Shared, read-only conversational decision boundary.
 * It intentionally does not route, mutate state, call tools, or create actions.
 * It tells the canonical model layer how demanding a turn is and whether it
 * should preserve a current conversation before any action is considered.
 */
export function decideConversationIntelligence(input: ConversationIntelligenceInput): ConversationIntelligenceDecision {
  const quality = assessConversationQuality(input);
  const difficulty = classifyConversationDifficulty(input.userMessage, {
    activeContextIds: input.activeContextIds,
    knownFacts: input.knownFacts,
    pendingFields: input.pendingFields,
  });
  const relativeReference = detectRelativeReference(input.userMessage);
  const mode = determineMode(input);
  const activeCount = input.activeContextIds?.length || 0;
  const pausedCount = input.pausedGoals?.length || 0;
  const words = countWords(input.userMessage);

  const reasons: string[] = [];
  const shouldPreserveExistingContext = Boolean(
    input.currentGoal || activeCount > 0 || pausedCount > 0 || relativeReference || difficulty === 'deep',
  );

  const shouldRequireCanonicalAction = mode === 'action' || mode === 'control';
  const shouldAvoidAction = mode === 'conversation' || mode === 'exploration' || mode === 'clarification';
  const shouldAskClarification = mode === 'clarification' || (mode === 'action' && (input.pendingFields?.length || 0) > 0);
  const shouldGenerateNaturalResponse = mode !== 'control' || !input.userHasExplicitlyAuthorizedAction;

  let modelTier: ModelTier = 'local';
  if (difficulty === 'normal') modelTier = 'compact';
  if (difficulty === 'complex' || difficulty === 'deep' || activeCount > 1 || pausedCount > 0) modelTier = 'strong';
  if (mode === 'action' && shouldAskClarification) modelTier = 'compact';
  if (mode === 'reference' && activeCount > 1) modelTier = 'strong';

  const shouldEscalateModel = modelTier === 'strong' || !quality.conversational || difficulty === 'deep';

  if (relativeReference) reasons.push(`relative_reference:${relativeReference.target}`);
  if (activeCount > 1) reasons.push('multiple_active_contexts');
  if (pausedCount > 0) reasons.push('paused_goal_present');
  if (input.pendingFields?.length) reasons.push('pending_fields');
  if (EXPLORATION_RE.test(input.userMessage)) reasons.push('exploratory_language');
  if (EXPLICIT_ACTION_RE.test(input.userMessage)) reasons.push('explicit_action_language');
  if (words > 35) reasons.push('long_turn');
  if (!quality.conversational) reasons.push(`quality_below_threshold:${quality.score.toFixed(2)}`);

  return {
    mode,
    modelTier,
    difficulty,
    relativeReference,
    quality,
    shouldGenerateNaturalResponse,
    shouldRequireCanonicalAction,
    shouldAvoidAction,
    shouldAskClarification,
    shouldPreserveExistingContext,
    shouldEscalateModel,
    reasons,
  };
}

export default decideConversationIntelligence;

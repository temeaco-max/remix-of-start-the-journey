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
  requiresStructuredProposal: boolean;
  requiresContextReconciliation: boolean;
  reasons: string[];
}

const EXPLORATION_RE = /\b(?:thinking about|maybe|might|might need|wondering|what do you think|what would you do|tell me about|how does|what(?:'s| is) a good|considering|looking into|not sure (?:about|whether)|could use|could probably use)\b/i;
const PROBLEM_STATEMENT_RE = /\b(?:acting weird|acting strange|something(?:'s| is) wrong|something is off|not working|isn't working|is not working|keeps (?:restarting|stopping|freezing|making)|making (?:a |an )?(?:weird|strange|funny) noise|having (?:an )?issue|having trouble|can't figure out|cannot figure out|stopped working|started acting|won't charge|won't turn on|won't start|screen keeps)\b/i;
const EXPLICIT_ACTION_RE = /^(?:please\s+)?(?:find|find me|book|buy|order|hire|arrange|schedule|pay|cancel|subscribe|dispatch|send|confirm|create|set (?:a )?reminder|go ahead|do it|handle it)\b|\b(?:go ahead and|please find|please book|please order|please hire|please arrange)\b/i;
const ACTION_WITH_OBJECT_RE = /\b(?:find|book|buy|order|hire|arrange|schedule|pay|cancel|subscribe|dispatch|send|confirm|create|set)\b.{0,80}\b(?:it|that|one|someone|someone to|me)\b/i;
const CLARIFICATION_RE = /\?$|\b(?:what do you need|what information|which one|which option|where|when|how much|what kind|what sort|can you explain|why)\b/i;
const CONTROL_RE = /^(?:pause|resume|cancel|stop|forget|continue|go back)(?:\s|$)/i;
const CASUAL_RE = /^(?:hi|hello|hey|good morning|good afternoon|good evening|how are you|what's up|thanks|thank you|good night|lol|haha)\b/i;
const IDENTITY_INTRO_RE = /^(?:my name is|i(?:'m| am) called|call me|you can call me)\s+[A-Za-z][A-Za-z0-9 .'-]{1,58}[.!?]?$/i;
const CONTEXT_PIVOT_RE = /^(?:actually|by the way|btw|on another (?:thing|topic)|different question|separately|unrelated|forget that|never mind|hold on|wait|also|one more thing)\b/i;
const RESUMPTION_RE = /^(?:back to|back on|returning to|go back to|continue with|let(?:'s|s) continue|where were we with|about the .* again)\b/i;

function countWords(value: string): number {
  return value.trim().split(/\s+/).filter(Boolean).length;
}

function hasExplicitAction(text: string): boolean {
  if (EXPLORATION_RE.test(text) || PROBLEM_STATEMENT_RE.test(text) || IDENTITY_INTRO_RE.test(text) || CONTEXT_PIVOT_RE.test(text)) return false;
  return EXPLICIT_ACTION_RE.test(text) || ACTION_WITH_OBJECT_RE.test(text);
}

function determineMode(input: ConversationIntelligenceInput): ConversationMode {
  const text = input.userMessage.trim();
  const relative = detectRelativeReference(text);
  if (CONTROL_RE.test(text)) return 'control';
  if (relative || RESUMPTION_RE.test(text)) return 'reference';
  if (IDENTITY_INTRO_RE.test(text)) return 'conversation';
  if (CASUAL_RE.test(text)) return 'conversation';
  if (CONTEXT_PIVOT_RE.test(text) && !hasExplicitAction(text)) return 'conversation';
  if (CLARIFICATION_RE.test(text) && !hasExplicitAction(text)) return 'clarification';
  if (EXPLORATION_RE.test(text) || PROBLEM_STATEMENT_RE.test(text)) return 'exploration';
  if (hasExplicitAction(text)) return 'action';
  return 'conversation';
}

/**
 * Shared, read-only conversational decision boundary.
 * It does not route, mutate state, call tools, or create actions. It gives the
 * canonical model layer a bounded view of conversational difficulty, intent
 * posture, identity introductions, context pivots and the protections that
 * must survive before any action is proposed.
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
  const explicitAction = hasExplicitAction(input.userMessage);
  const identityIntro = IDENTITY_INTRO_RE.test(input.userMessage.trim());
  const contextPivot = CONTEXT_PIVOT_RE.test(input.userMessage.trim());
  const resumption = RESUMPTION_RE.test(input.userMessage.trim());

  const reasons: string[] = [];
  const shouldPreserveExistingContext = Boolean(
    input.currentGoal || activeCount > 0 || pausedCount > 0 || relativeReference || difficulty === 'deep' || contextPivot || resumption,
  );

  const shouldAvoidAction = mode === 'conversation' || mode === 'exploration' || mode === 'clarification';
  const shouldRequireCanonicalAction = mode === 'action' || mode === 'control';
  const shouldAskClarification = mode === 'clarification' || (mode === 'action' && (input.pendingFields?.length || 0) > 0);
  const requiresContextReconciliation = Boolean(relativeReference || resumption || activeCount > 1 || pausedCount > 0 || difficulty === 'deep' || contextPivot);
  const requiresStructuredProposal = shouldRequireCanonicalAction && !shouldAvoidAction;
  const shouldGenerateNaturalResponse = !shouldRequireCanonicalAction || !input.userHasExplicitlyAuthorizedAction;

  let modelTier: ModelTier = 'local';
  if (mode === 'conversation' || mode === 'exploration') modelTier = words > 20 ? 'compact' : 'local';
  if (difficulty === 'normal') modelTier = 'compact';
  if (difficulty === 'complex' || difficulty === 'deep' || activeCount > 1 || pausedCount > 0) modelTier = 'strong';
  if (mode === 'action' && shouldAskClarification) modelTier = 'compact';
  if (mode === 'reference' && activeCount > 1) modelTier = 'strong';
  if (CASUAL_RE.test(input.userMessage) || identityIntro) modelTier = 'local';
  if (resumption && activeCount > 0) modelTier = 'compact';
  if (contextPivot && activeCount > 0) modelTier = 'compact';

  const shouldEscalateModel = modelTier === 'strong' || !quality.conversational || difficulty === 'deep' || (contextPivot && activeCount > 1);

  if (relativeReference) reasons.push(`relative_reference:${relativeReference.target}`);
  if (activeCount > 1) reasons.push('multiple_active_contexts');
  if (pausedCount > 0) reasons.push('paused_goal_present');
  if (input.pendingFields?.length) reasons.push('pending_fields');
  if (EXPLORATION_RE.test(input.userMessage)) reasons.push('exploratory_language');
  if (PROBLEM_STATEMENT_RE.test(input.userMessage)) reasons.push('problem_statement_without_action');
  if (explicitAction) reasons.push('explicit_action_language');
  if (identityIntro) reasons.push('identity_introduction');
  if (contextPivot) reasons.push('context_pivot');
  if (resumption) reasons.push('explicit_resumption');
  if (!shouldAvoidAction) reasons.push('action_capable_turn');
  if (requiresContextReconciliation) reasons.push('context_reconciliation_required');
  if (requiresStructuredProposal) reasons.push('structured_proposal_required');
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
    requiresStructuredProposal,
    requiresContextReconciliation,
    reasons,
  };
}

export default decideConversationIntelligence;

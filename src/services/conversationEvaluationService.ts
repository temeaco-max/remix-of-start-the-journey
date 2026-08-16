import { assessConversationQuality, classifyConversationDifficulty, detectRelativeReference } from './conversationQualityService.js';
import { buildConversationTurnContract } from './conversationTurnContractService.js';

export interface ConversationEvaluationTurn {
  user: string;
  assistant: string;
  activeContextIds?: string[];
  selectedContextId?: string;
  knownFacts?: string[];
  pendingFields?: string[];
  priorAssistantReplies?: string[];
  canonicalAction?: string;
  cardType?: string;
  expectedMode?: 'conversation' | 'exploration' | 'action' | 'reference' | 'clarification' | 'control';
  expectedAction?: boolean;
}

export interface ConversationEvaluationResult {
  turns: number;
  overallScore: number;
  naturalnessScore: number;
  contextScore: number;
  actionDisciplineScore: number;
  referenceScore: number;
  recoveryScore: number;
  failures: Array<{
    turn: number;
    type: string;
    message: string;
  }>;
}

const ACTION_LANGUAGE = /\b(?:book|order|hire|find (?:someone|me)|arrange|schedule|pay|cancel|subscribe|dispatch|send|confirm|create|set (?:a )?reminder|go ahead|do it)\b/i;
const IRREVERSIBLE_RESULT = /\b(?:payment|booking|order|subscription|dispatch|purchase|transfer)\b.{0,50}\b(?:confirmed|created|scheduled|paid|sent|booked|completed)\b/i;

export function evaluateConversationTrajectory(turns: ConversationEvaluationTurn[]): ConversationEvaluationResult {
  const failures: ConversationEvaluationResult['failures'] = [];
  if (!turns.length) {
    return {
      turns: 0,
      overallScore: 0,
      naturalnessScore: 0,
      contextScore: 0,
      actionDisciplineScore: 0,
      referenceScore: 0,
      recoveryScore: 0,
      failures: [{ turn: 0, type: 'empty_trajectory', message: 'No conversation turns supplied.' }],
    };
  }

  let naturalness = 0;
  let context = 0;
  let actionDiscipline = 0;
  let reference = 0;
  let recovery = 0;

  turns.forEach((turn, index) => {
    const contract = buildConversationTurnContract({
      userMessage: turn.user,
      latestUserMessage: turn.user,
      assistantReply: turn.assistant,
      activeContextIds: turn.activeContextIds,
      knownFacts: turn.knownFacts,
      pendingFields: turn.pendingFields,
      priorAssistantReplies: turn.priorAssistantReplies,
      currentGoal: turn.selectedContextId,
    });
    const quality = assessConversationQuality({
      latestUserMessage: turn.user,
      assistantReply: turn.assistant,
      activeContextIds: turn.activeContextIds,
      selectedContextId: turn.selectedContextId,
      knownFacts: turn.knownFacts,
      pendingFields: turn.pendingFields,
      priorAssistantReplies: turn.priorAssistantReplies,
      canonicalAction: turn.canonicalAction,
      cardType: turn.cardType,
    });

    naturalness += quality.conversational ? quality.score : quality.score * 0.5;
    if (quality.issues.length) {
      for (const issue of quality.issues) failures.push({ turn: index + 1, type: issue, message: `Conversational quality issue: ${issue}.` });
    }

    const expectedMode = turn.expectedMode || contract.mode;
    if (expectedMode === contract.mode) context += 1;
    else failures.push({ turn: index + 1, type: 'mode_mismatch', message: `Expected ${expectedMode}, received ${contract.mode}.` });

    const proposedAction = ACTION_LANGUAGE.test(turn.assistant) || IRREVERSIBLE_RESULT.test(turn.assistant);
    const actionAllowed = turn.expectedAction ?? contract.shouldRequireCanonicalAction;
    if (actionAllowed || !proposedAction) actionDiscipline += 1;
    else failures.push({ turn: index + 1, type: 'premature_action', message: 'Assistant language implies an action on a turn that does not authorize one.' });

    const detectedReference = detectRelativeReference(turn.user);
    if (!detectedReference) {
      reference += 1;
    } else if (contract.relativeReference?.target === detectedReference.target || contract.requiresContextReconciliation) {
      reference += 1;
    } else {
      failures.push({ turn: index + 1, type: 'reference_resolution', message: `Reference ${detectedReference.target} was not reconciled safely.` });
    }

    const difficulty = classifyConversationDifficulty(turn.user, {
      activeContextIds: turn.activeContextIds,
      knownFacts: turn.knownFacts,
      pendingFields: turn.pendingFields,
    });
    if (difficulty === 'deep' && !contract.shouldPreserveExistingContext) {
      failures.push({ turn: index + 1, type: 'context_preservation', message: 'Deep conversational turn did not preserve existing context.' });
    } else {
      recovery += 1;
    }
  });

  const denominator = Math.max(1, turns.length);
  const naturalnessScore = naturalness / denominator;
  const contextScore = context / denominator;
  const actionDisciplineScore = actionDiscipline / denominator;
  const referenceScore = reference / denominator;
  const recoveryScore = recovery / denominator;
  const overallScore = (naturalnessScore + contextScore + actionDisciplineScore + referenceScore + recoveryScore) / 5;

  return {
    turns: turns.length,
    overallScore,
    naturalnessScore,
    contextScore,
    actionDisciplineScore,
    referenceScore,
    recoveryScore,
    failures,
  };
}

export default evaluateConversationTrajectory;

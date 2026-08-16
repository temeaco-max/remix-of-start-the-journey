import {
  decideConversationIntelligence,
  type ConversationIntelligenceDecision,
  type ConversationIntelligenceInput,
} from './conversationIntelligenceService.js';

export type ConversationActionPosture = 'none' | 'propose' | 'clarify' | 'control';
export type ConversationRetryReason =
  | 'none'
  | 'quality'
  | 'context'
  | 'premature_action'
  | 'internal_leak'
  | 'reference_ambiguity'
  | 'model_failure';

export interface ConversationGoalState {
  currentGoal?: string;
  activeGoals: string[];
  pausedGoals: string[];
  unresolvedFields: string[];
  preserveGoalContext: boolean;
}

export interface ConversationTurnContract extends ConversationIntelligenceDecision {
  actionPosture: ConversationActionPosture;
  retryReason: ConversationRetryReason;
  protectedContextIds: string[];
  protectedGoalIds: string[];
  goalState: ConversationGoalState;
  responseRequirements: string[];
  modelInstructions: string[];
}

function unique(values: Array<string | undefined | null>): string[] {
  return [...new Set(values.filter((value): value is string => Boolean(value && value.trim())).map(value => value.trim()))];
}

function buildResponseRequirements(
  decision: ConversationIntelligenceDecision,
  goalState: ConversationGoalState,
): string[] {
  const requirements: string[] = [
    'Answer the latest user turn first.',
    'Do not invent external state or evidence.',
    'Do not expose internal routing, memory, model, or policy metadata.',
  ];

  if (decision.shouldPreserveExistingContext) requirements.push('Preserve all unrelated active contexts and do not overwrite them.');
  if (goalState.preserveGoalContext) requirements.push('Preserve the current goal unless the user explicitly changes, pauses, cancels, or abandons it.');
  if (goalState.unresolvedFields.length) requirements.push(`Known unresolved goal fields: ${goalState.unresolvedFields.join(', ')}. Do not ask for a field already supplied. Do not invent missing values.`);
  if (decision.shouldAvoidAction) requirements.push('Do not initiate an irreversible or economic action from conversational exploration alone.');
  if (decision.shouldAskClarification) requirements.push('Ask the smallest useful clarification question and avoid re-asking known facts.');
  if (decision.relativeReference) requirements.push(`Resolve the relative reference cautiously: ${decision.relativeReference.target}. Ask before acting when the target is not uniquely identified.`);
  if (decision.requiresStructuredProposal) requirements.push('Any action proposal must map to an existing canonical capability and retain exact object/context identity.');
  if (decision.requiresContextReconciliation) requirements.push('Reconcile the selected context against active and paused contexts before proposing an action.');
  if (decision.modelTier === 'strong') requirements.push('Prefer deeper context handling over shortcut classification for this turn.');

  return unique(requirements);
}

function buildModelInstructions(
  decision: ConversationIntelligenceDecision,
  goalState: ConversationGoalState,
): string[] {
  const instructions: string[] = [];
  if (decision.mode === 'conversation') instructions.push('Stay conversational unless the user explicitly asks to act.');
  if (decision.mode === 'exploration') instructions.push('Help the user explore options without treating exploration as authorization.');
  if (decision.mode === 'reference') instructions.push('Resolve the reference against canonical context; never substitute a merely recent object.');
  if (decision.mode === 'clarification') instructions.push('Clarify only the unresolved point that blocks a useful next step.');
  if (decision.mode === 'control') instructions.push('Treat control language as an explicit request to affect an existing goal/request only after canonical identity validation.');
  if (goalState.currentGoal) instructions.push(`Current goal: ${goalState.currentGoal}`);
  if (goalState.activeGoals.length > 1) instructions.push(`Multiple active goals exist (${goalState.activeGoals.length}); keep them distinct and preserve identity.`);
  if (goalState.pausedGoals.length) instructions.push(`There are ${goalState.pausedGoals.length} paused goals; do not resume one merely because it is older or more recent.`);
  if (decision.shouldEscalateModel) instructions.push('Use the strongest available conversational model permitted by the current policy and quota.');
  return unique(instructions);
}

function inferActionPosture(decision: ConversationIntelligenceDecision): ConversationActionPosture {
  if (decision.mode === 'control') return 'control';
  if (decision.shouldAskClarification) return 'clarify';
  if (decision.shouldRequireCanonicalAction) return 'propose';
  return 'none';
}

function inferRetryReason(decision: ConversationIntelligenceDecision): ConversationRetryReason {
  if (decision.quality.issues.includes('internal_metadata_leak')) return 'internal_leak';
  if (decision.quality.issues.includes('context_drop')) return 'context';
  if (decision.quality.issues.includes('premature_action')) return 'premature_action';
  if (decision.relativeReference && decision.relativeReference.confidence < 0.75) return 'reference_ambiguity';
  if (!decision.quality.conversational) return 'quality';
  return 'none';
}

export function buildConversationTurnContract(input: ConversationIntelligenceInput): ConversationTurnContract {
  const decision = decideConversationIntelligence(input);
  const protectedContextIds = unique(input.activeContextIds || []);
  const protectedGoalIds = unique(input.pausedGoals || []);
  if (input.currentGoal) protectedGoalIds.push(input.currentGoal);

  const activeGoals = unique(input.activeGoals || (input.currentGoal ? [input.currentGoal] : []));
  const pausedGoals = unique(input.pausedGoals || []);
  const unresolvedFields = unique(input.pendingFields || []);
  const goalState: ConversationGoalState = {
    currentGoal: input.currentGoal?.trim() || undefined,
    activeGoals,
    pausedGoals,
    unresolvedFields,
    preserveGoalContext: Boolean(input.currentGoal || activeGoals.length || pausedGoals.length),
  };

  return {
    ...decision,
    actionPosture: inferActionPosture(decision),
    retryReason: inferRetryReason(decision),
    protectedContextIds: unique(protectedContextIds),
    protectedGoalIds: unique(protectedGoalIds),
    goalState,
    responseRequirements: buildResponseRequirements(decision, goalState),
    modelInstructions: buildModelInstructions(decision, goalState),
  } as ConversationTurnContract;
}

export function buildConversationalSystemDirective(contract: ConversationTurnContract): string {
  const lines = [
    'Kurukoo conversational contract:',
    `mode=${contract.mode}`,
    `model_tier=${contract.modelTier}`,
    `action_posture=${contract.actionPosture}`,
    contract.protectedContextIds.length ? `protected_context_count=${contract.protectedContextIds.length}` : '',
    contract.protectedGoalIds.length ? `protected_goal_count=${contract.protectedGoalIds.length}` : '',
    contract.goalState.currentGoal ? `current_goal=${contract.goalState.currentGoal}` : '',
    contract.goalState.activeGoals.length ? `active_goal_count=${contract.goalState.activeGoals.length}` : '',
    contract.goalState.pausedGoals.length ? `paused_goal_count=${contract.goalState.pausedGoals.length}` : '',
    contract.goalState.unresolvedFields.length ? `unresolved_fields=${contract.goalState.unresolvedFields.join(',')}` : '',
    ...contract.responseRequirements.map(item => `requirement=${item}`),
    ...contract.modelInstructions.map(item => `instruction=${item}`),
  ].filter(Boolean);

  return lines.join('\n');
}

export function shouldRetryConversationalGeneration(contract: ConversationTurnContract): boolean {
  return contract.retryReason !== 'none' && contract.retryReason !== 'premature_action';
}

export function shouldBlockGeneratedAction(contract: ConversationTurnContract): boolean {
  return contract.shouldAvoidAction || contract.actionPosture === 'clarify' || contract.retryReason === 'context' || contract.retryReason === 'reference_ambiguity';
}

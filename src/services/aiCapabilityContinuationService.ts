export type CapabilityOutcomeStatus =
  | 'accepted'
  | 'needs_user'
  | 'confirmation_required'
  | 'waiting'
  | 'in_progress'
  | 'completed'
  | 'blocked'
  | 'failed'
  | 'external_unavailable'
  | 'stale_context'
  | 'unauthorized'
  | 'invalid';

export interface CapabilityOutcomeForConversation {
  capability: string;
  action?: string;
  status: CapabilityOutcomeStatus;
  contextId?: string;
  canonicalObjectId?: string;
  facts: Record<string, unknown>;
  evidenceLevel?: string;
  evidenceRefs?: string[];
  nextActions?: Array<{ capability: string; action: string; label?: string; requiresConfirmation?: boolean }>;
  recoveryActions?: Array<{ capability: string; action: string; label?: string }>;
  continuation: {
    preserveContext: boolean;
    resumeContextId?: string;
    userAttentionRequired: boolean;
  };
  externalActivation?: 'active' | 'configuration_required' | 'unavailable' | 'not_applicable';
}

export interface CapabilityConversationGuidance {
  tone: 'natural' | 'urgent' | 'confirming' | 'waiting' | 'recovery';
  instruction: string;
  mustNotClaim: string[];
  preferredNextStep?: string;
}

export interface CanonicalOutcomeLike {
  capability?: string;
  action?: string;
  status?: string;
  contextId?: string;
  canonicalObjectId?: string;
  canonicalFacts?: Record<string, unknown>;
  evidenceLevel?: string;
  evidenceRefs?: string[];
  nextActions?: Array<{ action?: string; capability?: string; label?: string; confirmationRequired?: boolean; requiresConfirmation?: boolean }>;
  retryRecovery?: Array<{ action?: string; capability?: string; label?: string }>;
  continuationContext?: Record<string, unknown>;
  externalActivation?: string;
  message?: string;
}

function normalizeStatus(status: unknown): CapabilityOutcomeStatus {
  const value = String(status || 'accepted').toLowerCase();
  if (value === 'in_progress') return 'in_progress';
  if (value === 'externally_pending') return 'waiting';
  if (value === 'unavailable_external_dependency') return 'external_unavailable';
  if (value === 'external_unavailable') return 'external_unavailable';
  if (value === 'confirmation_required') return 'confirmation_required';
  if (value === 'needs_user') return 'needs_user';
  if (value === 'waiting') return 'waiting';
  if (value === 'completed') return 'completed';
  if (value === 'blocked') return 'blocked';
  if (value === 'failed') return 'failed';
  if (value === 'stale_context') return 'stale_context';
  if (value === 'unauthorized') return 'unauthorized';
  if (value === 'invalid') return 'invalid';
  return 'accepted';
}

function normalizeExternalActivation(value: unknown): CapabilityOutcomeForConversation['externalActivation'] {
  switch (String(value || '').toLowerCase()) {
    case 'active':
    case 'locally_available':
      return 'active';
    case 'configuration_required':
    case 'repository_ready_external_activation':
      return 'configuration_required';
    case 'unavailable':
    case 'unavailable_external_dependency':
      return 'unavailable';
    default:
      return 'not_applicable';
  }
}

/**
 * Normalises a canonical execution result into the facts the conversational
 * layer needs. This is intentionally presentation-neutral: the model may
 * explain the result, but it cannot change its status, identity or evidence.
 */
export function buildCapabilityOutcomeForConversation(input: {
  capability: string;
  action?: string;
  status: CapabilityOutcomeStatus;
  contextId?: string;
  canonicalObjectId?: string;
  facts?: Record<string, unknown>;
  evidenceLevel?: string;
  evidenceRefs?: string[];
  nextActions?: CapabilityOutcomeForConversation['nextActions'];
  recoveryActions?: CapabilityOutcomeForConversation['recoveryActions'];
  preserveContext?: boolean;
  userAttentionRequired?: boolean;
  externalActivation?: CapabilityOutcomeForConversation['externalActivation'];
}): CapabilityOutcomeForConversation {
  return {
    capability: input.capability,
    action: input.action,
    status: input.status,
    contextId: input.contextId,
    canonicalObjectId: input.canonicalObjectId,
    facts: { ...(input.facts || {}) },
    evidenceLevel: input.evidenceLevel,
    evidenceRefs: [...(input.evidenceRefs || [])],
    nextActions: [...(input.nextActions || [])],
    recoveryActions: [...(input.recoveryActions || [])],
    continuation: {
      preserveContext: input.preserveContext !== false,
      resumeContextId: input.contextId,
      userAttentionRequired: Boolean(input.userAttentionRequired),
    },
    externalActivation: input.externalActivation || 'not_applicable',
  };
}

/** Convert the canonical executor's result shape directly into conversation state. */
export function buildCapabilityOutcomeFromCanonicalResult(input: CanonicalOutcomeLike): CapabilityOutcomeForConversation {
  const nextActions = (Array.isArray(input.nextActions) ? input.nextActions : []).map(action => ({
    capability: String(action.capability || input.capability || ''),
    action: String(action.action || 'continue'),
    label: action.label,
    requiresConfirmation: Boolean(action.requiresConfirmation ?? action.confirmationRequired),
  }));
  const recoveryActions = (Array.isArray(input.retryRecovery) ? input.retryRecovery : []).map(action => ({
    capability: String(action.capability || input.capability || ''),
    action: String(action.action || 'retry'),
    label: action.label,
  }));
  const continuation = input.continuationContext || {};
  const status = normalizeStatus(input.status);
  return buildCapabilityOutcomeForConversation({
    capability: String(input.capability || ''),
    action: input.action,
    status,
    contextId: input.contextId || (typeof continuation.contextId === 'string' ? continuation.contextId : undefined),
    canonicalObjectId: input.canonicalObjectId || (typeof continuation.canonicalObjectId === 'string' ? continuation.canonicalObjectId : undefined),
    facts: input.canonicalFacts || {},
    evidenceLevel: input.evidenceLevel,
    evidenceRefs: input.evidenceRefs,
    nextActions,
    recoveryActions,
    preserveContext: continuation.ownerScoped !== false,
    userAttentionRequired: status === 'needs_user' || status === 'confirmation_required' || status === 'external_unavailable' || status === 'stale_context' || status === 'unauthorized',
    externalActivation: normalizeExternalActivation(input.externalActivation),
  });
}

/**
 * Produces bounded guidance for the conversational model from canonical facts.
 * The model may phrase the result naturally but must not reinterpret the
 * canonical outcome, identity, evidence level or external activation state.
 */
export function buildCapabilityConversationGuidance(outcome: CapabilityOutcomeForConversation): CapabilityConversationGuidance {
  const mustNotClaim = [
    'Do not claim a provider, payment, delivery, dispatch, connection, completion, or evidence that is not present in the canonical outcome.',
    'Do not change the canonical object, context, lifecycle or status.',
  ];

  switch (outcome.status) {
    case 'completed':
      return { tone: 'natural', instruction: 'Explain plainly what Kurukoo completed. Use only canonical facts and evidence. Then offer the most useful next step, if one exists.', mustNotClaim, preferredNextStep: outcome.nextActions?.[0]?.label };
    case 'confirmation_required':
      return { tone: 'confirming', instruction: 'Explain what exact action is awaiting confirmation. Do not imply that the action has happened. Ask for a clear confirmation or offer cancellation.', mustNotClaim, preferredNextStep: outcome.nextActions?.find(action => action.requiresConfirmation)?.label || 'Confirm the exact action' };
    case 'waiting':
    case 'in_progress':
      return { tone: 'waiting', instruction: 'Tell the user what is currently waiting or in progress without inventing external progress. Preserve the exact context and explain how they can continue or wait.', mustNotClaim, preferredNextStep: outcome.nextActions?.[0]?.label };
    case 'needs_user':
      return { tone: 'natural', instruction: 'Ask only for the smallest missing information needed by the canonical capability. Do not restart the whole workflow or ask for facts already present.', mustNotClaim, preferredNextStep: outcome.nextActions?.[0]?.label };
    case 'blocked':
    case 'external_unavailable':
    case 'unauthorized':
    case 'stale_context':
    case 'invalid':
    case 'failed':
      return { tone: outcome.status === 'failed' ? 'recovery' : 'natural', instruction: 'Explain the actual boundary or failure succinctly, preserve the user\'s goal, and offer the available recovery or next step. Never substitute a different object or silently start a new request.', mustNotClaim, preferredNextStep: outcome.recoveryActions?.[0]?.label || outcome.nextActions?.[0]?.label };
    case 'accepted':
      return { tone: 'natural', instruction: 'Explain that the action has been accepted by the canonical service, but distinguish acceptance from external completion and do not overstate progress.', mustNotClaim, preferredNextStep: outcome.nextActions?.[0]?.label };
  }
}

/** Stable prompt-ready representation for any canonical result, excluding internal ids beyond what the continuation layer needs. */
export function buildCapabilityConversationContext(outcome: CapabilityOutcomeForConversation): string {
  return [
    `capability=${outcome.capability}`,
    outcome.action ? `action=${outcome.action}` : '',
    `status=${outcome.status}`,
    outcome.canonicalObjectId ? `canonical_object_id=${outcome.canonicalObjectId}` : '',
    outcome.contextId ? `context_id=${outcome.contextId}` : '',
    `external_activation=${outcome.externalActivation || 'not_applicable'}`,
    outcome.evidenceLevel ? `evidence_level=${outcome.evidenceLevel}` : '',
    outcome.facts && Object.keys(outcome.facts).length ? `facts=${JSON.stringify(outcome.facts)}` : '',
    outcome.nextActions?.length ? `next_actions=${JSON.stringify(outcome.nextActions)}` : '',
    outcome.recoveryActions?.length ? `recovery_actions=${JSON.stringify(outcome.recoveryActions)}` : '',
    outcome.continuation.preserveContext ? 'preserve_context=true' : 'preserve_context=false',
  ].filter(Boolean).join('\n');
}

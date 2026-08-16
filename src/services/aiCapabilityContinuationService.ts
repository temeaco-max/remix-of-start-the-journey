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

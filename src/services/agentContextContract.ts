import { arbitrateChatContext, type ActiveContextSummary, type ContextTurnRelation, type ConversationalContextType } from './contextArbitration.js';
import { getProfile } from './memoryProfile.js';

export interface AgentContextEnvelope {
  ownerPhone: string;
  conversationId?: string;
  turn: string;
  selectedContext: ConversationalContextType;
  selectedContextId?: string;
  relation: ContextTurnRelation;
  confidence: number;
  ambiguous: boolean;
  preserveContextIds: string[];
  activeContexts: ActiveContextSummary[];
  memorySummary?: Record<string, unknown>;
  clarification?: string;
}

/**
 * Canonical context envelope for Agent reasoning. It composes the existing
 * context-arbitration and Memory owners and intentionally contains no prompt
 * or model output. It is data for the Agent; it grants no execution authority.
 */
export async function buildAgentContextEnvelope(input: {
  phone: string;
  conversationId?: string;
  message: string;
}): Promise<AgentContextEnvelope> {
  const decision = await arbitrateChatContext({ phone: input.phone, conversationId: input.conversationId, message: input.message });
  const profile = await getProfile(input.phone, 'agent_context');
  const preferences = profile?.preferences && typeof profile.preferences === 'object'
    ? profile.preferences as Record<string, unknown>
    : {};

  const safeMemorySummary: Record<string, unknown> = {};
  for (const key of ['name', 'usual_area', 'country', 'response_style', 'reminder_time', 'quiet_hours', 'interruption_sensitivity']) {
    if (preferences[key] !== undefined && preferences[key] !== null) safeMemorySummary[key] = preferences[key];
  }

  return {
    ownerPhone: input.phone,
    conversationId: input.conversationId,
    turn: input.message,
    selectedContext: decision.selectedContext,
    selectedContextId: decision.selectedContextId,
    relation: decision.relation,
    confidence: decision.confidence,
    ambiguous: decision.ambiguous,
    preserveContextIds: decision.preserveContextIds,
    activeContexts: decision.activeContexts,
    memorySummary: Object.keys(safeMemorySummary).length ? safeMemorySummary : undefined,
    clarification: decision.clarification,
  };
}

import type { IntentRoutingResult } from '../types.js';
import type { ConversationTurnContract } from './conversationTurnContractService.js';

export type CapabilityProposalPosture = 'none' | 'clarify' | 'propose' | 'control';

export interface AICapabilityProposal {
  capability: string;
  action?: string;
  contextId?: string;
  canonicalObjectId?: string;
  arguments: Record<string, unknown>;
  confidence?: number;
  posture: CapabilityProposalPosture;
  confirmationRequired: boolean;
  preserveContext: boolean;
  requiresCanonicalValidation: true;
  source: 'canonical-routing';
}

export interface AICapabilityOrchestrationDecision {
  mode: ConversationTurnContract['mode'];
  shouldTalk: boolean;
  shouldPresentCanonicalResult: boolean;
  shouldProposeCapability: boolean;
  proposal?: AICapabilityProposal;
  reason: string;
}

const NON_CAPABILITY_SKILLS = new Set([
  'general_question',
]);

function normaliseCapability(skill?: string, targetSkill?: string): string | undefined {
  const value = String(targetSkill || skill || '').trim();
  return value && !NON_CAPABILITY_SKILLS.has(value) ? value : undefined;
}

function inferPosture(contract: ConversationTurnContract): CapabilityProposalPosture {
  if (contract.actionPosture === 'control') return 'control';
  if (contract.shouldAskClarification) return 'clarify';
  if (contract.shouldRequireCanonicalAction) return 'propose';
  return 'none';
}

/**
 * Translates an already-canonical routing result into a bounded AI proposal.
 * This is deliberately read-only: it never executes, mutates state, resolves
 * ownership, or replaces the canonical Chat action boundary.
 */
export function buildAICapabilityOrchestration(
  routing: IntentRoutingResult,
  contract: ConversationTurnContract,
): AICapabilityOrchestrationDecision {
  const capability = normaliseCapability(routing.skill, routing.target_skill);
  const posture = inferPosture(contract);
  const shouldPresentCanonicalResult = Boolean(routing.cardData && typeof routing.cardData === 'object' && routing.skill !== 'general_question');
  const shouldProposeCapability = Boolean(capability && posture !== 'none' && contract.requiresStructuredProposal);

  if (!capability || NON_CAPABILITY_SKILLS.has(routing.skill)) {
    return {
      mode: contract.mode,
      shouldTalk: true,
      shouldPresentCanonicalResult,
      shouldProposeCapability: false,
      reason: 'ordinary-conversation-or-non-capability-turn',
    };
  }

  const proposal: AICapabilityProposal = {
    capability,
    action: routing.canonicalAction,
    contextId: contract.protectedContextIds[0],
    canonicalObjectId: contract.protectedContextIds[0],
    arguments: { ...(routing.extractedEntities || {}) },
    confidence: routing.intentConfidence,
    posture,
    confirmationRequired: contract.actionPosture === 'control' || contract.shouldRequireCanonicalAction,
    preserveContext: contract.shouldPreserveExistingContext,
    requiresCanonicalValidation: true,
    source: 'canonical-routing',
  };

  return {
    mode: contract.mode,
    shouldTalk: contract.shouldGenerateNaturalResponse,
    shouldPresentCanonicalResult,
    shouldProposeCapability,
    proposal: shouldProposeCapability ? proposal : undefined,
    reason: shouldProposeCapability ? 'canonical-capability-proposal-available' : 'canonical-routing-result-remains-authoritative',
  };
}

export default buildAICapabilityOrchestration;

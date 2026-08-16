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

const NON_CAPABILITY_SKILLS = new Set(['general_question']);
const OBJECT_ID_KEYS = ['requestId', 'economicRequestId', 'orderId', 'productId', 'cartId', 'agentGoalId', 'notificationId', 'topicId', 'postId', 'discoveryEntityId', 'subscriptionId'];

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

function extractCanonicalObjectId(entities: Record<string, unknown> | undefined): string | undefined {
  if (!entities) return undefined;
  for (const key of OBJECT_ID_KEYS) {
    const value = entities[key];
    if (typeof value === 'string' && value.trim()) return value.trim();
    if (typeof value === 'number' && Number.isSafeInteger(value)) return String(value);
  }
  return undefined;
}

/**
 * Translates an already-canonical routing result into a bounded AI proposal.
 * This bridge is deliberately read-only: it never executes, mutates state,
 * resolves ownership, authorizes payment, or replaces the canonical action boundary.
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
    canonicalObjectId: extractCanonicalObjectId(routing.extractedEntities),
    arguments: { ...(routing.extractedEntities || {}) },
    confidence: routing.intentConfidence,
    posture,
    confirmationRequired: contract.actionPosture === 'control',
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

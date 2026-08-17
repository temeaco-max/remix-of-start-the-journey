import type { IntentRoutingResult } from '../types.js';
import type { ConversationTurnContract } from './conversationTurnContractService.js';
import type { AISemanticCapabilityProposal } from './aiSemanticProposalService.js';
import { reconcileAICapabilityProposal } from './aiCapabilityReconciliationService.js';
import { deriveCapabilityInteractionPolicy, deriveInteractionPolicyForCapabilityName, type CapabilityInteractionPolicy } from './capabilityInteractionPolicyService.js';
import type { UniversalCapabilityDescriptor } from './universalCapabilityProtocol.js';

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
  source: 'canonical-routing' | 'semantic-model';
}

export interface AICapabilityOrchestrationDecision {
  mode: ConversationTurnContract['mode'];
  shouldTalk: boolean;
  shouldPresentCanonicalResult: boolean;
  shouldProposeCapability: boolean;
  interactionPolicy?: CapabilityInteractionPolicy;
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

function descriptorFromDecision(capability: string, routing: IntentRoutingResult): UniversalCapabilityDescriptor | undefined {
  const candidate = (routing as IntentRoutingResult & { capabilityDescriptor?: UniversalCapabilityDescriptor }).capabilityDescriptor;
  if (candidate?.capability === capability) return candidate;
  return undefined;
}

/**
 * Translates canonical routing, optionally reconciled with a model semantic
 * proposal, into a bounded AI proposal. The output remains proposal-only.
 * Interaction policy is derived from the universal capability vocabulary and
 * is available even when the routing result does not carry the full descriptor.
 */
export function buildAICapabilityOrchestration(
  routing: IntentRoutingResult,
  contract: ConversationTurnContract,
  semanticProposal: AISemanticCapabilityProposal | null = null,
): AICapabilityOrchestrationDecision {
  const capability = normaliseCapability(routing.skill, routing.target_skill);
  const posture = inferPosture(contract);
  const shouldPresentCanonicalResult = Boolean(routing.cardData && typeof routing.cardData === 'object' && routing.skill !== 'general_question');
  const reconciled = reconcileAICapabilityProposal(routing, semanticProposal, contract);
  const finalCapability = reconciled.capability || capability;
  const finalAction = reconciled.action || routing.canonicalAction;
  const finalPosture = reconciled.posture === 'none' ? posture : reconciled.posture;

  if (!finalCapability || NON_CAPABILITY_SKILLS.has(routing.skill)) {
    return {
      mode: contract.mode,
      shouldTalk: true,
      shouldPresentCanonicalResult,
      shouldProposeCapability: false,
      reason: 'ordinary-conversation-or-non-capability-turn',
    };
  }

  const descriptor = descriptorFromDecision(finalCapability, routing);
  const interactionPolicy = descriptor
    ? deriveCapabilityInteractionPolicy(descriptor)
    : deriveInteractionPolicyForCapabilityName(finalCapability);
  const forcedInterrupt = interactionPolicy.interruption === 'immediate';
  const shouldProposeCapability = Boolean(
    finalCapability &&
    (finalAction || semanticProposal) &&
    (finalPosture !== 'none' || forcedInterrupt) &&
    (contract.requiresStructuredProposal || forcedInterrupt),
  );

  const proposal: AICapabilityProposal = {
    capability: finalCapability,
    action: finalAction,
    contextId: contract.protectedContextIds[0],
    canonicalObjectId: extractCanonicalObjectId(routing.extractedEntities),
    arguments: { ...(reconciled.arguments || {}), ...(routing.extractedEntities || {}) },
    confidence: reconciled.confidence || routing.intentConfidence,
    posture: forcedInterrupt ? 'propose' : finalPosture,
    confirmationRequired: interactionPolicy.confirmation === 'explicit' || finalPosture === 'control' || contract.actionPosture === 'control',
    preserveContext: interactionPolicy.preservesPriorGoals,
    requiresCanonicalValidation: true,
    source: reconciled.source === 'semantic' || reconciled.source === 'reconciled' ? 'semantic-model' : 'canonical-routing',
  };

  return {
    mode: contract.mode,
    shouldTalk: contract.shouldGenerateNaturalResponse,
    shouldPresentCanonicalResult,
    shouldProposeCapability,
    interactionPolicy,
    proposal: shouldProposeCapability ? proposal : undefined,
    reason: shouldProposeCapability ? reconciled.reason : 'canonical-routing-result-remains-authoritative',
  };
}

export default buildAICapabilityOrchestration;

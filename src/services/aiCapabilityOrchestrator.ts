import type { IntentRoutingResult } from '../types.js';
import type { ConversationTurnContract } from './conversationTurnContractService.js';
import type { AISemanticCapabilityProposal } from './aiSemanticProposalService.js';
import { reconcileAICapabilityProposal } from './aiCapabilityReconciliationService.js';
import { deriveActionInteractionPolicy, deriveActionInteractionPolicyForName, type CapabilityInteractionPolicy } from './actionInteractionPolicyService.js';
import type { UniversalCapabilityDescriptor } from './universalCapabilityProtocol.js';
import { registerCapability, resolveCapabilityComposition } from './capabilityRegistry.js';
import { capabilityRegistrationForSkill, ensureCapabilityFoundation, normalizeSkillCapabilityReference } from './capabilityFoundation.js';
import { getSkillCapabilities } from './skillFlows.js';

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
  capabilityPlan?: string[];
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
  return candidate?.capability === capability ? candidate : undefined;
}

function ensureSkillComposition(skill: string): { capabilityPlan: string[]; skillDescriptor: UniversalCapabilityDescriptor } {
  ensureCapabilityFoundation();
  const required = getSkillCapabilities(skill).map(normalizeSkillCapabilityReference);
  const registration = capabilityRegistrationForSkill(skill, required);
  registerCapability(registration);
  const composition = resolveCapabilityComposition([registration.descriptor.capability]);
  return {
    capabilityPlan: composition.ordered.map(item => item.descriptor.capability),
    skillDescriptor: registration.descriptor,
  };
}

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
    return { mode: contract.mode, shouldTalk: true, shouldPresentCanonicalResult, shouldProposeCapability: false, reason: 'ordinary-conversation-or-non-capability-turn' };
  }

  const composition = ensureSkillComposition(finalCapability);
  const descriptor = descriptorFromDecision(finalCapability, routing) || composition.skillDescriptor;
  const interactionPolicy = descriptorFromDecision(finalCapability, routing)
    ? deriveActionInteractionPolicy(descriptor, finalAction)
    : deriveActionInteractionPolicyForName(finalCapability, finalAction, descriptor);
  const forcedInterrupt = interactionPolicy.interruption === 'immediate';
  const shouldProposeCapability = Boolean(finalCapability && (finalAction || semanticProposal) && (finalPosture !== 'none' || forcedInterrupt) && (contract.requiresStructuredProposal || forcedInterrupt));

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
    capabilityPlan: composition.capabilityPlan,
  };

  return {
    mode: contract.mode,
    shouldTalk: contract.shouldGenerateNaturalResponse,
    shouldPresentCanonicalResult,
    shouldProposeCapability,
    interactionPolicy,
    proposal: shouldProposeCapability ? proposal : undefined,
    reason: shouldProposeCapability ? `${reconciled.reason}; capability composition resolved through canonical atomic capabilities` : 'canonical-routing-result-remains-authoritative',
  };
}

export default buildAICapabilityOrchestration;

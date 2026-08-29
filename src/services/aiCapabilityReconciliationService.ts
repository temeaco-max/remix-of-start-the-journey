/* Copyright (c) 2026 temeaco-max. All rights reserved. Proprietary and confidential. */
import type { IntentRoutingResult } from '../types.js';
import type { ConversationTurnContract } from './conversationTurnContractService.js';
import type { AISemanticCapabilityProposal } from './aiSemanticProposalService.js';

export interface ReconciledAICapabilityDecision {
  capability?: string;
  action?: string;
  arguments: Record<string, unknown>;
  confidence: number;
  posture: AISemanticCapabilityProposal['posture'];
  source: 'canonical' | 'semantic' | 'reconciled' | 'none';
  preserveContext: boolean;
  requiresCanonicalValidation: true;
  reason: string;
}

const OBJECT_ACTION_REQUIREMENTS = new Set(['propose', 'control']);

function safeCapability(value?: string): string | undefined {
  const v = String(value || '').trim();
  return v ? v : undefined;
}

/**
 * Reconciles model semantic interpretation with deterministic/canonical routing.
 * Canonical routing wins whenever it has an actionable capability. A semantic
 * proposal may fill a gap for ambiguous/low-confidence turns, but it can never
 * override an exact canonical action or manufacture authorization.
 */
export function reconcileAICapabilityProposal(
  routing: IntentRoutingResult,
  semantic: AISemanticCapabilityProposal | null,
  contract: ConversationTurnContract,
): ReconciledAICapabilityDecision {
  const canonicalCapability = safeCapability(routing.skill && routing.skill !== 'general_question' ? routing.skill : routing.target_skill);
  const canonicalAction = safeCapability(routing.canonicalAction);

  if (canonicalCapability && canonicalAction) {
    return {
      capability: canonicalCapability,
      action: canonicalAction,
      arguments: { ...(routing.extractedEntities || {}) },
      confidence: Math.max(0, Math.min(1, routing.intentConfidence ?? 1)),
      posture: contract.actionPosture === 'control' ? 'control' : contract.shouldAskClarification ? 'clarify' : 'propose',
      source: 'canonical',
      preserveContext: contract.shouldPreserveExistingContext,
      requiresCanonicalValidation: true,
      reason: 'canonical-action-is-authoritative',
    };
  }

  if (!semantic || semantic.confidence < 0.7 || !OBJECT_ACTION_REQUIREMENTS.has(semantic.posture)) {
    return {
      arguments: {},
      confidence: 0,
      posture: 'none',
      source: 'none',
      preserveContext: contract.shouldPreserveExistingContext,
      requiresCanonicalValidation: true,
      reason: 'no-actionable-capability-proposal',
    };
  }

  // Semantic interpretation may fill an otherwise unresolved gap, but it must
  // never invent an action where the conversation contract says not to act.
  if (contract.shouldAvoidAction || !contract.requiresStructuredProposal) {
    return {
      arguments: {},
      confidence: semantic.confidence,
      posture: contract.shouldAskClarification ? 'clarify' : 'none',
      source: 'none',
      preserveContext: contract.shouldPreserveExistingContext,
      requiresCanonicalValidation: true,
      reason: 'conversation-posture-blocks-semantic-action',
    };
  }

  const mergedArguments = {
    ...(routing.extractedEntities || {}),
    ...(semantic.arguments || {}),
  };
  return {
    capability: safeCapability(semantic.capability),
    action: safeCapability(semantic.action),
    arguments: mergedArguments,
    confidence: semantic.confidence,
    posture: semantic.posture,
    source: canonicalCapability ? 'reconciled' : 'semantic',
    preserveContext: contract.shouldPreserveExistingContext,
    requiresCanonicalValidation: true,
    reason: canonicalCapability ? 'semantic-proposal-reconciled-with-canonical-routing' : 'semantic-proposal-fills-routing-gap',
  };
}

export default reconcileAICapabilityProposal;

/* Copyright (c) 2026 temeaco-max. All rights reserved. Proprietary and confidential. */
import { queryUnifiedAI } from './unifiedAiEngine.js';
import type { ConversationTurnContract } from './conversationTurnContractService.js';

export interface AISemanticCapabilityProposal {
  capability: string;
  action?: string;
  arguments: Record<string, unknown>;
  confidence: number;
  posture: 'none' | 'clarify' | 'propose' | 'control';
  reason?: string;
}

function extractJson(text: string): unknown {
  const cleaned = String(text || '').replace(/```json|```/gi, '').trim();
  try { return JSON.parse(cleaned); } catch { /* continue */ }
  const match = cleaned.match(/\{[\s\S]*\}/);
  if (!match) return null;
  try { return JSON.parse(match[0]); } catch { return null; }
}

function normalizeProposal(value: unknown): AISemanticCapabilityProposal | null {
  if (!value || typeof value !== 'object') return null;
  const raw = value as Record<string, unknown>;
  const capability = typeof raw.capability === 'string' ? raw.capability.trim() : '';
  const posture = raw.posture === 'clarify' || raw.posture === 'propose' || raw.posture === 'control' || raw.posture === 'none' ? raw.posture : 'none';
  const confidence = typeof raw.confidence === 'number' && Number.isFinite(raw.confidence) ? Math.max(0, Math.min(1, raw.confidence)) : 0;
  if (!capability || confidence < 0.7 || posture === 'none') return null;
  const action = typeof raw.action === 'string' && raw.action.trim() ? raw.action.trim() : undefined;
  const args = raw.arguments && typeof raw.arguments === 'object' && !Array.isArray(raw.arguments) ? raw.arguments as Record<string, unknown> : {};
  return { capability, action, arguments: args, confidence, posture, reason: typeof raw.reason === 'string' ? raw.reason.trim().slice(0, 240) : undefined };
}

/**
 * Selective model semantic interpretation for turns where the deterministic
 * router has not produced a canonical capability. It is proposal-only and
 * cannot execute, mutate state, authorize payment, or bypass the canonical
 * action boundary. The common AI model boundary is reused deliberately.
 */
export async function proposeSemanticCapability(input: {
  userMessage: string;
  contract: ConversationTurnContract;
  phone?: string;
  threadId?: string;
  knownFacts?: string[];
  activeContextIds?: string[];
  pendingFields?: string[];
}): Promise<AISemanticCapabilityProposal | null> {
  if (input.contract.mode === 'conversation' || input.contract.mode === 'clarification') return null;
  if (!input.contract.requiresStructuredProposal && input.contract.mode !== 'reference' && input.contract.mode !== 'exploration') return null;

  const prompt = [
    'Interpret this Kurukoo user turn for capability coordination.',
    'Return ONLY JSON. Do not answer the user.',
    '{"capability":"existing Kurukoo capability identifier or empty string","action":"existing action identifier or empty string","arguments":{},"confidence":0,"posture":"none|clarify|propose|control","reason":"brief reason"}',
    'Rules:',
    '- Propose only when the user is actually asking Kurukoo to coordinate or change something.',
    '- Ordinary conversation, curiosity, problem descriptions and exploration without a request to act must return posture="none".',
    '- Never invent provider availability, payment state, evidence, identities or external results.',
    '- Arguments are user-stated facts only; do not infer hidden authorization.',
    '- The canonical executor will validate capability/action/context before any mutation.',
    `Conversation mode: ${input.contract.mode}`,
    `Action posture: ${input.contract.actionPosture}`,
    input.contract.protectedContextIds.length ? `Protected contexts: ${input.contract.protectedContextIds.join(', ')}` : '',
    input.contract.protectedGoalIds.length ? `Protected goals: ${input.contract.protectedGoalIds.join(', ')}` : '',
    input.pendingFields?.length ? `Pending fields: ${input.pendingFields.join(', ')}` : '',
    input.knownFacts?.length ? `Known facts: ${input.knownFacts.join(' | ')}` : '',
    `User: ${input.userMessage}`,
  ].filter(Boolean).join('\n');

  try {
    const response = await queryUnifiedAI(prompt, {
      provider: 'auto',
      phone: input.phone,
      threadId: input.threadId,
      conversational: true,
      temperature: 0.1,
      systemPrompt: 'You are Kurukoo\'s bounded semantic capability interpreter. Output JSON only. You propose; canonical Kurukoo services decide and execute.',
      contextHint: {
        preserveContextIds: input.contract.protectedContextIds,
        activeContexts: input.contract.protectedContextIds.map(contextId => ({ contextId, type: 'protected_context' })),
      },
    });
    return normalizeProposal(extractJson(response.text));
  } catch {
    return null;
  }
}

/* Copyright (c) 2026 temeaco-max. All rights reserved. Proprietary and confidential. */
import crypto from 'node:crypto';
import { queryUnifiedAI } from './unifiedAiEngine.js';
import { hasConfiguredSecret } from './providerCapabilities.js';
import { persistLearningArtifact } from './coordinatorStore.js';
import type { CoordinatorEventEnvelope } from './coordinatorTypes.js';

export type TeacherTask = 'label_intent' | 'choose_capability' | 'draft_clarification' | 'critique_response' | 'extract_requirements';

function teacherEnabled(): boolean {
  return process.env.KURUKOO_COORDINATOR_TEACHER_ENABLED === 'true';
}

function policyVersion(): string {
  return String(process.env.KURUKOO_COORDINATOR_POLICY_VERSION || 'coordinator-policy-v1').slice(0, 120);
}

function redactedEvent(event: CoordinatorEventEnvelope): Record<string, unknown> {
  return {
    id: event.id,
    type: event.type,
    correlationId: event.correlationId,
    economicRequestId: event.economicRequestId,
    agentGoalId: event.agentGoalId,
    payload: event.payload,
    provenance: { source: event.provenance.source, evidenceLevel: event.provenance.evidenceLevel },
    policy: { confirmationRequired: event.policy.confirmationRequired, autonomousAllowed: event.policy.autonomousAllowed },
  };
}

function parseCandidate(text: string): Record<string, unknown> | null {
  const cleaned = String(text || '').replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim();
  try {
    const parsed = JSON.parse(cleaned);
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed as Record<string, unknown> : null;
  } catch {
    return null;
  }
}

/**
 * Teacher output is always a candidate artifact. It cannot execute a capability,
 * mutate a canonical request, or promote itself into production policy.
 */
export async function requestTeacherCandidate(input: { task: TeacherTask; event: CoordinatorEventEnvelope; candidates?: string[] }): Promise<{ status: 'disabled' | 'not_configured' | 'candidate' | 'failed'; artifactId?: string; provider?: string; model?: string; note: string }> {
  if (!teacherEnabled()) return { status: 'disabled', note: 'Coordinator teacher mode is disabled.' };
  if (!hasConfiguredSecret(process.env.MISTRAL_API_KEY)) return { status: 'not_configured', note: 'Teacher mode requires a configured Mistral key; no teacher call was attempted.' };

  const prompt = JSON.stringify({
    task: input.task,
    instruction: 'Return JSON only. Produce a candidate for evaluation. Never claim payment, delivery, inventory, verification, fulfilment, or external action unless the event provenance explicitly proves it.',
    event: redactedEvent(input.event),
    candidates: input.candidates || [],
    output: { type: 'object', properties: { recommendation: { type: 'string' }, rationale: { type: 'string' }, confidence: { type: 'number' }, required_confirmation: { type: 'string' } }, additionalProperties: false },
  });

  try {
    const response = await queryUnifiedAI(prompt, { provider: 'mistral', skipMemory: true, temperature: 0 });
    if (!response.provider.toLowerCase().includes('mistral')) return { status: 'failed', provider: response.provider, model: response.model, note: 'Teacher request did not receive a verified Mistral response; no artifact was stored.' };
    const candidate = parseCandidate(response.text);
    if (!candidate) return { status: 'failed', provider: response.provider, model: response.model, note: 'Teacher response was not valid JSON; no artifact was stored.' };
    const artifactId = crypto.randomUUID();
    await persistLearningArtifact({ id: artifactId, type: `teacher_${input.task}`, sourceEventId: input.event.id, content: candidate, provenance: { source: 'teacher_model', provider: response.provider, model: response.model, evidenceLevel: 'assertion' }, policyVersion: policyVersion(), expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() });
    return { status: 'candidate', artifactId, provider: response.provider, model: response.model, note: 'Candidate stored for evaluation; it was not promoted or executed.' };
  } catch (error) {
    return { status: 'failed', note: error instanceof Error ? error.message : 'Teacher request failed without a candidate.' };
  }
}

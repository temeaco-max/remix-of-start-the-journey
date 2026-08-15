import type { AgentToolName, AgentToolResult } from './agentToolRegistry.js';

export type CoordinatorEventType =
  | 'agent.goal.due'
  | 'economic_request.state_changed'
  | 'notification.action_required'
  | 'chat.turn.completed'
  | 'memory.context.retrieved'
  | 'provider.offer.received'
  | 'payment.webhook.verified';

export type CoordinatorConfirmation = 'none' | 'user' | 'operator' | 'external_evidence';
export type CoordinatorEvidenceLevel = 'assertion' | 'persisted_state' | 'verified_external';

export interface CoordinatorEventEnvelope<TPayload = Record<string, unknown>> {
  id: string;
  type: CoordinatorEventType;
  occurredAt: string;
  producer: string;
  correlationId: string;
  causationId?: string;
  ownerPhone?: string;
  economicRequestId?: string;
  agentGoalId?: string;
  payload: TPayload;
  sensitivity: 'public' | 'personal' | 'sensitive' | 'restricted';
  provenance: {
    source: 'user' | 'canonical_service' | 'provider' | 'operator' | 'teacher_model';
    sourceId?: string;
    evidenceLevel: CoordinatorEvidenceLevel;
  };
  policy: {
    autonomousAllowed: boolean;
    confirmationRequired: CoordinatorConfirmation;
    expiresAt?: string;
  };
  schemaVersion: 1;
}

export type CoordinatorCapabilityName = 'inspect_request' | 'recheck_request' | 'wait_for_user';
export type CoordinatorCapabilityRisk = 'read_only' | 'reversible' | 'user_confirmation_required';

export interface CoordinatorContext {
  event: CoordinatorEventEnvelope;
  dryRun: boolean;
}

export interface CoordinatorCapabilityResult {
  ok: boolean;
  state: 'observed' | 'awaiting_confirmation' | 'completed' | 'deferred' | 'failed';
  message: string;
  tool?: AgentToolName;
  data?: Record<string, unknown>;
  evidence?: { source: string; level: CoordinatorEvidenceLevel };
}

export interface CoordinatorCapability {
  name: CoordinatorCapabilityName;
  risk: CoordinatorCapabilityRisk;
  requires: CoordinatorConfirmation;
  autonomous: boolean;
  canRun(context: CoordinatorContext): boolean;
  run(context: CoordinatorContext): Promise<CoordinatorCapabilityResult>;
}

export interface CoordinatorRun {
  id: number;
  eventId: string;
  capability?: CoordinatorCapabilityName;
  state: CoordinatorCapabilityResult['state'];
  provider: 'deterministic' | 'local' | 'hosted' | 'teacher';
  model: string;
  latencyMs: number;
  failureReason?: string;
  createdAt: string;
}

export interface CoordinatorDecision {
  capability: CoordinatorCapabilityName;
  provider: CoordinatorRun['provider'];
  model: string;
  reason: string;
}

export type CoordinatorToolResult = AgentToolResult;

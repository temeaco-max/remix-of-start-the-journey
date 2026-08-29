/* Copyright (c) 2026 temeaco-max. All rights reserved. Proprietary and confidential. */
import crypto from 'node:crypto';
import { executeAgentTool } from './agentToolRegistry.js';
import { persistCoordinatorEvent, persistCoordinatorRun } from './coordinatorStore.js';
import type {
  CoordinatorCapability,
  CoordinatorCapabilityResult,
  CoordinatorContext,
  CoordinatorDecision,
  CoordinatorEventEnvelope,
} from './coordinatorTypes.js';

function autonomousAllowed(): boolean {
  return process.env.KURUKOO_AGENT_ENABLED === 'true' && process.env.KURUKOO_AGENT_AUTONOMOUS === 'true';
}

function lowRiskAllowed(): boolean {
  return autonomousAllowed() && process.env.KURUKOO_AGENT_AUTONOMOUS_LOW_RISK === 'true';
}

function requestId(context: CoordinatorContext): string | null {
  return context.event.economicRequestId || (typeof context.event.payload?.requestId === 'string' ? context.event.payload.requestId : null);
}

function explicitCapability(context: CoordinatorContext): { capability: string; action: string } | null {
  const capability = typeof context.event.payload?.capability === 'string' ? context.event.payload.capability.trim() : '';
  const action = typeof context.event.payload?.action === 'string' ? context.event.payload.action.trim() : '';
  return capability && action ? { capability, action } : null;
}

function inspectRequest(): CoordinatorCapability {
  return {
    name: 'inspect_request',
    risk: 'read_only',
    requires: 'none',
    autonomous: true,
    canRun: context => Boolean(context.event.ownerPhone && requestId(context)),
    async run(context): Promise<CoordinatorCapabilityResult> {
      const id = requestId(context);
      if (!id || !context.event.ownerPhone) return { ok: false, state: 'failed', message: 'An owned Economic Request is required.' };
      const result = await executeAgentTool('get_request_state', { requestId: id }, {
        phone: context.event.ownerPhone,
        conversationId: typeof context.event.payload?.conversationId === 'string' ? context.event.payload.conversationId : undefined,
        goalId: context.event.agentGoalId || context.event.correlationId,
      });
      if (!result.ok) return { ok: false, state: 'failed', message: result.message || 'The request could not be inspected.', tool: result.tool };
      return { ok: true, state: 'observed', message: 'The current Economic Request state was inspected.', tool: result.tool, data: result.data, evidence: { source: result.evidence || `economic_request:${id}:${result.data?.status || 'observed'}`, level: 'persisted_state' } };
    },
  };
}

function recheckRequest(): CoordinatorCapability {
  return {
    name: 'recheck_request',
    risk: 'reversible',
    requires: 'none',
    autonomous: true,
    canRun: context => Boolean(lowRiskAllowed() && context.event.ownerPhone && requestId(context) && ['agent.goal.due', 'economic_request.state_changed'].includes(context.event.type)),
    async run(context): Promise<CoordinatorCapabilityResult> {
      const id = requestId(context);
      if (!id || !context.event.ownerPhone) return { ok: false, state: 'failed', message: 'An owned Economic Request is required.' };
      const result = await executeAgentTool('recheck_economic_request', { requestId: id }, {
        phone: context.event.ownerPhone,
        conversationId: typeof context.event.payload?.conversationId === 'string' ? context.event.payload.conversationId : undefined,
        goalId: context.event.agentGoalId || context.event.correlationId,
      });
      if (!result.ok) return { ok: false, state: 'failed', message: result.message || 'The request was not rechecked.', tool: result.tool };
      return { ok: true, state: 'completed', message: 'The canonical storefront rechecked the unresolved request.', tool: result.tool, data: result.data, evidence: { source: result.evidence || `storefront:${id}`, level: 'persisted_state' } };
    },
  };
}

function executeExplicitCapability(): CoordinatorCapability {
  return {
    name: 'execute_capability',
    risk: 'user_confirmation_required',
    requires: 'user',
    autonomous: true,
    canRun: context => Boolean(context.event.ownerPhone && explicitCapability(context)),
    async run(context): Promise<CoordinatorCapabilityResult> {
      const target = explicitCapability(context);
      if (!target || !context.event.ownerPhone) return { ok: false, state: 'failed', message: 'An explicit capability and action are required.' };
      const args = context.event.payload?.arguments && typeof context.event.payload.arguments === 'object' && !Array.isArray(context.event.payload.arguments)
        ? context.event.payload.arguments as Record<string, unknown>
        : {};
      const result = await executeAgentTool('execute_capability', {
        capability: target.capability,
        action: target.action,
        contextId: typeof context.event.payload?.contextId === 'string' ? context.event.payload.contextId : context.event.agentGoalId || context.event.correlationId,
        canonicalObjectId: typeof context.event.payload?.canonicalObjectId === 'string' ? context.event.payload.canonicalObjectId : undefined,
        argumentsJson: JSON.stringify(args),
        confirmationGranted: context.event.policy.confirmationRequired === 'none' || context.event.payload?.confirmationGranted === true,
      }, {
        phone: context.event.ownerPhone,
        conversationId: typeof context.event.payload?.conversationId === 'string' ? context.event.payload.conversationId : undefined,
        goalId: context.event.agentGoalId || context.event.correlationId,
      });
      const resultStatus = typeof result.data?.status === 'string' ? result.data.status : (result.ok ? 'observed' : 'failed');
      const state: CoordinatorCapabilityResult['state'] = resultStatus === 'completed' ? 'completed'
        : resultStatus === 'waiting' || resultStatus === 'externally_pending' ? 'awaiting_confirmation'
          : resultStatus === 'needs_user' || resultStatus === 'confirmation_required' ? 'awaiting_confirmation'
            : result.ok ? 'observed' : 'failed';
      return {
        ok: result.ok,
        state,
        message: result.message || `Capability ${target.capability}:${target.action} returned ${resultStatus}.`,
        tool: result.tool,
        data: result.data,
        evidence: { source: result.evidence || `canonical_capability:${target.capability}:${target.action}:${resultStatus}`, level: 'canonical_service' },
      };
    },
  };
}

function firstClassAgentPersona(): CoordinatorCapability {
  return {
    name: 'first_class_agent_persona',
    risk: 'read_only',
    requires: 'none',
    autonomous: false,
    canRun: context => context.event.type === 'agent.persona.requested' && typeof context.event.payload?.agentId === 'string',
    async run(context): Promise<CoordinatorCapabilityResult> {
      const agentId = String(context.event.payload?.agentId || '').slice(0, 120);
      const skill = String(context.event.payload?.skill || '').slice(0, 120);
      return {
        ok: true,
        state: 'observed',
        message: 'The internal Brain authorized a bounded first-class persona response through the canonical local model boundary.',
        data: { agentId, skill, provider: 'local', model: 'SmolLM2' },
        evidence: { source: `agent-persona:${agentId}`, level: 'policy_reviewed' },
      };
    },
  };
}

function waitForUser(): CoordinatorCapability {
  return {
    name: 'wait_for_user',
    risk: 'user_confirmation_required',
    requires: 'user',
    autonomous: false,
    canRun: context => Boolean(context.event.ownerPhone),
    async run(): Promise<CoordinatorCapabilityResult> {
      return { ok: true, state: 'awaiting_confirmation', message: 'The coordinator is waiting for the user before taking a consequential action.' };
    },
  };
}

const CAPABILITIES: CoordinatorCapability[] = [executeExplicitCapability(), recheckRequest(), inspectRequest(), firstClassAgentPersona(), waitForUser()];

function chooseCapability(context: CoordinatorContext): CoordinatorDecision {
  const candidates = CAPABILITIES.filter(capability => capability.canRun(context));
  const explicit = candidates.find(capability => capability.name === 'execute_capability');
  if (explicit) return { capability: explicit.name, provider: 'deterministic', model: 'canonical-capability-executor', reason: 'Explicit capability actions are delegated to the canonical capability executor.' };
  const persona = candidates.find(capability => capability.name === 'first_class_agent_persona');
  if (persona) return { capability: persona.name, provider: 'deterministic', model: 'rules-v1', reason: 'First-class persona execution must be policy-audited by the internal Brain before local generation.' };
  const inspect = candidates.find(capability => capability.name === 'inspect_request');
  if (inspect) return { capability: inspect.name, provider: 'deterministic', model: 'rules-v1', reason: 'Read-only request inspection is the cheapest correct capability.' };
  const recheck = candidates.find(capability => capability.name === 'recheck_request');
  if (recheck) return { capability: recheck.name, provider: 'deterministic', model: 'rules-v1', reason: 'Bounded low-risk request recheck is explicitly enabled.' };
  return { capability: 'wait_for_user', provider: 'deterministic', model: 'rules-v1', reason: 'No autonomous capability is permitted for this event.' };
}

function createEvent(input: Omit<CoordinatorEventEnvelope, 'id' | 'occurredAt' | 'schemaVersion'>): CoordinatorEventEnvelope {
  return { ...input, id: crypto.randomUUID(), occurredAt: new Date().toISOString(), schemaVersion: 1 };
}

export class InternalCoordinator {
  async handle(input: Omit<CoordinatorEventEnvelope, 'id' | 'occurredAt' | 'schemaVersion'> | CoordinatorEventEnvelope): Promise<CoordinatorCapabilityResult> {
    const event = 'id' in input && 'occurredAt' in input && 'schemaVersion' in input ? input : createEvent(input);
    const startedAt = Date.now();
    await persistCoordinatorEvent(event, { dispatch: false });
    const context: CoordinatorContext = { event, dryRun: false };
    const decision = chooseCapability(context);
    const capability = CAPABILITIES.find(candidate => candidate.name === decision.capability) || waitForUser();

    if (capability.risk !== 'read_only' && !event.policy.autonomousAllowed && capability.name !== 'wait_for_user' && capability.name !== 'execute_capability') {
      const result = { ok: true, state: 'awaiting_confirmation', message: 'Autonomous execution is disabled for this event.' } satisfies CoordinatorCapabilityResult;
      await persistCoordinatorRun({ eventId: event.id, capability: capability.name, state: result.state, provider: decision.provider, model: decision.model, latencyMs: Date.now() - startedAt });
      return result;
    }

    try {
      const result = await capability.run(context);
      await persistCoordinatorRun({ eventId: event.id, capability: capability.name, state: result.state, provider: decision.provider, model: decision.model, latencyMs: Date.now() - startedAt, failureReason: result.ok ? undefined : result.message });
      return result;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Coordinator capability failed.';
      const result = { ok: false, state: 'failed', message } satisfies CoordinatorCapabilityResult;
      await persistCoordinatorRun({ eventId: event.id, capability: capability.name, state: result.state, provider: decision.provider, model: decision.model, latencyMs: Date.now() - startedAt, failureReason: message });
      return result;
    }
  }
}

export const internalCoordinator = new InternalCoordinator();

export function coordinatorEventForFirstClassAgent(input: { ownerPhone?: string; agentId: string; skill: string; conversationId?: string }): Omit<CoordinatorEventEnvelope, 'id' | 'occurredAt' | 'schemaVersion'> {
  return {
    type: 'agent.persona.requested',
    producer: 'intentRouter',
    correlationId: `agent-persona:${input.agentId}:${Date.now()}`,
    ...(input.ownerPhone ? { ownerPhone: input.ownerPhone } : {}),
    payload: { agentId: input.agentId, skill: input.skill, conversationId: input.conversationId },
    sensitivity: input.ownerPhone ? 'personal' : 'public',
    provenance: { source: input.ownerPhone ? 'canonical_service' : 'user', sourceId: input.agentId, evidenceLevel: 'policy_reviewed' },
    policy: { autonomousAllowed: false, confirmationRequired: 'none' },
  };
}

export function coordinatorEventForAgentGoal(input: { ownerPhone: string; agentGoalId: string; economicRequestId: string; conversationId?: string; requestStatus?: string }): Omit<CoordinatorEventEnvelope, 'id' | 'occurredAt' | 'schemaVersion'> {
  return {
    type: 'agent.goal.due',
    producer: 'agentRuntime',
    correlationId: `agent-goal:${input.agentGoalId}`,
    ownerPhone: input.ownerPhone,
    economicRequestId: input.economicRequestId,
    agentGoalId: input.agentGoalId,
    payload: { requestId: input.economicRequestId, requestStatus: input.requestStatus, conversationId: input.conversationId },
    sensitivity: 'personal',
    provenance: { source: 'canonical_service', sourceId: input.agentGoalId, evidenceLevel: 'persisted_state' },
    policy: { autonomousAllowed: autonomousAllowed(), confirmationRequired: 'none' },
  };
}

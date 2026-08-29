/* Copyright (c) 2026 temeaco-max. All rights reserved. Proprietary and confidential. */
import { evaluateAgentWork, type AgentQualityDecision } from './agentQualityGate.js';
import { listAgentExecutionTrace, type AgentExecutionTraceEvent } from './agentExecutionTrace.js';

export interface AgentObjectiveEvaluationInput {
  ownerPhone: string;
  goalId: string;
  objective: string;
  planPresent: boolean;
  capabilityAllowed: boolean;
  authorizationSatisfied: boolean;
  dependenciesSatisfied: boolean;
  evidenceRequired?: boolean;
}

export interface AgentObjectiveEvaluation extends AgentQualityDecision {
  traceCount: number;
  latestStatus?: string;
  evidencePresent: boolean;
  externallyVerified: boolean;
  externalOutcomeClaimed: boolean;
}

function hasVerifiedOutcome(trace: AgentExecutionTraceEvent[]): boolean {
  return trace.some((event) =>
    event.kind === 'evidence' &&
    Boolean(event.evidence) &&
    /verified|confirmed|validated/i.test(String(event.status || '') + ' ' + String(event.evidence || '')),
  );
}

function hasExternalOutcomeClaim(trace: AgentExecutionTraceEvent[]): boolean {
  return trace.some((event) =>
    event.kind === 'outcome' &&
    /external|provider|completed|delivered|sold|repaired/i.test(
      `${event.status || ''} ${event.reason || ''} ${event.evidence || ''}`,
    ),
  );
}

export async function evaluateAgentObjective(
  input: AgentObjectiveEvaluationInput,
): Promise<AgentObjectiveEvaluation> {
  const trace = await listAgentExecutionTrace(input.ownerPhone, input.goalId, 200);
  const evidencePresent = hasVerifiedOutcome(trace);
  const externallyVerified = evidencePresent;
  const externalOutcomeClaimed = hasExternalOutcomeClaim(trace);
  const latestStatus = trace.length ? trace[trace.length - 1]?.status : undefined;
  const decision = evaluateAgentWork({
    objective: input.objective,
    planPresent: input.planPresent,
    capabilityAllowed: input.capabilityAllowed,
    authorizationSatisfied: input.authorizationSatisfied,
    dependenciesSatisfied: input.dependenciesSatisfied,
    evidenceRequired: input.evidenceRequired,
    evidencePresent,
    externalOutcomeClaimed,
    externallyVerified,
  });
  return { ...decision, traceCount: trace.length, latestStatus, evidencePresent, externallyVerified, externalOutcomeClaimed };
}

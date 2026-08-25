export type AgentQualityVerdict = 'pass' | 'needs_user' | 'blocked' | 'fail';

export interface AgentQualityInput {
  objective: string;
  planPresent: boolean;
  requiredInputsMissing?: string[];
  capabilityAllowed: boolean;
  authorizationSatisfied: boolean;
  dependenciesSatisfied: boolean;
  evidenceRequired?: boolean;
  evidencePresent?: boolean;
  externalOutcomeClaimed?: boolean;
  externallyVerified?: boolean;
}

export interface AgentQualityDecision {
  verdict: AgentQualityVerdict;
  reasons: string[];
}

export function evaluateAgentWork(input: AgentQualityInput): AgentQualityDecision {
  const reasons: string[] = [];

  if (!input.objective.trim()) return { verdict: 'fail', reasons: ['objective_missing'] };
  if (!input.planPresent) return { verdict: 'fail', reasons: ['plan_missing'] };

  if ((input.requiredInputsMissing || []).length > 0) {
    return { verdict: 'needs_user', reasons: ['required_inputs_missing', ...(input.requiredInputsMissing || [])] };
  }

  if (!input.capabilityAllowed) return { verdict: 'blocked', reasons: ['capability_not_allowed'] };
  if (!input.dependenciesSatisfied) return { verdict: 'blocked', reasons: ['dependencies_not_satisfied'] };
  if (!input.authorizationSatisfied) return { verdict: 'needs_user', reasons: ['authorization_required'] };

  if (input.externalOutcomeClaimed && !input.externallyVerified) {
    return { verdict: 'fail', reasons: ['external_outcome_not_verified'] };
  }

  if (input.evidenceRequired && !input.evidencePresent) {
    return { verdict: 'blocked', reasons: ['required_evidence_missing'] };
  }

  reasons.push('quality_requirements_satisfied');
  return { verdict: 'pass', reasons };
}

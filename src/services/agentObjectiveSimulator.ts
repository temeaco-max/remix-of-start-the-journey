/* Copyright (c) 2026 temeaco-max. All rights reserved. Proprietary and confidential. */
import { checkAgentExecutionBudget, defaultAgentExecutionBudget, initialAgentExecutionUsage, recordAgentExecutionAction, type AgentExecutionBudget, type AgentExecutionUsage } from './agentExecutionControls.js';
import { evaluateAgentWork, type AgentQualityDecision } from './agentQualityGate.js';

export type SimulatedStepStatus = 'waiting_on_dependency' | 'needs_user' | 'ready' | 'completed' | 'blocked' | 'failed';

export interface SimulatedGoal { id: string; objective: string; dependsOn?: string; status: SimulatedStepStatus; evidence?: string; }
export interface ObjectiveSimulationResult { parent: SimulatedGoal; goals: SimulatedGoal[]; quality: AgentQualityDecision; usage: AgentExecutionUsage; events: string[]; }
export interface ObjectiveSimulationOptions { budget?: AgentExecutionBudget; }

export function simulateCompoundObjective(options: ObjectiveSimulationOptions = {}): ObjectiveSimulationResult {
  const budget = options.budget || defaultAgentExecutionBudget({ KURUKOO_AGENT_MAX_ACTIONS_PER_CYCLE: '20', KURUKOO_AGENT_MAX_RETRIES: '2', KURUKOO_AGENT_MAX_ELAPSED_MS: '120000', KURUKOO_AGENT_MAX_CONCURRENT_GOALS: '5' });
  let usage = initialAgentExecutionUsage();
  const events: string[] = [];
  const parent: SimulatedGoal = { id: 'sim-parent', objective: 'Fix my laptop and sell it when it is ready', status: 'ready' };
  const repair: SimulatedGoal = { id: 'sim-repair', objective: 'Repair the laptop', status: 'ready' };
  const sale: SimulatedGoal = { id: 'sim-sale', objective: 'Sell the laptop after repair completion', dependsOn: repair.id, status: 'waiting_on_dependency' };
  events.push('parent_created', 'repair_ready', 'sale_waiting_on_repair');
  const startDecision = checkAgentExecutionBudget(budget, usage, 0);
  if (!startDecision.allowed) {
    parent.status = 'blocked';
    events.push(`budget_blocked:${startDecision.reason}`);
    return { parent, goals: [repair, sale], quality: evaluateAgentWork({ objective: parent.objective, planPresent: true, capabilityAllowed: true, authorizationSatisfied: false, dependenciesSatisfied: false }), usage, events };
  }
  usage = recordAgentExecutionAction(usage);
  repair.status = 'completed';
  repair.evidence = 'simulated_verified_repair_outcome';
  events.push('repair_completed_with_verified_evidence');
  usage = recordAgentExecutionAction(usage);
  sale.status = 'needs_user';
  events.push('sale_ready_but_requires_user_confirmation');
  const quality = evaluateAgentWork({ objective: parent.objective, planPresent: true, capabilityAllowed: true, authorizationSatisfied: false, dependenciesSatisfied: true, evidenceRequired: true, evidencePresent: true, externalOutcomeClaimed: false, externallyVerified: false });
  parent.status = quality.verdict === 'needs_user' ? 'needs_user' : quality.verdict === 'pass' ? 'completed' : 'blocked';
  events.push(`quality:${quality.verdict}`);
  return { parent, goals: [repair, sale], quality, usage, events };
}

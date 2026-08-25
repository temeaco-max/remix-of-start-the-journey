export type AgentExecutionStopReason =
  | 'completed'
  | 'needs_user'
  | 'blocked'
  | 'failed'
  | 'cancelled'
  | 'max_actions'
  | 'max_retries'
  | 'max_elapsed_ms'
  | 'max_concurrent_goals'
  | 'cost_budget';

export interface AgentExecutionBudget {
  maxActions: number;
  maxRetries: number;
  maxElapsedMs: number;
  maxConcurrentGoals: number;
  maxEstimatedCostMinor?: number;
}

export interface AgentExecutionUsage {
  actions: number;
  retries: number;
  startedAtMs: number;
  estimatedCostMinor: number;
}

export interface AgentExecutionDecision {
  allowed: boolean;
  reason?: AgentExecutionStopReason;
}

const boundedInt = (value: unknown, fallback: number, min: number, max: number): number => {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.max(min, Math.min(max, Math.floor(parsed)));
};

export function defaultAgentExecutionBudget(env: NodeJS.ProcessEnv = process.env): AgentExecutionBudget {
  return {
    maxActions: boundedInt(env.KURUKOO_AGENT_MAX_ACTIONS_PER_CYCLE, 8, 1, 50),
    maxRetries: boundedInt(env.KURUKOO_AGENT_MAX_RETRIES, 2, 0, 10),
    maxElapsedMs: boundedInt(env.KURUKOO_AGENT_MAX_ELAPSED_MS, 120_000, 5_000, 3_600_000),
    maxConcurrentGoals: boundedInt(env.KURUKOO_AGENT_MAX_CONCURRENT_GOALS, 5, 1, 100),
    maxEstimatedCostMinor: env.KURUKOO_AGENT_MAX_ESTIMATED_COST_MINOR
      ? boundedInt(env.KURUKOO_AGENT_MAX_ESTIMATED_COST_MINOR, 0, 0, 1_000_000)
      : undefined,
  };
}

export function initialAgentExecutionUsage(startedAtMs = Date.now()): AgentExecutionUsage {
  return { actions: 0, retries: 0, startedAtMs, estimatedCostMinor: 0 };
}

export function checkAgentExecutionBudget(
  budget: AgentExecutionBudget,
  usage: AgentExecutionUsage,
  estimatedActionCostMinor = 0,
  nowMs = Date.now(),
): AgentExecutionDecision {
  if (usage.actions >= budget.maxActions) return { allowed: false, reason: 'max_actions' };
  if (usage.retries > budget.maxRetries) return { allowed: false, reason: 'max_retries' };
  if (nowMs - usage.startedAtMs >= budget.maxElapsedMs) return { allowed: false, reason: 'max_elapsed_ms' };
  if (
    budget.maxEstimatedCostMinor !== undefined &&
    usage.estimatedCostMinor + Math.max(0, estimatedActionCostMinor) > budget.maxEstimatedCostMinor
  ) {
    return { allowed: false, reason: 'cost_budget' };
  }
  return { allowed: true };
}

export function recordAgentExecutionAction(
  usage: AgentExecutionUsage,
  options: { retry?: boolean; estimatedCostMinor?: number } = {},
): AgentExecutionUsage {
  return {
    ...usage,
    actions: usage.actions + 1,
    retries: usage.retries + (options.retry ? 1 : 0),
    estimatedCostMinor:
      usage.estimatedCostMinor + Math.max(0, Number(options.estimatedCostMinor || 0)),
  };
}

export function executionStopMessage(reason: AgentExecutionStopReason): string {
  switch (reason) {
    case 'max_actions':
      return 'Kurukoo stopped because the action budget was reached.';
    case 'max_retries':
      return 'Kurukoo stopped retrying after the configured retry limit.';
    case 'max_elapsed_ms':
      return 'Kurukoo paused this objective because its execution time budget was reached.';
    case 'cost_budget':
      return 'Kurukoo paused this objective because its execution cost budget was reached.';
    case 'max_concurrent_goals':
      return 'Kurukoo paused this objective because the concurrent-goal limit was reached.';
    case 'needs_user':
      return 'Kurukoo needs your input before continuing.';
    case 'blocked':
      return 'Kurukoo is blocked by a dependency or unavailable external capability.';
    case 'cancelled':
      return 'Kurukoo cancelled this objective.';
    case 'failed':
      return 'Kurukoo could not complete this objective.';
    case 'completed':
      return 'Kurukoo completed this objective.';
  }
}

import { getDb, saveDb } from '../database.js';

export type CanonicalCapabilityOutcome = {
  status: string;
  capability?: string;
  action?: string;
  canonicalObjectId?: string;
  continuationContext?: Record<string, unknown>;
  nextActions?: Array<{ action: string; label: string; confirmationRequired?: boolean }>;
  canonicalFacts?: Record<string, unknown>;
  message?: string;
  evidence?: string;
};

type GoalPlanStep = {
  id: string;
  action: string;
  tool: string;
  risk?: string;
  status: 'pending' | 'running' | 'waiting' | 'completed' | 'blocked' | 'failed';
  authorization?: string;
  idempotencyKey?: string;
  evidence?: string;
  result?: string;
};

function mapOutcome(status: string): 'success' | 'waiting' | 'needs_user' | 'blocked' | 'failed' {
  if (status === 'completed') return 'success';
  if (status === 'waiting' || status === 'externally_pending') return 'waiting';
  if (status === 'needs_user' || status === 'confirmation_required') return 'needs_user';
  if (status === 'blocked' || status === 'unauthorized') return 'blocked';
  return 'failed';
}

function mapStepStatus(status: string): GoalPlanStep['status'] {
  if (status === 'completed') return 'completed';
  if (status === 'waiting' || status === 'externally_pending') return 'waiting';
  if (status === 'needs_user' || status === 'confirmation_required') return 'waiting';
  if (status === 'blocked' || status === 'unauthorized') return 'blocked';
  if (status === 'failed' || status === 'invalid') return 'failed';
  return 'running';
}

function goalStatus(status: string, plan: GoalPlanStep[], currentIndex: number): 'active' | 'waiting' | 'needs_user' | 'blocked' | 'completed' | 'failed' {
  if (status === 'blocked' || status === 'unauthorized') return 'blocked';
  if (status === 'failed' || status === 'invalid') return 'failed';
  if (status === 'needs_user' || status === 'confirmation_required') return 'needs_user';
  const pending = plan.some((step, index) => index > currentIndex && ['pending', 'running', 'waiting'].includes(step.status));
  if (status === 'completed') return pending ? 'active' : 'completed';
  if (status === 'waiting' || status === 'externally_pending') return 'waiting';
  return 'active';
}

/**
 * Reconciles one canonical capability result into the persisted first-class
 * agent goal. This is deliberately a projection over existing agent state,
 * not a second agent runtime or execution authority.
 */
export async function syncAgentGoalFromCapabilityResult(input: {
  phone: string;
  goalId: string;
  capability: string;
  action: string;
  idempotencyKey?: string;
  outcome: CanonicalCapabilityOutcome;
}): Promise<void> {
  if (!input.goalId || !input.phone) return;
  const db = await getDb();
  const goalRow = db.exec('SELECT * FROM agent_goals WHERE id = ? AND phone = ? LIMIT 1', [input.goalId, input.phone])[0]?.values?.[0] as any[] | undefined;
  if (!goalRow) return;

  const columns = db.exec('PRAGMA table_info(agent_goals)')[0]?.values?.map((row: any[]) => String(row[1])) || [];
  const indexOf = (name: string) => columns.indexOf(name);
  const currentPlanRaw = indexOf('plan_json') >= 0 ? goalRow[indexOf('plan_json')] : null;
  let plan: { objective?: string; currentStep?: number; status?: string; steps?: GoalPlanStep[] } = {};
  try { plan = currentPlanRaw ? JSON.parse(String(currentPlanRaw)) : {}; } catch { plan = {}; }
  const steps = Array.isArray(plan.steps) ? plan.steps.map(step => ({ ...step })) : [];
  const capabilityKey = `${input.capability}:${input.action}`.toLowerCase();
  let stepIndex = steps.findIndex(step => String(step.action || '').toLowerCase().includes(capabilityKey) || String(step.action || '').toLowerCase().includes(input.action.toLowerCase()));
  if (stepIndex < 0) stepIndex = steps.findIndex(step => ['pending', 'running', 'waiting'].includes(step.status));
  if (stepIndex < 0 && input.outcome.status !== 'completed') stepIndex = Math.max(0, Number(plan.currentStep || 0));

  const projectedStepStatus = mapStepStatus(input.outcome.status);
  if (stepIndex >= 0) {
    steps[stepIndex] = {
      ...steps[stepIndex],
      status: projectedStepStatus,
      evidence: input.outcome.evidence || steps[stepIndex].evidence,
      result: (input.outcome.message || `Capability ${input.capability}:${input.action} returned ${input.outcome.status}`).slice(0, 1200),
    };
  }

  const nextStep = stepIndex >= 0 && projectedStepStatus === 'completed' ? Math.min(steps.length, stepIndex + 1) : Math.max(0, stepIndex);
  const status = goalStatus(input.outcome.status, steps, nextStep - 1);
  const nextActionAt = status === 'active' || status === 'waiting' ? new Date(Date.now() + 30000).toISOString() : null;
  const completedAt = status === 'completed' ? new Date().toISOString() : null;
  const failureReason = ['failed', 'blocked'].includes(status) ? String(input.outcome.message || input.outcome.status).slice(0, 1000) : null;
  const summary = String(input.outcome.message || `Capability ${input.capability}:${input.action} returned ${input.outcome.status}.`).slice(0, 1000);
  plan.steps = steps;
  plan.currentStep = nextStep;
  plan.status = status;

  const updateFields: string[] = ['status = ?', 'next_action_at = ?', 'completed_at = ?', 'failure_reason = ?', 'summary = ?', 'plan_json = ?', 'updated_at = CURRENT_TIMESTAMP'];
  const params: unknown[] = [status, nextActionAt, completedAt, failureReason, summary, JSON.stringify(plan)];
  db.run(`UPDATE agent_goals SET ${updateFields.join(', ')} WHERE id = ? AND phone = ?`, [...params, input.goalId, input.phone]);

  const eventKey = input.idempotencyKey ? `agent-outcome:${input.goalId}:${input.idempotencyKey}` : `agent-outcome:${input.goalId}:${input.capability}:${input.action}:${input.outcome.status}:${stepIndex}`;
  const existing = db.exec('SELECT id FROM agent_goal_events WHERE idempotency_key = ? LIMIT 1', [eventKey])[0]?.values?.[0];
  if (!existing) {
    db.run('INSERT INTO agent_goal_events (goal_id, action, tool, result, evidence, detail, idempotency_key) VALUES (?, ?, ?, ?, ?, ?, ?)', [
      input.goalId,
      `${input.capability}:${input.action}`,
      'execute_capability',
      mapOutcome(input.outcome.status),
      input.outcome.evidence || `canonical_capability:${input.capability}:${input.action}:${input.outcome.status}`,
      summary,
      eventKey,
    ]);
  }
  saveDb();

  if (['needs_user', 'blocked', 'completed'].includes(status)) {
    try {
      const runtime = await import('./agentRuntime.js');
      const updated = await runtime.getAgentGoal(input.phone, input.goalId);
      if (updated) await runtime.notifyGoalIfNeeded(updated);
    } catch {
      // Notification failure must never roll back canonical goal state.
    }
  }
}

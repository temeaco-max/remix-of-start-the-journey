/* Copyright (c) 2026 temeaco-max. All rights reserved. Proprietary and confidential. */
/**
 * Domain event subscribers for agent goal lifecycle (AGENTS.md §31).
 *
 * These projections were previously inline dependencies of the request
 * orchestrator. They are now subscribers of GOAL_STATE_CHANGED so that a
 * notification or memory failure can never roll back canonical goal state.
 */

import { subscribeToDomainEvent, DomainEvents } from './domainEvents.js';

let registered = false;

export function registerGoalEventSubscribers(): void {
  if (registered) return;
  registered = true;

  subscribeToDomainEvent(DomainEvents.GOAL_STATE_CHANGED, async (event) => {
    const { phone, goalId, status, objective } = event.payload as {
      phone?: string; goalId?: string; status?: string; objective?: string;
    };
    if (!phone || !goalId) return;
    try {
      const runtime = await import('./agentRuntime.js');
      const projected = await runtime.getAgentGoal(phone, goalId);
      if (projected) await runtime.notifyGoalIfNeeded(projected);
      if (status === 'completed' && objective) {
        const memory = await import('./memoryProfile.js');
        await memory.recordMemoryFact(phone, 'completed_outcome', objective, 'verified', { sourceRef: `agent_goal:${goalId}` });
      }
    } catch (error) {
      console.error('[goalEventSubscribers] projection failed:', error instanceof Error ? error.message : error);
    }
  });
}

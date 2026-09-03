/* Copyright (c) 2026 temeaco-max. All rights reserved. Proprietary and confidential. */
/**
 * Domain event subscribers for the economic request lifecycle (AGENTS.md §31).
 *
 * Downstream reaction to request state changes (notifications, fulfilment
 * follow-up) is enqueued as durable work instead of being executed inline by
 * the request path. A slow or failing worker therefore cannot block or roll
 * back canonical request state, and the existing durable-job workers can
 * consume this work even across restarts.
 */

import { subscribeToDomainEvent, DomainEvents } from './domainEvents.js';
import { enqueueDurableJob } from './durableJobQueue.js';

let registered = false;

export function registerRequestEventSubscribers(): void {
  if (registered) return;
  registered = true;

  subscribeToDomainEvent(DomainEvents.REQUEST_CREATED, (event) => {
    const { requestId, phone } = event.payload as { requestId?: string; phone?: string };
    if (!requestId) return;
    enqueueDurableJob({
      kind: 'request.lifecycle_reaction',
      payload: { requestId, phone: phone || null, trigger: 'created' },
      maxAttempts: 5,
    }).catch(error => {
      console.error('[requestEventSubscribers] enqueue failed for request.created:', error instanceof Error ? error.message : error);
    });
  });

  subscribeToDomainEvent(DomainEvents.REQUEST_STATE_CHANGED, (event) => {
    const { requestId, phone, toStatus } = event.payload as { requestId?: string; phone?: string; toStatus?: string };
    if (!requestId) return;
    enqueueDurableJob({
      kind: 'request.lifecycle_reaction',
      payload: { requestId, phone: phone || null, trigger: 'state_changed', toStatus: toStatus || null },
      maxAttempts: 5,
    }).catch(error => {
      console.error('[requestEventSubscribers] enqueue failed for request.state_changed:', error instanceof Error ? error.message : error);
    });
  });
}

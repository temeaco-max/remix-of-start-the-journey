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

  subscribeToDomainEvent(DomainEvents.PROVIDER_INQUIRY_CREATED, (event) => {
    const { inquiryId, ownerPhone, expiresAt } = event.payload as { inquiryId?: string; ownerPhone?: string; expiresAt?: string | null };
    if (!inquiryId || !ownerPhone) return;
    const deadline = expiresAt ? Date.parse(String(expiresAt)) : NaN;
    // No deadline → nothing to schedule; the polling pass remains the safety net for both cases.
    if (!Number.isFinite(deadline)) return;
    enqueueDurableJob({
      kind: 'provider_inquiry.deadline',
      payload: { inquiryId, ownerPhone, expiresAt },
      delayMs: Math.max(0, deadline - Date.now()),
      maxAttempts: 5,
    }).catch(error => {
      console.error('[requestEventSubscribers] enqueue failed for provider_inquiry.created:', error instanceof Error ? error.message : error);
    });
  });

  subscribeToDomainEvent(DomainEvents.EXECUTION_REQUEST_CREATED, (event) => {
    const { executionId } = event.payload as { executionId?: string };
    if (!executionId) return;
    // Small delay lets any synchronous caller that dispatches inline run first,
    // so this scheduled dispatch becomes a no-op when it already happened.
    enqueueDurableJob({
      kind: 'execution.dispatch',
      payload: { executionId },
      delayMs: 50,
      maxAttempts: 5,
    }).catch(error => {
      console.error('[requestEventSubscribers] enqueue failed for execution.request_created:', error instanceof Error ? error.message : error);
    });
  });
}

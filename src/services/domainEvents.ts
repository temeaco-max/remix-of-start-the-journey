/* Copyright (c) 2026 temeaco-max. All rights reserved. Proprietary and confidential. */
/**
 * Canonical in-process domain event bus.
 *
 * This is the single event authority for Kurukoo (AGENTS.md §31). Services that
 * change canonical state EMIT events here instead of synchronously calling
 * unrelated downstream services (notifications, memory, analytics). Subscribers
 * register for the events they care about; a subscriber failure must never
 * roll back or block the emitting transaction.
 *
 * Events are fire-and-forget within the process. Durable cross-restart work
 * should additionally be enqueued via durableJobQueue.ts by the subscriber.
 */

export interface DomainEvent<T = Record<string, unknown>> {
  type: string;
  payload: T;
  occurredAt: string;
}

type DomainEventHandler = (event: DomainEvent) => void | Promise<void>;

const handlers = new Map<string, Set<DomainEventHandler>>();

export const DomainEvents = Object.freeze({
  GOAL_STATE_CHANGED: 'goal.state_changed',
  REQUEST_CREATED: 'request.created',
  REQUEST_STATE_CHANGED: 'request.state_changed',
  PROVIDERS_MATCHED: 'request.providers_matched',
  NOTIFICATION_REQUESTED: 'notification.requested',
  PROVIDER_INQUIRY_CREATED: 'provider_inquiry.created',
  EXECUTION_REQUEST_CREATED: 'execution.request_created',
});

export function emitDomainEvent(type: string, payload: Record<string, unknown> = {}): void {
  const event: DomainEvent = { type, payload, occurredAt: new Date().toISOString() };
  const subscribers = handlers.get(type);
  if (!subscribers || subscribers.size === 0) return;
  for (const handler of subscribers) {
    try {
      const result = handler(event);
      if (result && typeof (result as Promise<void>).catch === 'function') {
        (result as Promise<void>).catch(error => {
          console.error(`[domainEvents] subscriber failed for ${type}:`, error instanceof Error ? error.message : error);
        });
      }
    } catch (error) {
      console.error(`[domainEvents] subscriber threw for ${type}:`, error instanceof Error ? error.message : error);
    }
  }
}

export function subscribeToDomainEvent(type: string, handler: DomainEventHandler): () => void {
  let set = handlers.get(type);
  if (!set) { set = new Set(); handlers.set(type, set); }
  set.add(handler);
  return () => { set!.delete(handler); };
}

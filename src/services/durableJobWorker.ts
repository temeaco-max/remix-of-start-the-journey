/* Copyright (c) 2026 temeaco-max. All rights reserved. Proprietary and confidential. */
/**
 * Durable-job worker (AGENTS.md §31, §33).
 *
 * Drains `request.lifecycle_reaction` jobs that request events enqueue via
 * `requestEventSubscribers`. A worker that reacts to a request lifecycle
 * change therefore runs asynchronously and can be retried independently of
 * the canonical request path — the request succeeds even if this reaction
 * fails, and the reaction is durable across restarts.
 */
import { claimDurableJob, completeDurableJob, failDurableJob, releaseExpiredDurableJobLeases } from './durableJobQueue.js';
import { sendFcmPush } from './pushNotifications.js';
import { processProviderInquiryDeadline } from './providerInquiryFollowUpService.js';
import { dispatchExecutionRequest } from './executionConnector.js';

const WORKER_ID = 'durable-job-worker';
const WORKER_KINDS = ['request.lifecycle_reaction', 'provider_inquiry.deadline', 'provider_inquiry.response_notification', 'execution.dispatch'];
const JOB_LEASE_MS = 2 * 60 * 1000; // 2 minutes per job

interface RequestLifecycleReactionPayload {
  requestId?: string;
  phone?: string;
  trigger?: string;
  toStatus?: string;
}

function reactionTitle(payload: RequestLifecycleReactionPayload): string {
  const trigger = String(payload.trigger || 'state_changed');
  const toStatus = String(payload.toStatus || '').replace(/_/g, ' ').trim();
  if (trigger === 'created') return 'Request received';
  if (toStatus) return `Request ${toStatus}`;
  return 'Request updated';
}

function reactionBody(payload: RequestLifecycleReactionPayload): string {
  const trigger = String(payload.trigger || 'state_changed');
  if (trigger === 'created') return 'Kurukoo has your request and is getting to work. You can follow progress in Activity.';
  const toStatus = String(payload.toStatus || '').replace(/_/g, ' ').trim();
  if (toStatus) return `Your request moved to: ${toStatus}. Open Activity to see what is next.`;
  return 'There is an update on your request. Open Activity to review it.';
}

/**
 * Handle one request lifecycle reaction job. A job with no reachable phone is
 * treated as a no-op (nothing to notify) and completed cleanly.
 */
async function handleRequestLifecycleReaction(job: { payload: Record<string, unknown> }): Promise<void> {
  const payload = (job.payload || {}) as RequestLifecycleReactionPayload;
  const phone = String(payload.phone || '').trim();
  if (!phone) return; // no delivery target → nothing to react with
  const requestId = String(payload.requestId || '');
  await sendFcmPush(
    phone,
    reactionTitle(payload),
    reactionBody(payload),
    '/activity',
    {
      contextId: requestId ? `request:${requestId}` : undefined,
      objectType: 'request',
      objectId: requestId || undefined,
      canonicalAction: 'notification.open',
      availableAction: 'review',
    },
  );
}

async function handleProviderInquiryDeadline(job: { payload: Record<string, unknown> }): Promise<void> {
  const payload = (job.payload || {}) as { inquiryId?: string; ownerPhone?: string; expiresAt?: string };
  const inquiryId = String(payload.inquiryId || '').trim();
  const ownerPhone = String(payload.ownerPhone || '').trim();
  if (!inquiryId || !ownerPhone) return; // missing target → nothing to react with
  await processProviderInquiryDeadline(ownerPhone, inquiryId);
}

async function handleExecutionDispatch(job: { payload: Record<string, unknown> }): Promise<void> {
  const executionId = String((job.payload || {}).executionId || '').trim();
  if (!executionId) return; // missing target → nothing to dispatch
  // Idempotent: already-advanced executions return unchanged, so a scheduled
  // dispatch is a no-op when a synchronous caller already dispatched inline.
  await dispatchExecutionRequest(executionId);
}

async function handleProviderInquiryResponseNotification(job: { payload: Record<string, unknown> }): Promise<void> {
  const payload = (job.payload || {}) as {
    inquiryId?: string; ownerPhone?: string; requestId?: string | null; fulfilmentId?: string;
    providerLabel?: string; offerTitle?: string | null; priceMinor?: number | null; currency?: string | null; responseKey?: string;
  };
  const inquiryId = String(payload.inquiryId || '').trim();
  const ownerPhone = String(payload.ownerPhone || '').trim();
  if (!inquiryId || !ownerPhone) return; // missing target → nothing to notify
  const providerLabel = String(payload.providerLabel || 'Your provider');
  const requestId = String(payload.requestId || '');
  const offerTitle = payload.offerTitle ? String(payload.offerTitle) : '';
  const price = payload.priceMinor != null ? ` (${String(payload.currency || '')} ${payload.priceMinor})` : '';
  const body = offerTitle
    ? `${providerLabel} replied with a recorded option: ${offerTitle}${price}. Review the same request in Kurukoo before approving anything.`
    : `${providerLabel} replied. The response is recorded against your request and needs your review before any booking, payment, or fulfilment is claimed.`;
  await sendFcmPush(ownerPhone, `${providerLabel} replied`, body, requestId ? `/app/requests?request=${encodeURIComponent(requestId)}` : '/app/requests', {
    contextId: requestId ? `request:${requestId}` : `fulfilment:${String(payload.fulfilmentId || '')}`,
    canonicalAction: requestId ? 'economic_request.open' : 'fulfilment.open',
    objectType: requestId ? 'economic_request' : 'fulfilment',
    objectId: requestId || String(payload.fulfilmentId || ''),
    ownerScope: ownerPhone,
    idempotencyKey: `provider-response-attention:${inquiryId}:${String(payload.responseKey || '')}`,
    surface: 'requests',
  });
}

async function handleJob(job: { kind: string; payload: Record<string, unknown> }): Promise<void> {
  if (job.kind === 'provider_inquiry.deadline') {
    await handleProviderInquiryDeadline(job);
    return;
  }
  if (job.kind === 'provider_inquiry.response_notification') {
    await handleProviderInquiryResponseNotification(job);
    return;
  }
  if (job.kind === 'execution.dispatch') {
    await handleExecutionDispatch(job);
    return;
  }
  await handleRequestLifecycleReaction(job);
}

/**
 * Run one worker cycle: release expired leases, then claim and process up to
 * `batch` of the worker's job kinds. Returns the number of jobs processed.
 * Processing is isolated per job — a failure marks the job for retry and does
 * not stop the cycle.
 */
export async function runDurableJobCycle(batch = 20): Promise<number> {
  const safeBatch = Math.max(1, Math.min(100, Math.floor(Number(batch) || 20)));
  await releaseExpiredDurableJobLeases();
  let processed = 0;
  for (let i = 0; i < safeBatch; i++) {
    const job = await claimDurableJob(WORKER_ID, WORKER_KINDS, JOB_LEASE_MS);
    if (!job) break;
    processed += 1;
    try {
      await handleJob(job);
      await completeDurableJob(job.id, WORKER_ID);
    } catch (error) {
      const detail = error instanceof Error ? error.message : String(error);
      console.error(`[DurableJobWorker] job ${job.id} (${job.kind}) failed:`, detail);
      try {
        await failDurableJob({ id: job.id, attempts: job.attempts, maxAttempts: job.maxAttempts }, WORKER_ID, error);
      } catch (failError) {
        console.error('[DurableJobWorker] failed to mark job failed:', failError instanceof Error ? failError.message : failError);
      }
    }
  }
  return processed;
}
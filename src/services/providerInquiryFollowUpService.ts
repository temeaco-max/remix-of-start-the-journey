/* Copyright (c) 2026 temeaco-max. All rights reserved. Proprietary and confidential. */
import { expireDueProviderInquiries, expireProviderInquiryById, getFulfilment, type ProviderInquiry } from './canonicalFulfilmentService.js';
import { sendFcmPush } from './pushNotifications.js';

export interface ProviderInquiryFollowUpResult {
  scannedAt: string;
  markedNoResponse: number;
  inquiryIds: string[];
}

/**
 * Marks only inquiries that have passed their explicit response deadline. The
 * operation is idempotent: once an inquiry is `no_response`, later passes do
 * not change it or queue another customer notification.
 */
export async function notifyProviderInquiryNoResponse(inquiry: ProviderInquiry): Promise<void> {
  const fulfilment = await getFulfilment(inquiry.ownerPhone, inquiry.fulfilmentId);
  const requestId = fulfilment?.economicRequestId;
  const provider = inquiry.providerName || 'The selected provider';
  const link = requestId ? `/app/requests?request=${encodeURIComponent(requestId)}` : '/app/requests';
  await sendFcmPush(
    inquiry.ownerPhone,
    'Provider has not replied',
    `${provider} did not reply by the agreed response deadline. Kurukoo has not confirmed availability, price, a repair slot, or a booking.`,
    link,
    {
      canonicalAction: 'provider_inquiry.no_response',
      objectType: 'provider_inquiry',
      objectId: inquiry.id,
      ownerScope: inquiry.ownerPhone,
      idempotencyKey: `provider-inquiry-timeout:${inquiry.id}`,
      surface: 'requests',
    },
  ).catch(() => false);
}

/**
 * Durable, idempotent reaction to a single provider-inquiry response deadline:
 * expire it if it is still pending/sent and overdue, then notify once. Used by
 * the scheduled `provider_inquiry.deadline` durable jobs (AGENTS.md §31, §33).
 * Returns the expired inquiry or null when it was not due / already resolved.
 */
export async function processProviderInquiryDeadline(ownerPhone: string, inquiryId: string, observedAt?: string): Promise<ProviderInquiry | null> {
  const expired = await expireProviderInquiryById(ownerPhone, inquiryId, observedAt);
  if (!expired) return null;
  await notifyProviderInquiryNoResponse(expired);
  return expired;
}

export async function runProviderInquiryFollowUpPass(input: { now?: string; limit?: number } = {}): Promise<ProviderInquiryFollowUpResult> {
  const scannedAt = input.now || new Date().toISOString();
  const expired = await expireDueProviderInquiries({ now: scannedAt, limit: input.limit });
  for (const inquiry of expired) {
    await notifyProviderInquiryNoResponse(inquiry);
  }
  return { scannedAt, markedNoResponse: expired.length, inquiryIds: expired.map((inquiry) => inquiry.id) };
}

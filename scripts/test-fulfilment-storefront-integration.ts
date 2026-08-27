import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const dbPath = path.join(os.tmpdir(), `kurukoo-fulfilment-storefront-${process.pid}-${Date.now()}.sqlite`);
process.env.DB_PATH = dbPath;
process.env.NODE_ENV = 'production';
process.env.KURUKOO_PAY_PROVIDER = 'sandbox';
process.env.FF_SMS = 'true';
process.env.AFRICASTALKING_API_KEY = 'test-provider-key';
process.env.AFRICASTALKING_USERNAME = 'sandbox';
process.env.AFRICASTALKING_SENDER_ID = 'kurukoo';

let outboundCalls = 0;
const originalFetch = globalThis.fetch;
globalThis.fetch = async (input, init) => {
  outboundCalls += 1;
  assert.match(String(input), /api\.sandbox\.africastalking\.com\/version1\/messaging$/, 'Sandbox SMS delivery must use the sandbox endpoint.');
  assert.equal(init?.method, 'POST');
  return new Response(JSON.stringify({
    SMSMessageData: {
      Message: 'Sent to 1/1 Total Cost: NGN 0.0000',
      Recipients: [{ status: 'Sent', number: '+2347000000412', messageId: `at-outbound-${outboundCalls}`, cost: 'NGN 0.0000' }],
    },
  }), { status: 201, headers: { 'Content-Type': 'application/json' } });
};

const { getDb, saveDb } = await import('../src/database.js');
const { startStorefrontSession, advanceStorefront, resumeStorefrontFromRequest } = await import('../src/services/agenticStorefront.js');
const { getFulfilmentForEconomicRequest, getOpenProviderInquiry, getFulfilment, listOffers } = await import('../src/services/canonicalFulfilmentService.js');
const { getChannelDeliveryState } = await import('../src/services/channelDeliveryState.js');
const { getEconomicRequest } = await import('../src/services/skillFlows.js');
const { handleSmsWebhook } = await import('../src/channels/sms.js');
const { processCanonicalChatTurn } = await import('../src/services/canonicalChatTurnService.js');
const { getInternalNotifications } = await import('../src/services/pushNotifications.js');

const db = await getDb();
const customerPhone = '+2347000000411';
const providerPhone = '+2347000000412';
const hotelProviderPhone = '+2347000000413';

db.run(
  `INSERT OR REPLACE INTO memory_profiles (phone, name, location, country, verified_provider, points_balance)
   VALUES (?, ?, 'Ikeja', 'ng', ?, 30)`,
  [customerPhone, 'Fulfilment Customer', 0]
);
db.run(
  `INSERT OR REPLACE INTO memory_profiles (phone, name, location, country, verified_provider, points_balance)
   VALUES (?, ?, 'Ikeja', 'ng', ?, 30)`,
  [providerPhone, 'Fulfilment Provider', 1]
);
db.run(
  `INSERT INTO skills (phone, skill, is_available, hourly_rate, rating, jobs_completed, operation_mode)
   VALUES (?, 'plumber', 1, 0, 4.8, 10, 'mobile')`,
  [providerPhone]
);
db.run(
  `INSERT INTO memory_profiles (phone, name, location, country, verified_provider, points_balance)
   VALUES (?, ?, 'Lagos', 'ng', ?, 30)`,
  [hotelProviderPhone, 'Lagos Stay Provider', 1]
);
db.run(
  `INSERT INTO skills (phone, skill, is_available, hourly_rate, rating, jobs_completed, operation_mode)
   VALUES (?, 'hotel_deals', 1, 0, 4.7, 8, 'stationary')`,
  [hotelProviderPhone]
);

try {
  const initial = await startStorefrontSession(customerPhone, 'find_worker', { service: 'plumber', location: 'Ikeja' }, { forceNew: true });
  assert.ok(initial.requestId, 'A real storefront request must receive an Economic Request identity.');
  assert.equal(initial.skill, 'find_worker');
  assert.ok(initial.providers?.some(provider => provider.phone === providerPhone), 'The canonical storefront must project the verified local provider without treating it as a quote.');

  const requestId = initial.requestId!;
  const fulfilment = await getFulfilmentForEconomicRequest(customerPhone, requestId);
  assert.equal(fulfilment?.mechanism, 'local_discovery', 'The current find_worker flow must bind to the reusable fulfilment mechanism.');
  assert.equal(fulfilment?.requirements.service, 'plumber');
  assert.equal(fulfilment?.requirements.location, 'Ikeja');

  const selected = await advanceStorefront(customerPhone, requestId, { providerPhone }, 'select_provider');
  assert.match(selected.message, /selected/i, 'Provider selection must stay explicit before a quote is requested.');

  const inquiryCard = await advanceStorefront(customerPhone, requestId, {}, 'request_quote');
  assert.equal(inquiryCard.title, 'Quote inquiry sent');
  assert.match(inquiryCard.message, /accepted the message/i, 'The customer must see the true provider-network acceptance state.');
  assert.equal(outboundCalls, 1, 'A consented quote request must produce exactly one provider SMS attempt.');

  const inquiry = await getOpenProviderInquiry(customerPhone, fulfilment!.id, providerPhone);
  assert.equal(inquiry?.status, 'sent', 'The provider inquiry must move to sent only after a provider-network acceptance response.');
  assert.ok(inquiry?.sentAt, 'The canonical inquiry must retain a send timestamp.');

  const dispatch = await getChannelDeliveryState('sms', 'africastalking', 'at-outbound-1');
  assert.equal(dispatch?.status, 'submitted', 'The outbound provider message must retain the provider message ID and initial status.');

  const deliveryReport = await handleSmsWebhook({ id: 'at-outbound-1', status: 'Success', phoneNumber: providerPhone, networkCode: '99999' });
  assert.equal(deliveryReport.deliveryStatus, 'delivered', 'A carrier delivery report must update the same durable dispatch record.');
  assert.equal((await getChannelDeliveryState('sms', 'africastalking', 'at-outbound-1'))?.status, 'delivered');

  const reference = inquiry!.id.replace(/[^a-z0-9]/gi, '').slice(-12).toUpperCase();
  const providerReply = await handleSmsWebhook({
    From: providerPhone,
    Body: `Available today. Final price is NGN 25,000. Delivery available. Reference: KQ${reference}`,
    MessageId: 'at-inbound-001',
  });
  assert.equal(providerReply.status, 'success');
  assert.match(providerReply.response || '', /recorded/i);

  const respondedFulfilment = await getFulfilment(customerPhone, fulfilment!.id);
  assert.equal(respondedFulfilment?.status, 'offers_ready', 'A provider response must create a canonical offer and advance fulfilment truthfully.');
  const offers = await listOffers(customerPhone, fulfilment!.id);
  assert.equal(offers.length, 1, 'Exactly one provider response must materialize into one canonical offer.');
  assert.equal(offers[0]?.priceMinor, 2_500_000, 'Provider price parsing must retain NGN minor units.');
  assert.equal(offers[0]?.evidenceLevel, 'provider_confirmed');

  const quotedRequest = await getEconomicRequest(requestId);
  assert.equal(quotedRequest?.status, 'quoted', 'A provider-confirmed price must advance the same customer request into quote review.');
  assert.equal(quotedRequest?.quote?.source, 'provider_sms_response');
  assert.equal(quotedRequest?.quote?.amount_minor, 2_500_000);

  const resumed = await resumeStorefrontFromRequest(customerPhone, requestId);
  assert.equal(resumed?.title, 'Provider quote', 'The request surface must show the provider-confirmed quote after the reply is recorded.');
  assert.match(resumed?.message || '', /25[,_]?000/i);

  const attention = (await getInternalNotifications(customerPhone, 10)).find(notification => notification.object_type === 'economic_request' && notification.object_id === requestId);
  assert.ok(attention, 'A provider reply must queue owner-scoped attention for the same Economic Request.');
  assert.equal(attention?.canonical_action, 'economic_request.open', 'Provider attention must retain the canonical request return action.');
  const returned = await processCanonicalChatTurn({
    phone: customerPhone,
    message: 'Review the provider update',
    channel: 'web',
    conversationId: 'fulfilment-provider-return',
    contextAction: {
      type: 'resume_canonical_context',
      contextId: attention!.context_id || `request:${requestId}`,
      conversationId: attention!.conversation_id || 'fulfilment-provider-return',
      canonicalAction: attention!.canonical_action!,
      objectType: attention!.object_type!,
      objectId: attention!.object_id!,
    },
  });
  assert.equal(returned.cardData?.type, 'agentic_storefront', 'Provider attention must reopen the live storefront decision surface, not a generic context shell.');
  assert.equal(returned.cardData?.requestId, requestId, 'Provider attention must return to the original Economic Request.');
  assert.equal(returned.cardData?.title, 'Provider quote', 'Provider attention must return to the currently verified quote decision.');
  assert.equal(returned.cardData?.resumedFromNotification, true, 'The returned decision must visibly preserve the notification continuation.');

  const duplicateReply = await handleSmsWebhook({
    From: providerPhone,
    Body: `Available today. Final price is NGN 25,000. Delivery available. Reference: KQ${reference}`,
    MessageId: 'at-inbound-001',
  });
  assert.equal(duplicateReply.duplicate, true, 'A replayed inbound provider callback must not create another offer or notification.');
  assert.equal((await listOffers(customerPhone, fulfilment!.id)).length, 1, 'Inbound callback replay must remain idempotent.');

  const replayedInquiryCard = await advanceStorefront(customerPhone, requestId, {}, 'request_quote');
  assert.equal(replayedInquiryCard.title, 'Quote inquiry already sent');
  assert.equal(outboundCalls, 1, 'A replayed customer action must never send a duplicate real-world SMS.');

  const accommodation = await startStorefrontSession(customerPhone, 'hotel_deals', {
    objective: 'Somewhere to stay in Lagos tomorrow', location: 'Lagos', timing: 'tomorrow', budget: 75000,
  }, { forceNew: true });
  assert.equal(accommodation.stage, 'catalog_match', 'A fully stated accommodation outcome must reach verified provider discovery.');
  assert.ok(accommodation.providers?.some(provider => provider.phone === hotelProviderPhone), 'Accommodation discovery must surface the verified provider without claiming availability.');
  const accommodationRequestId = accommodation.requestId!;
  await advanceStorefront(customerPhone, accommodationRequestId, { providerPhone: hotelProviderPhone }, 'select_provider');
  const accommodationInquiryCard = await advanceStorefront(customerPhone, accommodationRequestId, {}, 'request_quote');
  assert.equal(accommodationInquiryCard.title, 'Quote inquiry sent', 'The selected accommodation provider must receive the same canonical availability inquiry path.');
  const accommodationFulfilment = await getFulfilmentForEconomicRequest(customerPhone, accommodationRequestId);
  assert.equal(accommodationFulfilment?.mechanism, 'booking', 'Accommodation must use the shared booking fulfilment mechanism.');
  const accommodationInquiry = await getOpenProviderInquiry(customerPhone, accommodationFulfilment!.id, hotelProviderPhone);
  assert.match(accommodationInquiry?.question || '', /tomorrow/i, 'The accommodation provider inquiry must retain the user’s collected timing.');
  assert.equal(outboundCalls, 2, 'The explicit accommodation inquiry must make one additional provider contact attempt.');

  console.log(JSON.stringify({
    passed: true,
    requestId,
    fulfilmentId: fulfilment?.id,
    inquiryId: inquiry?.id,
    truths: [
      'provider selected by explicit customer action',
      'one outbound provider SMS accepted and delivery-reported',
      'provider reply persisted as evidence',
      'provider-confirmed quote attached to the same request',
      'customer notification queued and reopens the same quote decision in Chat',
      'outbound and inbound replays do not duplicate side effects',
      'accommodation progresses from discovery to the shared booking inquiry with retained timing',
    ],
  }, null, 2));
} finally {
  globalThis.fetch = originalFetch;
  saveDb(true);
  try { fs.rmSync(dbPath, { force: true }); } catch { /* temporary database cleanup is best-effort */ }
}

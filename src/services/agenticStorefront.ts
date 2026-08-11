/**
 * Agentic Storefront — Blueprint §55.6 / §55.4
 * Show-don't-tell interactive cards driven by conversation stages.
 * Reuses economic_requests + find_worker + escrow — no parallel identity tables.
 */
import crypto from 'crypto';
import { createEconomicRequest, getEconomicRequest, transitionEconomicRequest, getEconomicCategory } from './skillFlows.js';
import { find_worker } from './find-worker.js';
import { lockEscrowForEconomicRequest, completeEconomicRequest } from './tradeEngine.js';
import { createOpenIntention, getResumableIntention } from './deferredRequestService.js';

export type StorefrontStage =
  | 'intent_extraction'
  | 'slot_fill'
  | 'catalog_match'
  | 'quote_review'
  | 'escrow_confirm'
  | 'fulfillment'
  | 'complete'
  | 'deferred';

export interface StorefrontCard {
  type: 'agentic_storefront';
  stage: StorefrontStage;
  skill: string;
  category?: string;
  requestId?: string;
  title: string;
  message: string;
  fields?: Array<{ key: string; label: string; required?: boolean; value?: string }>;
  actions?: Array<{ id: string; label: string; style?: 'primary' | 'secondary' | 'danger' }>;
  providers?: Array<{ phone: string; name: string; rating: number; hourly_rate: number }>;
  quote?: { amount_minor: number; currency: string };
  escrowProtected: boolean;
  progress: number; // 0-100
}

const STAGE_PROGRESS: Record<StorefrontStage, number> = {
  intent_extraction: 10,
  slot_fill: 30,
  catalog_match: 50,
  quote_review: 70,
  escrow_confirm: 85,
  fulfillment: 95,
  complete: 100,
  deferred: 40,
};

const ACTIVE_RESUME_STATUSES = new Set([
  'requested',
  'awaiting_match',
  'partially_matched',
  'matched',
  'quoting',
  'quoted',
  'awaiting_confirmation',
  'reserved',
  'payment_pending',
  'paid',
  'in_fulfillment',
]);

function requiredSlots(skill: string): Array<{ key: string; label: string; required?: boolean }> {
  const category = getEconomicCategory(skill) || '';
  if (category === 'transport-mobility' || skill.includes('ride') || skill.includes('okada') || skill.includes('keke')) {
    return [
      { key: 'origin', label: 'Pickup location', required: true },
      { key: 'destination', label: 'Drop-off', required: true },
      { key: 'vehicle', label: 'Okada / Keke / Taxi', required: false },
    ];
  }
  if (category === 'food-drink' || skill.includes('food') || skill.includes('order')) {
    return [
      { key: 'items', label: 'What do you want?', required: true },
      { key: 'quantity', label: 'Quantity', required: false },
      { key: 'location', label: 'Delivery area', required: true },
    ];
  }
  if (category === 'repairs-maintenance' || skill.includes('repair') || skill.includes('plumber') || skill.includes('worker')) {
    return [
      { key: 'service', label: 'What needs doing?', required: true },
      { key: 'location', label: 'Where?', required: true },
      { key: 'urgency', label: 'Now / Today / Flexible', required: false },
    ];
  }
  return [
    { key: 'service', label: 'What do you need?', required: true },
    { key: 'location', label: 'Location', required: true },
  ];
}

function missingRequired(fields: Array<{ key: string; required?: boolean }>, requirements: Record<string, unknown>): string[] {
  return fields
    .filter((f) => f.required)
    .map((f) => f.key)
    .filter((key) => {
      const v = requirements[key];
      return v === undefined || v === null || (typeof v === 'string' && !String(v).trim());
    });
}

function cardFromQuoted(req: Awaited<ReturnType<typeof getEconomicRequest>>): StorefrontCard | null {
  if (!req) return null;
  const quote = (req.quote || {}) as Record<string, unknown>;
  const amountMinor =
    typeof quote.amount_minor === 'number' ? Number(quote.amount_minor) : 500;
  const providerName = String(quote.provider_name || 'Provider');
  const rating = Number(quote.rating || 5);
  return {
    type: 'agentic_storefront',
    stage: 'quote_review',
    skill: req.skill,
    category: req.category,
    requestId: req.id,
    title: 'Provider match',
    message: `Found **${providerName}** (${rating}★). Quote: **${amountMinor} Points/₦**. Confirm to lock escrow — nothing is paid out until you are satisfied.`,
    providers: [
      {
        phone: String(req.providerPhone || ''),
        name: providerName,
        rating,
        hourly_rate: amountMinor,
      },
    ],
    quote: { amount_minor: amountMinor, currency: String(quote.currency || 'NGN') },
    actions: [
      { id: 'confirm_escrow', label: 'Confirm & lock escrow', style: 'primary' },
      { id: 'cancel', label: 'Cancel', style: 'secondary' },
    ],
    escrowProtected: true,
    progress: STAGE_PROGRESS.quote_review,
  };
}

function cardFromFulfillment(req: NonNullable<Awaited<ReturnType<typeof getEconomicRequest>>>): StorefrontCard {
  return {
    type: 'agentic_storefront',
    stage: 'fulfillment',
    skill: req.skill,
    category: req.category,
    requestId: req.id,
    title: 'Escrow locked',
    message: 'Payment is held safely. The provider can proceed; funds release after you confirm completion.',
    actions: [
      { id: 'confirm_complete', label: 'Mark completed', style: 'primary' },
      { id: 'dispute', label: 'Report a problem', style: 'danger' },
    ],
    escrowProtected: true,
    progress: STAGE_PROGRESS.fulfillment,
  };
}

function cardFromDeferred(req: NonNullable<Awaited<ReturnType<typeof getEconomicRequest>>>): StorefrontCard {
  return {
    type: 'agentic_storefront',
    stage: 'deferred',
    skill: req.skill,
    category: req.category,
    requestId: req.id,
    title: 'Still looking',
    message:
      'Your request is still open. Kurukoo is re-checking for providers. You can cancel or wait for a match notification.',
    actions: [{ id: 'cancel', label: 'Cancel request', style: 'secondary' }],
    escrowProtected: true,
    progress: STAGE_PROGRESS.deferred,
  };
}

/** Rebuild a storefront card from an existing economic_request (no new DB row). */
export async function resumeStorefrontFromRequest(
  phone: string,
  requestId: string
): Promise<StorefrontCard | null> {
  const req = await getEconomicRequest(requestId);
  if (!req || req.phone !== phone) return null;
  if (!ACTIVE_RESUME_STATUSES.has(req.status)) return null;

  if (['quoted', 'awaiting_confirmation', 'matched', 'quoting'].includes(req.status) && req.quote) {
    return cardFromQuoted(req);
  }
  if (['paid', 'in_fulfillment', 'reserved', 'payment_pending'].includes(req.status)) {
    return cardFromFulfillment(req);
  }
  if (['awaiting_match', 'partially_matched', 'requested'].includes(req.status)) {
    // Re-run match path without recreating the request
    return advanceStorefront(phone, requestId, req.requirements || {});
  }
  return cardFromDeferred(req);
}

/**
 * If the user has a resumable open intention or active economic request,
 * return a storefront card instead of starting a brand-new session.
 */
export async function tryResumeStorefront(phone: string, preferredSkill?: string): Promise<StorefrontCard | null> {
  const intention = await getResumableIntention(phone);
  if (intention?.economic_request_id) {
    const resumed = await resumeStorefrontFromRequest(phone, String(intention.economic_request_id));
    if (resumed) {
      if (preferredSkill && resumed.skill && preferredSkill !== resumed.skill) {
        // Different skill requested — do not force-bind
        return null;
      }
      resumed.message =
        intention.status === 'fulfilled' && intention.resolution === 'provider_matched'
          ? `Welcome back — a provider matched while you were away. ${resumed.message}`
          : `Picking up your open request. ${resumed.message}`;
      return resumed;
    }
  }

  // Fallback: scan recent economic_requests for this phone still in flight
  try {
    const { getDb } = await import('../database.js');
    const db = await getDb();
    const skillFilter = preferredSkill ? preferredSkill.trim().toLowerCase() : null;
    const stmt = skillFilter
      ? db.prepare(`
          SELECT id FROM economic_requests
          WHERE phone = ? AND lower(skill) = ? AND status IN ('requested','awaiting_match','partially_matched','matched','quoting','quoted','awaiting_confirmation','reserved','payment_pending','paid','in_fulfillment')
          ORDER BY updated_at DESC LIMIT 1
        `)
      : db.prepare(`
          SELECT id FROM economic_requests
          WHERE phone = ? AND status IN ('requested','awaiting_match','partially_matched','matched','quoting','quoted','awaiting_confirmation','reserved','payment_pending','paid','in_fulfillment')
          ORDER BY updated_at DESC LIMIT 1
        `);
    if (skillFilter) stmt.bind([phone, skillFilter]);
    else stmt.bind([phone]);
    if (stmt.step()) {
      const id = String(stmt.getAsObject().id || '');
      stmt.free();
      if (id) return resumeStorefrontFromRequest(phone, id);
    } else {
      stmt.free();
    }
  } catch {
    /* ignore resume scan errors */
  }
  return null;
}

/** Start a storefront session from a classified skill. */
export async function startStorefrontSession(
  phone: string,
  skill: string,
  seedRequirements: Record<string, unknown> = {}
): Promise<StorefrontCard> {
  const normalized = skill.trim().toLowerCase() || 'find_worker';

  // Prefer resume over duplicate open requests for the same skill
  const existing = await tryResumeStorefront(phone, normalized);
  if (existing) return existing;

  const category = getEconomicCategory(normalized) || 'gigs-microtasks';
  const fields = requiredSlots(normalized);
  const missing = missingRequired(fields, seedRequirements);

  const request = await createEconomicRequest({
    id: crypto.randomUUID(),
    phone,
    skill: normalized,
    requirements: seedRequirements,
  });

  if (missing.length) {
    return {
      type: 'agentic_storefront',
      stage: 'slot_fill',
      skill: normalized,
      category,
      requestId: request.id,
      title: 'A few details',
      message: `To match the right provider, I still need: ${missing.join(', ')}. Reply in chat or fill the fields.`,
      fields: fields.map((f) => ({
        ...f,
        value: seedRequirements[f.key] != null ? String(seedRequirements[f.key]) : undefined,
      })),
      actions: [
        { id: 'submit_slots', label: 'Continue', style: 'primary' },
        { id: 'cancel', label: 'Cancel', style: 'secondary' },
      ],
      escrowProtected: true,
      progress: STAGE_PROGRESS.slot_fill,
    };
  }

  return advanceStorefront(phone, request.id, seedRequirements);
}

/** Advance after user supplies slots or confirms an action. */
export async function advanceStorefront(
  phone: string,
  requestId: string,
  patch: Record<string, unknown> = {},
  action?: string
): Promise<StorefrontCard> {
  const req = await getEconomicRequest(requestId);
  if (!req || req.phone !== phone) {
    return {
      type: 'agentic_storefront',
      stage: 'intent_extraction',
      skill: 'unknown',
      title: 'Session expired',
      message: 'That request is no longer available. Tell me what you need and we will start again.',
      escrowProtected: true,
      progress: 0,
    };
  }

  if (action === 'cancel') {
    try {
      await transitionEconomicRequest(requestId, 'cancelled');
    } catch { /* */ }
    return {
      type: 'agentic_storefront',
      stage: 'complete',
      skill: req.skill,
      requestId,
      title: 'Cancelled',
      message: 'Request cancelled. Nothing was charged.',
      escrowProtected: true,
      progress: 100,
    };
  }

  const requirements = { ...req.requirements, ...patch };
  const fields = requiredSlots(req.skill);
  const missing = missingRequired(fields, requirements);

  if (missing.length) {
    return {
      type: 'agentic_storefront',
      stage: 'slot_fill',
      skill: req.skill,
      category: req.category,
      requestId,
      title: 'Almost there',
      message: `Still need: ${missing.join(', ')}.`,
      fields: fields.map((f) => ({
        ...f,
        value: requirements[f.key] != null ? String(requirements[f.key]) : undefined,
      })),
      actions: [
        { id: 'submit_slots', label: 'Continue', style: 'primary' },
        { id: 'cancel', label: 'Cancel', style: 'secondary' },
      ],
      escrowProtected: true,
      progress: STAGE_PROGRESS.slot_fill,
    };
  }

  if (action === 'confirm_escrow') {
    const amount =
      typeof (req.quote as any)?.amount_minor === 'number'
        ? Number((req.quote as any).amount_minor)
        : typeof patch.amount_minor === 'number'
          ? Number(patch.amount_minor)
          : undefined;
    const locked = await lockEscrowForEconomicRequest(requestId, amount);
    if (!locked.success) {
      return {
        type: 'agentic_storefront',
        stage: 'escrow_confirm',
        skill: req.skill,
        requestId,
        title: 'Could not lock escrow',
        message: locked.message,
        quote: req.quote as any,
        actions: [
          { id: 'confirm_escrow', label: 'Retry', style: 'primary' },
          { id: 'cancel', label: 'Cancel', style: 'secondary' },
        ],
        escrowProtected: true,
        progress: STAGE_PROGRESS.escrow_confirm,
      };
    }
    return {
      type: 'agentic_storefront',
      stage: 'fulfillment',
      skill: req.skill,
      requestId,
      title: 'Escrow locked',
      message: `Payment is held safely. Order ${locked.orderId}. The provider can proceed; funds release after you confirm completion.`,
      actions: [
        { id: 'confirm_complete', label: 'Mark completed', style: 'primary' },
        { id: 'dispute', label: 'Report a problem', style: 'danger' },
      ],
      escrowProtected: true,
      progress: STAGE_PROGRESS.fulfillment,
    };
  }

  if (action === 'confirm_complete') {
    const done = await completeEconomicRequest(requestId, { confirmed_by: phone });
    return {
      type: 'agentic_storefront',
      stage: 'complete',
      skill: req.skill,
      requestId,
      title: done.success ? 'Completed' : 'Update needed',
      message: done.message,
      escrowProtected: true,
      progress: 100,
    };
  }

  // Match providers
  const location =
    typeof requirements.location === 'string'
      ? requirements.location
      : typeof requirements.origin === 'string'
        ? String(requirements.origin)
        : undefined;

  const match = await find_worker({ skill: req.skill, location, max: 5 });

  if (match.count === 0) {
    await createOpenIntention(phone, req.skill, JSON.stringify(requirements), {
      skill: req.skill,
      location,
      ttlDays: 7,
      economicRequestId: requestId,
    }).catch(() => null);
    try {
      await transitionEconomicRequest(requestId, 'awaiting_match');
    } catch { /* */ }
    return {
      type: 'agentic_storefront',
      stage: 'deferred',
      skill: req.skill,
      category: req.category,
      requestId,
      title: 'No provider right now',
      message:
        'I could not find an available provider yet. Your request is deferred — Kurukoo will re-check and notify you when someone matches.',
      actions: [{ id: 'cancel', label: 'Cancel request', style: 'secondary' }],
      escrowProtected: true,
      progress: STAGE_PROGRESS.deferred,
    };
  }

  const top = match.providers[0];
  const amountMinor = top.hourly_rate > 0 ? Math.round(top.hourly_rate) : 500;

  try {
    if (req.status === 'requested' || req.status === 'awaiting_match') {
      await transitionEconomicRequest(requestId, 'matched', { providerPhone: top.phone });
    }
    if (['matched', 'partially_matched', 'quoting'].includes(req.status) || req.status === 'requested' || req.status === 'awaiting_match') {
      try {
        await transitionEconomicRequest(requestId, 'quoting');
      } catch { /* */ }
      await transitionEconomicRequest(requestId, 'quoted', {
        providerPhone: top.phone,
        quote: {
          amount_minor: amountMinor,
          currency: 'NGN',
          provider_name: top.name,
          rating: top.rating,
        },
      });
    }
  } catch {
    /* status may already be ahead */
  }

  return {
    type: 'agentic_storefront',
    stage: 'quote_review',
    skill: req.skill,
    category: req.category,
    requestId,
    title: 'Provider match',
    message: `Found **${top.name}** (${top.rating}★). Quote: **${amountMinor} Points/₦**. Confirm to lock escrow — nothing is paid out until you are satisfied.`,
    providers: match.providers.map((p) => ({
      phone: p.phone,
      name: p.name,
      rating: p.rating,
      hourly_rate: p.hourly_rate,
    })),
    quote: { amount_minor: amountMinor, currency: 'NGN' },
    actions: [
      { id: 'confirm_escrow', label: 'Confirm & lock escrow', style: 'primary' },
      { id: 'cancel', label: 'Cancel', style: 'secondary' },
    ],
    escrowProtected: true,
    progress: STAGE_PROGRESS.quote_review,
  };
}

/** Lightweight card for intent router (no DB write until user continues). */
export function previewStorefrontCard(skill: string): StorefrontCard {
  const normalized = skill.trim().toLowerCase() || 'find_worker';
  const fields = requiredSlots(normalized);
  return {
    type: 'agentic_storefront',
    stage: 'intent_extraction',
    skill: normalized,
    category: getEconomicCategory(normalized) || undefined,
    title: 'Let us sort this',
    message: 'I will collect the essentials, match a verified provider, show a quote, then lock escrow only after you confirm.',
    fields,
    actions: [
      { id: 'start', label: 'Continue', style: 'primary' },
    ],
    escrowProtected: true,
    progress: STAGE_PROGRESS.intent_extraction,
  };
}

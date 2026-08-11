import { Router } from 'express';
import crypto from 'crypto';
import { type AuthRequest } from '../middleware/auth.js';
import {
  ECONOMIC_CATEGORIES,
  getEconomicCategory,
  getDefaultCapabilities,
  getSkillFlow,
  createEconomicRequest,
  getEconomicRequest,
  transitionEconomicRequest,
  type EconomicRequestStatus,
} from '../services/skillFlows.js';
import {
  runOrchestrationPass,
  lockEscrowForEconomicRequest,
  completeEconomicRequest,
} from '../services/tradeEngine.js';
import {
  runDailyMemoryDecay,
  runWeeklyMemoryPrune,
  runMemoryCrystallize,
  getWorkingContextInspector,
  ensureLivingMemorySchema,
} from '../services/livingMemoryEngine.js';

const router = Router();

const CATEGORY_REQUIREMENTS: Record<string, string[]> = {
  'transport-mobility': ['origin', 'destination'],
  'food-drink': ['items'],
  'repairs-maintenance': ['service'],
  'personal-care': ['service'],
  'emergency-dispatch': ['location'],
  'health-medical': ['service'],
  'education-learning': ['subject'],
  'events-entertainment': ['event'],
  'accommodation-lodging': ['location'],
  'agriculture-produce': ['product'],
  'professional-services': ['service'],
  'spiritual-religious': ['service'],
  'freelance-services': ['service'],
  'gigs-microtasks': ['task'],
  'errands-delivery': ['task'],
  'communication-telecom': ['service'],
  'logistics-freight': ['origin', 'destination'],
  'tourism-travel': ['destination'],
  'creative-arts': ['service'],
  'security-safety': ['service'],
  'fitness-coaching': ['service'],
  'nightlife-lounges': ['event'],
  'betting-gaming': ['activity'],
  'money-circle': ['purpose'],
  'classifieds-marketplace': ['item'],
  'price-check': ['item'],
  'government-civic': ['service'],
  'community-neighbourhood': ['purpose'],
  'cravings-streetfood': ['item'],
  'reach-reference': ['query'],
  'language-services': ['service'],
  'automotive-mechanics': ['service'],
  'finance-tax': ['service'],
  'pet-animal-care': ['service'],
  'digital-services': ['service'],
  'property-real-estate': ['property_type'],
  'childcare-nanny': ['service'],
  'beauty-wellness': ['service'],
  'cleaning-sanitation': ['service'],
  'home-automation': ['service'],
  'legal-compliance': ['service'],
  'fashion-apparel': ['service'],
  'solar-energy': ['service'],
  'event-rentals': ['item'],
  'water-beverage': ['item'],
  'sports-recreation': ['activity'],
};

const ALLOWED_STATUSES = new Set<EconomicRequestStatus>([
  'requested', 'awaiting_match', 'partially_matched', 'matched', 'quoting', 'quoted',
  'awaiting_confirmation', 'reserved', 'payment_pending', 'paid', 'in_fulfillment',
  'fulfilled', 'completed', 'cancelled', 'disputed', 'failed', 'abandoned',
]);

function phoneFrom(req: AuthRequest): string | null {
  return req.user?.phone ? String(req.user.phone) : null;
}

function cleanRequirements(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {};
  const input = value as Record<string, unknown>;
  return Object.fromEntries(
    Object.entries(input).filter(([key]) => /^[a-zA-Z][a-zA-Z0-9_]{0,63}$/.test(key))
  );
}

function validateRequirements(
  category: string,
  requirements: Record<string, unknown>,
  allowPartial: boolean
): string[] {
  if (allowPartial) return [];
  return (CATEGORY_REQUIREMENTS[category] || []).filter((key) => {
    const value = requirements[key];
    return value === undefined || value === null || (typeof value === 'string' && !value.trim());
  });
}

router.get('/categories', async (_req: AuthRequest, res) =>
  res.json({
    success: true,
    categories: ECONOMIC_CATEGORIES.map((category) => ({
      id: category,
      requiredRequirements: CATEGORY_REQUIREMENTS[category] || [],
      capabilities: getDefaultCapabilities(category),
    })),
  })
);

router.get('/skills/:skill/flow', async (req: AuthRequest, res) => {
  const skill = String(req.params.skill || '').trim();
  const category = getEconomicCategory(skill);
  if (!category) return res.status(404).json({ success: false, error: 'Unknown economic skill' });
  const flow = await getSkillFlow(skill);
  res.json({
    success: true,
    skill,
    category,
    flow,
    requiredRequirements: CATEGORY_REQUIREMENTS[category] || [],
    capabilities: flow?.capabilities || getDefaultCapabilities(category),
  });
});

router.post('/', async (req: AuthRequest, res) => {
  const phone = phoneFrom(req);
  const skill = typeof req.body?.skill === 'string' ? req.body.skill.trim().toLowerCase() : '';
  const category = getEconomicCategory(skill);
  if (!phone) return res.status(401).json({ success: false, error: 'Authenticated phone is required' });
  if (!skill || !category) return res.status(400).json({ success: false, error: 'A supported economic skill is required' });
  const requirements = cleanRequirements(req.body?.requirements);
  const missing = validateRequirements(category, requirements, req.body?.allowPartial === true);
  if (missing.length) return res.status(422).json({ success: false, error: 'More information is required', missing });
  try {
    const request = await createEconomicRequest({
      id: crypto.randomUUID(),
      phone,
      skill,
      requirements,
      amount:
        typeof req.body?.amount === 'number' && Number.isFinite(req.body.amount)
          ? req.body.amount
          : undefined,
    });
    res.status(201).json({ success: true, request });
  } catch (error) {
    console.error('[EconomicRequest] create failed:', error);
    res.status(500).json({ success: false, error: 'Unable to create economic request' });
  }
});

router.get('/:id', async (req: AuthRequest, res) => {
  const phone = phoneFrom(req);
  if (!phone) return res.status(401).json({ success: false, error: 'Authenticated phone is required' });
  const request = await getEconomicRequest(String(req.params.id || ''));
  if (!request || request.phone !== phone) {
    return res.status(404).json({ success: false, error: 'Economic request not found' });
  }
  res.json({ success: true, request });
});

router.post('/:id/transition', async (req: AuthRequest, res) => {
  const phone = phoneFrom(req);
  if (!phone) return res.status(401).json({ success: false, error: 'Authenticated phone is required' });
  const request = await getEconomicRequest(String(req.params.id || ''));
  if (!request || request.phone !== phone) {
    return res.status(404).json({ success: false, error: 'Economic request not found' });
  }
  const status = String(req.body?.status || '').trim() as EconomicRequestStatus;
  if (!ALLOWED_STATUSES.has(status)) {
    return res.status(400).json({ success: false, error: 'Unsupported request status' });
  }
  try {
    const updated = await transitionEconomicRequest(request.id, status, {
      providerPhone: typeof req.body?.providerPhone === 'string' ? req.body.providerPhone : undefined,
      quote: req.body?.quote && typeof req.body.quote === 'object' ? req.body.quote : undefined,
      fulfillment:
        req.body?.fulfillment && typeof req.body.fulfillment === 'object' ? req.body.fulfillment : undefined,
    });
    res.json({ success: true, request: updated });
  } catch (error) {
    res.status(409).json({
      success: false,
      error: error instanceof Error ? error.message : 'Invalid request transition',
    });
  }
});

/** Lock escrow after user confirms quote (payment_pending / paid path). */
router.post('/:id/escrow', async (req: AuthRequest, res) => {
  const phone = phoneFrom(req);
  if (!phone) return res.status(401).json({ success: false, error: 'Authenticated phone is required' });
  const request = await getEconomicRequest(String(req.params.id || ''));
  if (!request || request.phone !== phone) {
    return res.status(404).json({ success: false, error: 'Economic request not found' });
  }
  const amount =
    typeof req.body?.amount_minor === 'number' && Number.isInteger(req.body.amount_minor)
      ? req.body.amount_minor
      : undefined;
  const result = await lockEscrowForEconomicRequest(request.id, amount);
  res.status(result.success ? 200 : 409).json(result);
});

/** Mark request fulfilled/completed after delivery confirmation. */
router.post('/:id/complete', async (req: AuthRequest, res) => {
  const phone = phoneFrom(req);
  if (!phone) return res.status(401).json({ success: false, error: 'Authenticated phone is required' });
  const request = await getEconomicRequest(String(req.params.id || ''));
  if (!request || request.phone !== phone) {
    return res.status(404).json({ success: false, error: 'Economic request not found' });
  }
  const evidence =
    req.body?.evidence && typeof req.body.evidence === 'object' ? req.body.evidence : undefined;
  const result = await completeEconomicRequest(request.id, evidence);
  res.status(result.success ? 200 : 409).json(result);
});

/** Worker: match + quote open requests + release eligible escrow. */
router.post('/orchestration/run', async (_req: AuthRequest, res) => {
  try {
    const result = await runOrchestrationPass();
    res.json({ success: true, result });
  } catch (error) {
    console.error('[Orchestration] pass failed:', error);
    res.status(500).json({ success: false, error: 'Orchestration pass failed' });
  }
});

/** Living Memory lifecycle jobs (cron-friendly). */
router.post('/memory/lifecycle', async (req: AuthRequest, res) => {
  try {
    await ensureLivingMemorySchema();
    const job = String(req.body?.job || 'all');
    const out: Record<string, unknown> = {};
    if (job === 'decay' || job === 'all') out.decay = await runDailyMemoryDecay();
    if (job === 'prune' || job === 'all') out.prune = await runWeeklyMemoryPrune();
    if (job === 'crystallize' || job === 'all') out.crystallize = await runMemoryCrystallize();
    res.json({ success: true, ...out });
  } catch (error) {
    console.error('[LivingMemory] lifecycle failed:', error);
    res.status(500).json({ success: false, error: 'Memory lifecycle failed' });
  }
});

/** Inspect recent working-context audits for the authenticated user. */
router.get('/memory/inspector', async (req: AuthRequest, res) => {
  const phone = phoneFrom(req);
  if (!phone) return res.status(401).json({ success: false, error: 'Authenticated phone is required' });
  try {
    const rows = await getWorkingContextInspector(phone);
    res.json({ success: true, audits: rows });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Unable to load memory inspector' });
  }
});

export default router;

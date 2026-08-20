import { getEconomicCategory, getSkillCapabilities, getSkillRequirements } from './skillFlows.js';
import { getSkillExtension } from './skillCatalogueConvergence.js';
import { getConvergedSkillBehaviour } from './skillBehaviourConvergence.js';

export type SkillExecutionMode = 'economic' | 'information' | 'coordination' | 'safety';
export type SkillExecutionTruth = 'provider_required' | 'source_required' | 'user_confirmation_required' | 'system_action';

export interface SkillExecutionContract {
  skill: string;
  category: string | null;
  mode: SkillExecutionMode;
  requirements: Array<{ key: string; label: string; required: boolean }>;
  capabilities: string[];
  instructions: string[];
  completionEvidence: string[];
  failureModes: string[];
  memoryKeys: string[];
  truthBoundary: SkillExecutionTruth[];
  requiresProvider: boolean;
  requiresPayment: boolean;
  requiresEvidence: boolean;
  completionCondition: string;
}

const INFORMATION_CATEGORIES = new Set([
  'government-civic', 'reach-reference', 'language-services', 'price-check',
]);
const SAFETY_CATEGORIES = new Set(['emergency-dispatch', 'security-safety']);
const COORDINATION_CATEGORIES = new Set([
  'health-medical', 'education-learning', 'events-entertainment', 'tourism-travel',
  'community-neighbourhood', 'government-civic', 'accommodation-lodging', 'sports-recreation',
]);

function inferMode(category: string | null, skill: string): SkillExecutionMode {
  if (SKILL_MODE_OVERRIDES[skill]) return SKILL_MODE_OVERRIDES[skill];
  if (category && SAFETY_CATEGORIES.has(category)) return 'safety';
  if (category && INFORMATION_CATEGORIES.has(category)) return 'information';
  if (category && COORDINATION_CATEGORIES.has(category)) return 'coordination';
  return 'economic';
}

const SKILL_MODE_OVERRIDES: Record<string, SkillExecutionMode> = {
  bin_day: 'information',
  memory: 'coordination',
  reminder: 'coordination',
  notification: 'coordination',
  notifications: 'coordination',
  support_triage: 'coordination',
  provider_onboarding: 'coordination',
  provider_profile_setup: 'coordination',
  autonomous_agent: 'coordination',
  prayer_partner: 'coordination',
  prayer: 'coordination',
};

function truthBoundary(mode: SkillExecutionMode, requiresProvider: boolean, requiresEvidence: boolean, requiresPayment: boolean): SkillExecutionTruth[] {
  const result: SkillExecutionTruth[] = [];
  if (requiresProvider) result.push('provider_required');
  if (mode === 'information') result.push('source_required');
  if (requiresPayment) result.push('user_confirmation_required');
  if (mode === 'safety' || mode === 'coordination') result.push('system_action');
  if (requiresEvidence) result.push('user_confirmation_required');
  return Array.from(new Set(result));
}

export function buildSkillExecutionContract(skill: string): SkillExecutionContract {
  const normalized = skill.trim().toLowerCase();
  const extension = getSkillExtension(normalized);
  const pack = getConvergedSkillBehaviour(normalized);
  const category = extension?.category || getEconomicCategory(normalized);
  const mode = extension?.mode || inferMode(category, normalized);
  const baseRequirements = getSkillRequirements(normalized);
  const requirements = extension?.requirements?.length
    ? extension.requirements.map((label, index) => ({ key: `skill_requirement_${index + 1}`, label, required: true }))
    : baseRequirements.map(requirement => ({
      key: requirement.key,
      label: requirement.label,
      required: Boolean(requirement.required),
    }));
  const baseCapabilities = getSkillCapabilities(normalized).map(String);
  const capabilities = extension?.capabilities?.length ? extension.capabilities.map(String) : baseCapabilities;
  const requiresProvider = extension
    ? mode === 'economic' || capabilities.some(capability => ['availability', 'fulfillment', 'tracking', 'quote', 'reservation', 'discovery'].includes(capability))
    : mode === 'economic' || ['reservation', 'availability', 'fulfillment', 'tracking', 'quote'].some(capability => capabilities.includes(capability));
  const commercial = pack?.commercial || '';
  const requiresPayment = capabilities.includes('payment') || capabilities.includes('escrow') || ['transaction', 'mixed', 'quote'].includes(commercial);
  const requiresEvidence = capabilities.includes('evidence') || Boolean(pack?.completionEvidence?.length) || Boolean(extension?.evidence?.length);
  const completionEvidence = pack?.completionEvidence?.length
    ? [...pack.completionEvidence]
    : extension?.evidence?.length
      ? [...extension.evidence]
      : mode === 'information'
        ? ['authoritative source or persisted answer']
        : mode === 'coordination'
          ? ['canonical action state or confirmation']
          : ['provider fulfilment or explicit canonical completion state'];
  const failureModes = pack?.failureModes?.length
    ? [...pack.failureModes]
    : extension?.failureModes?.length
      ? [...extension.failureModes]
      : [
        mode === 'information' ? 'authoritative source unavailable' :
          mode === 'safety' ? 'service or safety route unavailable' :
            requiresProvider ? 'no eligible provider or provider unavailable' : 'required information missing',
      ];
  const memoryKeys = Array.from(new Set([
    'location', 'country', 'timezone', 'preferred_channel', 'communication_style',
    ...(extension?.memoryKeys || []),
    ...(['transport-mobility', 'tourism-travel', 'government-civic', 'property-real-estate'].includes(category || '') ? ['address'] : []),
    ...((mode === 'economic' || mode === 'coordination') ? ['preferences'] : []),
  ]));
  return {
    skill: normalized,
    category: category || null,
    mode,
    requirements,
    capabilities,
    instructions: pack?.instructions?.length ? [...pack.instructions] : [],
    completionEvidence,
    failureModes,
    memoryKeys,
    truthBoundary: truthBoundary(mode, requiresProvider, requiresEvidence, requiresPayment),
    requiresProvider,
    requiresPayment,
    requiresEvidence,
    completionCondition: mode === 'information'
      ? 'Respond only from authoritative or explicitly qualified source information.'
      : mode === 'safety'
        ? 'Do not claim a response or dispatch occurred without canonical evidence.'
        : mode === 'coordination'
          ? 'Complete only when the canonical coordination/action state confirms the outcome.'
          : 'Complete only when provider, payment, execution and required evidence states are satisfied.',
  };
}

export function buildSkillExecutionContractPrompt(contract: SkillExecutionContract): string {
  return [
    '--- Canonical skill execution contract (never expose internal labels) ---',
    `skill=${contract.skill}`,
    `mode=${contract.mode}`,
    `provider_required=${contract.requiresProvider}`,
    `payment_required=${contract.requiresPayment}`,
    `evidence_required=${contract.requiresEvidence}`,
    `truth_boundary=${contract.truthBoundary.join(',')}`,
    `required_information=${contract.requirements.filter(item => item.required).map(item => item.label).join('; ') || 'none'}`,
    `completion_evidence=${contract.completionEvidence.join('; ')}`,
    `failure_modes=${contract.failureModes.join('; ')}`,
    `completion_condition=${contract.completionCondition}`,
    '--- End canonical skill execution contract ---',
  ].join('\n');
}

export function getSkillExecutionContracts(skills: string[]): SkillExecutionContract[] {
  return Array.from(new Set(skills.map(skill => skill.trim().toLowerCase()).filter(Boolean))).map(buildSkillExecutionContract);
}

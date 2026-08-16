import { getEconomicCategory, getKnownSkills, getSkillCapabilities, getSkillFlow, getSkillRequirements, type EconomicCapability, type SkillFlow } from './skillFlows.js';
import { getFeatureRegistryReadiness } from './featureFlags.js';

export type OutcomeCompletenessStatus = 'IMPLEMENTED_AND_VERIFIED' | 'REPOSITORY_READY_EXTERNAL_ACTIVATION' | 'FOUNDATION_ONLY' | 'MISSING_REPOSITORY_IMPLEMENTATION';

export interface OutcomeCompletenessRow {
  skill: string;
  family: string;
  mode: SkillFlow['mode'];
  status: OutcomeCompletenessStatus;
  canonicalOwner: string[];
  chatEntry: string;
  contextRequirements: string[];
  actors: string[];
  capabilities: EconomicCapability[];
  canonicalObjects: string[];
  lifecycleStates: string[];
  executionBoundaries: string[];
  evidenceRequirements: string[];
  uiRepresentations: string[];
  channelRepresentations: string[];
  linkedDeviceBehaviour: string;
  notificationContinuation: string;
  failureRecovery: string[];
  externalActivationDependencies: string[];
  missingImplementation: string[];
  paymentModel: string;
  fulfillmentInstruction: string;
}

const BASE_LIFECYCLE = ['requested', 'clarifying', 'matched', 'quoting', 'awaiting_confirmation', 'executing', 'evidence_pending', 'completed', 'failed', 'cancelled'];
const ECONOMIC_LIFECYCLE = ['requested', 'awaiting_match', 'partially_matched', 'matched', 'quoting', 'quoted', 'awaiting_confirmation', 'reserved', 'payment_pending', 'paid', 'in_fulfillment', 'fulfilled', 'completed', 'cancelled', 'disputed', 'failed', 'abandoned'];
const INFORMATION_LIFECYCLE = ['requested', 'clarifying', 'answered', 'follow_up', 'completed', 'failed'];
const SAFETY_LIFECYCLE = ['requested', 'triage', 'consent_pending', 'coordinating', 'evidence_pending', 'completed', 'failed', 'cancelled'];
const COORDINATION_LIFECYCLE = ['requested', 'clarifying', 'inviting', 'matched', 'scheduled', 'executing', 'evidence_pending', 'completed', 'failed', 'cancelled'];

function ownersFor(flow: SkillFlow, capabilities: EconomicCapability[]): string[] {
  const owners = ['canonicalChatTurnService.ts', 'intentRouter.ts', 'skillFlows.ts'];
  if (flow.mode === 'economic' || capabilities.some((capability) => ['discovery', 'quote', 'payment', 'escrow', 'fulfillment', 'tracking', 'evidence', 'completion'].includes(capability))) owners.push('economicRequestService.ts', 'economicParticipants.ts', 'executionConnector.ts');
  if (capabilities.includes('discovery')) owners.push('discoveryNetwork.ts', 'providerDiscovery.ts');
  if (capabilities.includes('payment') || capabilities.includes('escrow')) owners.push('paymentRoutes.ts', 'escrow.ts');
  if (capabilities.includes('tracking')) owners.push('backgroundWorkers.ts', 'notificationQueue.ts');
  if (capabilities.includes('evidence')) owners.push('evidenceService.ts');
  if (flow.mode === 'safety') owners.push('safetyService.ts');
  if (flow.mode === 'coordination') owners.push('agentRuntime.ts', 'notificationQueue.ts');
  return [...new Set(owners)];
}

function lifecycleFor(flow: SkillFlow, capabilities: EconomicCapability[]): string[] {
  if (flow.mode === 'safety') return SAFETY_LIFECYCLE;
  if (flow.mode === 'information') return INFORMATION_LIFECYCLE;
  if (flow.mode === 'coordination') return COORDINATION_LIFECYCLE;
  if (capabilities.includes('payment') || capabilities.includes('fulfillment')) return ECONOMIC_LIFECYCLE;
  return BASE_LIFECYCLE;
}

function activationDependencies(capabilities: EconomicCapability[]): string[] {
  const dependencies = new Set<string>();
  if (capabilities.includes('discovery')) dependencies.add('nearby_pulse or another configured/cached geospatial provider for live spatial results');
  if (capabilities.includes('payment') || capabilities.includes('escrow')) dependencies.add('configured payment provider and verified webhook/settlement boundary');
  if (capabilities.includes('tracking')) dependencies.add('configured execution/dispatch provider or local operator evidence');
  if (capabilities.includes('evidence')) dependencies.add('authenticated evidence capture and canonical storage authority');
  if (capabilities.includes('completion')) dependencies.add('notification/continuation adapter remains provider-dependent for push and external channels');
  return [...dependencies];
}

export async function buildOutcomeCompletenessMatrix(country = 'ng'): Promise<OutcomeCompletenessRow[]> {
  getFeatureRegistryReadiness(country); // Evaluate the canonical registry during generation so readiness semantics remain loaded from one owner.
  const rows: OutcomeCompletenessRow[] = [];
  for (const skill of getKnownSkills()) {
    const flow = await getSkillFlow(skill);
    const category = getEconomicCategory(skill) || 'uncategorized';
    const capabilities = getSkillCapabilities(skill);
    const requirements = getSkillRequirements(skill);
    const lifecycle = flow ? lifecycleFor(flow, capabilities) : BASE_LIFECYCLE;
    const owners = flow ? ownersFor(flow, capabilities) : ['canonicalChatTurnService.ts', 'skillFlows.ts'];
    const missingImplementation = flow ? [] : ['canonical skill flow definition'];
    const external = activationDependencies(capabilities);
    const hasExternalBoundary = external.length > 0;
    rows.push({
      skill,
      family: category,
      mode: flow?.mode || 'economic',
      status: missingImplementation.length ? 'MISSING_REPOSITORY_IMPLEMENTATION' : hasExternalBoundary ? 'REPOSITORY_READY_EXTERNAL_ACTIVATION' : 'IMPLEMENTED_AND_VERIFIED',
      canonicalOwner: owners,
      chatEntry: 'Chat → canonicalChatTurnService → Brain/context arbitration → canonical service',
      contextRequirements: requirements.map((requirement) => `${requirement.key}${requirement.required ? ' (required)' : ''}: ${requirement.label}`),
      actors: flow?.mode === 'information' ? ['requesting user', 'canonical information source'] : flow?.mode === 'safety' ? ['requesting user', 'consented safety contact', 'authorized coordinator'] : ['requesting user', 'candidate/provider/participant', 'authorized coordinator'],
      capabilities,
      canonicalObjects: flow?.mode === 'information' ? ['conversation', 'memory context', 'notification'] : ['conversation', 'Economic Request', 'participants/offers', 'evidence', 'notification', 'memory/follow-up'],
      lifecycleStates: lifecycle,
      executionBoundaries: ['Brain interprets, arbitrates context and plans', 'canonical domain services authorize and mutate state', 'irreversible execution requires explicit provider/evidence boundary', 'no external completion is claimed without provider evidence'],
      evidenceRequirements: ['intent and requirements captured in conversation', 'actor/provider identity and authorization where applicable', 'offer/quote/payment/execution evidence for economic outcomes', 'completion or failure evidence before final state'],
      uiRepresentations: ['Chat message and progress state', 'canonical request/offer/action card when applicable', 'notification or continuation card', 'failure/recovery action in the same conversation'],
      channelRepresentations: ['Web/PWA Chat uses the canonical turn protocol', 'WhatsApp/Telegram/SMS/USSD/channel adapters mirror the same canonical turn where configured', 'linked devices remain channel transport, not a second domain engine'],
      linkedDeviceBehaviour: 'Channel adapters preserve user, conversation and canonical object identity; unavailable adapters remain explicitly unavailable.',
      notificationContinuation: 'Internal notification queue and Chat continuation are canonical; push/channel delivery requires configured provider evidence.',
      failureRecovery: ['Clarify missing requirements', 'preserve unrelated active contexts', 'allow cancellation or retry through canonical services', 'surface provider/payment/dispatch failures truthfully', 'resume via conversation or notification without duplicating the request'],
      externalActivationDependencies: external,
      missingImplementation,
      paymentModel: flow?.payment_model || 'Not defined',
      fulfillmentInstruction: flow?.fulfillment_instructions || 'No canonical fulfillment instruction defined',
    });
  }
  return rows;
}

export function summarizeOutcomeCompleteness(rows: OutcomeCompletenessRow[]) {
  return {
    generatedAt: new Date().toISOString(),
    skillCount: rows.length,
    familyCount: new Set(rows.map((row) => row.family)).size,
    statusCounts: rows.reduce<Record<string, number>>((counts, row) => { counts[row.status] = (counts[row.status] || 0) + 1; return counts; }, {}),
    missingImplementationCount: rows.filter((row) => row.missingImplementation.length).length,
    rowsWithExternalActivationDependencies: rows.filter((row) => row.externalActivationDependencies.length).length,
  };
}

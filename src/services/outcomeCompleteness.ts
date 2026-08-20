import { getEconomicCategory, getSkillCapabilities, getSkillFlow, getSkillRequirements, type SkillFlow } from './skillFlows.js';
import { getFeatureRegistryReadiness } from './featureFlags.js';
import { ensureCapabilityFoundation } from './capabilityFoundation.js';
import { resolveSkillCapabilityComposition } from './capabilityFoundationIntegration.js';
import { getAllConvergedSkillNames, getConvergedSkillBehaviour } from './skillBehaviourConvergence.js';
import { buildSkillExecutionContract, type SkillExecutionMode } from './skillExecutionContract.js';

export type OutcomeCompletenessStatus = 'IMPLEMENTED_AND_VERIFIED' | 'REPOSITORY_READY_EXTERNAL_ACTIVATION' | 'FOUNDATION_ONLY' | 'MISSING_REPOSITORY_IMPLEMENTATION';

export interface OutcomeCompletenessRow {
  skill: string;
  family: string;
  mode: SkillFlow['mode'] | SkillExecutionMode;
  status: OutcomeCompletenessStatus;
  canonicalOwner: string[];
  chatEntry: string;
  contextRequirements: string[];
  actors: string[];
  capabilities: string[];
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

function ownersFor(mode: SkillExecutionMode, capabilities: string[]): string[] {
  const owners = ['canonicalChatTurnService.ts', 'intentRouter.ts', 'skillBehaviourConvergence.ts', 'skillExecutionContract.ts', 'capabilityRegistry.ts'];
  if (mode === 'economic' || capabilities.some((capability) => ['atomic.discovery', 'atomic.quote', 'atomic.payment', 'atomic.escrow', 'atomic.fulfillment', 'atomic.tracking', 'atomic.evidence', 'atomic.completion'].includes(capability))) owners.push('economicRequestService.ts', 'economicParticipants.ts', 'executionConnector.ts');
  if (capabilities.includes('atomic.discovery')) owners.push('discoveryNetwork.ts', 'providerDiscovery.ts');
  if (capabilities.includes('atomic.payment') || capabilities.includes('atomic.escrow')) owners.push('paymentRoutes.ts', 'escrow.ts', 'commercialLedger.ts');
  if (capabilities.includes('atomic.tracking')) owners.push('backgroundWorkers.ts', 'notificationQueue.ts');
  if (capabilities.includes('atomic.evidence')) owners.push('evidenceService.ts');
  if (mode === 'safety') owners.push('safetyService.ts');
  if (mode === 'coordination' || capabilities.includes('atomic.delegate') || capabilities.includes('atomic.coordinate')) owners.push('agentRuntime.ts', 'notificationQueue.ts');
  if (capabilities.includes('atomic.view') || capabilities.includes('atomic.control')) owners.push('connectedResourceService.ts');
  if (capabilities.includes('atomic.communicate')) owners.push('channelCompositionRoot.ts', 'baseChannelService.ts');
  return [...new Set(owners)];
}

function lifecycleFor(mode: SkillExecutionMode, capabilities: string[]): string[] {
  if (mode === 'safety') return SAFETY_LIFECYCLE;
  if (mode === 'information') return INFORMATION_LIFECYCLE;
  if (mode === 'coordination' || capabilities.includes('atomic.coordinate') || capabilities.includes('atomic.delegate')) return COORDINATION_LIFECYCLE;
  if (capabilities.includes('atomic.payment') || capabilities.includes('atomic.fulfillment')) return ECONOMIC_LIFECYCLE;
  return BASE_LIFECYCLE;
}

function activationDependencies(capabilities: string[]): string[] {
  const dependencies = new Set<string>();
  if (capabilities.includes('atomic.discovery')) dependencies.add('nearby pulse or another configured/cached geospatial provider for live spatial results');
  if (capabilities.includes('atomic.payment') || capabilities.includes('atomic.escrow')) dependencies.add('configured payment provider and verified webhook/settlement boundary');
  if (capabilities.includes('atomic.tracking')) dependencies.add('configured execution/dispatch provider or local operator evidence');
  if (capabilities.includes('atomic.evidence')) dependencies.add('authenticated evidence capture and canonical storage authority');
  if (capabilities.includes('atomic.communicate')) dependencies.add('configured channel provider when external delivery is required');
  if (capabilities.includes('atomic.view') || capabilities.includes('atomic.control')) dependencies.add('paired connected resource with explicitly exposed capability');
  if (capabilities.includes('atomic.completion')) dependencies.add('notification/continuation adapter remains provider-dependent for external channels');
  return [...dependencies];
}

function normalizedCapabilities(skill: string): string[] {
  ensureCapabilityFoundation();
  const composition = resolveSkillCapabilityComposition(skill);
  if (composition.ordered.length) {
    return composition.ordered.map(item => item.descriptor.capability).filter(capability => capability !== `skill.${skill}`);
  }
  const packCapabilities = getConvergedSkillBehaviour(skill).capabilities || [];
  if (packCapabilities.length) return packCapabilities.map(capability => capability.startsWith('atomic.') ? capability : `atomic.${capability}`);
  return getSkillCapabilities(skill).map(capability => `atomic.${capability}`);
}

export async function buildOutcomeCompletenessMatrix(country = 'ng'): Promise<OutcomeCompletenessRow[]> {
  getFeatureRegistryReadiness(country);
  ensureCapabilityFoundation();
  const rows: OutcomeCompletenessRow[] = [];
  for (const skill of getAllConvergedSkillNames()) {
    const flow = await getSkillFlow(skill);
    const contract = buildSkillExecutionContract(skill);
    const pack = getConvergedSkillBehaviour(skill);
    const category = contract.category || getEconomicCategory(skill) || 'uncategorized';
    const capabilities = normalizedCapabilities(skill);
    const requirements = contract.requirements.length
      ? contract.requirements.map(requirement => `${requirement.key}${requirement.required ? ' (required)' : ''}: ${requirement.label}`)
      : getSkillRequirements(skill).map(requirement => `${requirement.key}${requirement.required ? ' (required)' : ''}: ${requirement.label}`);
    const lifecycle = lifecycleFor(contract.mode, capabilities);
    const owners = ownersFor(contract.mode, capabilities);
    const missingImplementation = contract.requirements.length && contract.capabilities.length && contract.completionEvidence.length && contract.completionCondition ? [] : ['complete skill execution contract'];
    const external = activationDependencies(capabilities);
    const hasExternalBoundary = external.length > 0;
    rows.push({
      skill,
      family: category,
      mode: contract.mode,
      status: missingImplementation.length ? 'MISSING_REPOSITORY_IMPLEMENTATION' : hasExternalBoundary ? 'REPOSITORY_READY_EXTERNAL_ACTIVATION' : 'IMPLEMENTED_AND_VERIFIED',
      canonicalOwner: owners,
      chatEntry: 'Chat → canonicalChatTurnService → Brain/context arbitration → skill behaviour → execution contract → capability registry → canonical service',
      contextRequirements: requirements,
      actors: contract.mode === 'information' ? ['requesting user', 'canonical information source'] : contract.mode === 'safety' ? ['requesting user', 'consented safety contact', 'authorized coordinator'] : ['requesting user', 'candidate/provider/participant', 'authorized coordinator'],
      capabilities,
      canonicalObjects: contract.mode === 'information' ? ['conversation', 'memory context', 'notification'] : ['conversation', 'Economic Request', 'participants/offers', 'evidence', 'notification', 'memory/follow-up'],
      lifecycleStates: lifecycle,
      executionBoundaries: ['AI interprets, arbitrates context and proposes', 'skill instructions shape conversation without granting authority', 'execution contract defines truth/completion boundary', 'capability registry resolves composition', 'canonical domain services authorize and mutate state', 'no external completion is claimed without provider/source evidence'],
      evidenceRequirements: contract.completionEvidence,
      uiRepresentations: ['Chat message and progress state', 'canonical request/offer/action card when applicable', 'notification or continuation card', 'connected-resource/media surface when applicable', 'failure/recovery action in the same conversation'],
      channelRepresentations: ['Web/PWA Chat uses the canonical turn protocol', 'WhatsApp/Telegram/SMS/USSD/channel adapters mirror the same canonical turn where configured', 'linked devices remain channel transport, not a second domain engine'],
      linkedDeviceBehaviour: 'Channel and connected-resource adapters preserve user, conversation and canonical object identity; a device exposes only explicitly registered capabilities.',
      notificationContinuation: 'Internal notification queue and Chat continuation are canonical; push/channel delivery requires configured provider evidence.',
      failureRecovery: contract.failureModes,
      externalActivationDependencies: external,
      missingImplementation,
      paymentModel: flow?.payment_model || (contract.requiresPayment ? 'commercial-contract-required' : 'none'),
      fulfillmentInstruction: flow?.fulfillment_instructions || contract.completionCondition,
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

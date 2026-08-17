import crypto from 'node:crypto';
import { getDb, saveDb } from '../database.js';
import { listChatMessages } from './chatConversationService.js';
import {
  getCanonicalOperationDescriptor,
  listUniversalCapabilities,
  projectCapabilityResult,
  validateCapabilityProposal,
  type CapabilityActionProposal,
  type UniversalCapabilityResult,
} from './universalCapabilityProtocol.js';
import { createReminder, cancelReminder } from './reminderService.js';
import { cancelAgentGoal, getAgentGoal, pauseAgentGoal, resumeAgentGoal } from './agentRuntime.js';
import { getInternalNotificationById, markNotificationRead } from './pushNotifications.js';
import { revokeMemoryFact } from './memoryProfile.js';
import { getEconomicRequest } from './skillFlows.js';
import { advanceStorefront } from './agenticStorefront.js';
import { deriveCapabilityInteractionPolicy } from './capabilityInteractionPolicyService.js';
import { getPreferredEmergencyNumber } from './emergencyDirectoryService.js';

type ExecutorStatus = UniversalCapabilityResult['status'] | 'in_progress' | 'external_unavailable' | 'stale_context' | 'unauthorized' | 'invalid';

export interface CanonicalCapabilityExecutionInput extends CapabilityActionProposal {
  phone: string;
  conversationId?: string;
  confirmationGranted?: boolean;
  idempotencyKey?: string;
  channel?: string;
}

export interface CanonicalCapabilityExecutionResult extends Omit<UniversalCapabilityResult, 'status'> {
  status: ExecutorStatus;
  idempotencyKey: string;
  duplicate?: boolean;
}

async function ensureExecutionTable(): Promise<void> {
  const db = await getDb();
  db.run(`CREATE TABLE IF NOT EXISTS capability_action_runs (
    id TEXT PRIMARY KEY,
    idempotency_key TEXT NOT NULL UNIQUE,
    phone TEXT NOT NULL,
    capability TEXT NOT NULL,
    action TEXT NOT NULL,
    canonical_object_id TEXT,
    result_json TEXT NOT NULL,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
  )`);
  db.run('CREATE INDEX IF NOT EXISTS idx_capability_action_runs_phone ON capability_action_runs(phone, created_at)');
}

async function readIdempotentResult(phone: string, idempotencyKey: string): Promise<CanonicalCapabilityExecutionResult | null> {
  await ensureExecutionTable();
  const db = await getDb();
  const stmt = db.prepare('SELECT result_json FROM capability_action_runs WHERE idempotency_key = ? AND phone = ? LIMIT 1');
  stmt.bind([idempotencyKey, phone]);
  const row = stmt.step() ? stmt.getAsObject() : null;
  stmt.free();
  if (!row?.result_json) return null;
  try { return { ...JSON.parse(String(row.result_json)), duplicate: true }; } catch { return null; }
}

async function persistResult(input: CanonicalCapabilityExecutionInput, idempotencyKey: string, result: CanonicalCapabilityExecutionResult): Promise<void> {
  await ensureExecutionTable();
  const db = await getDb();
  db.run(`INSERT OR IGNORE INTO capability_action_runs(id, idempotency_key, phone, capability, action, canonical_object_id, result_json) VALUES(?,?,?,?,?,?,?)`, [
    crypto.randomUUID(), idempotencyKey, input.phone, input.capability, input.action, input.canonicalObjectId || null, JSON.stringify(result),
  ]);
  saveDb();
}

function baseResult(input: CanonicalCapabilityExecutionInput, status: ExecutorStatus, message: string, extra: Partial<CanonicalCapabilityExecutionResult> = {}): CanonicalCapabilityExecutionResult {
  return {
    status,
    capability: input.capability,
    action: input.action,
    contextId: input.contextId,
    canonicalObjectId: input.canonicalObjectId,
    canonicalFacts: {},
    evidenceLevel: 'none',
    externalActivation: 'locally_available',
    nextActions: [],
    retryRecovery: [],
    continuationContext: { conversationId: input.conversationId, contextId: input.contextId, canonicalObjectId: input.canonicalObjectId, ownerScope: input.phone },
    message,
    idempotencyKey: input.idempotencyKey || '',
    ...extra,
  };
}

function invalidResult(input: CanonicalCapabilityExecutionInput, status: ExecutorStatus, message: string, code: string): CanonicalCapabilityExecutionResult {
  return baseResult(input, status, message, { canonicalFacts: { validationCode: code }, retryRecovery: [{ action: 'clarify', label: 'Clarify the missing or invalid action details' }, { action: 'cancel', label: 'Cancel without changing state' }] });
}

function requiredArgumentMissing(descriptor: NonNullable<ReturnType<typeof getCanonicalOperationDescriptor>>, input: CanonicalCapabilityExecutionInput): string | null {
  for (const required of descriptor.context.requiredInputs) {
    const value = input.arguments?.[required.key];
    if (value === undefined || value === null || String(value).trim() === '') return required.key;
  }
  return null;
}

async function verifyExactOwner(input: CanonicalCapabilityExecutionInput): Promise<{ ok: boolean; object?: any; code?: string }> {
  if (!input.canonicalObjectId) return { ok: true };
  const capability = input.capability;
  if (capability === 'agent') {
    const object = await getAgentGoal(input.phone, input.canonicalObjectId);
    return object ? { ok: true, object } : { ok: false, code: 'foreign_or_missing_agent_goal' };
  }
  if (capability === 'economic_request' || capability === 'order' || capability === 'product' || capability === 'payment') {
    const object = await getEconomicRequest(input.canonicalObjectId);
    return object?.phone === input.phone ? { ok: true, object } : { ok: false, code: 'foreign_or_missing_economic_request' };
  }
  if (capability === 'notification') {
    const id = Number(input.canonicalObjectId);
    const object = Number.isSafeInteger(id) ? await getInternalNotificationById(id, input.phone) : null;
    return object ? { ok: true, object } : { ok: false, code: 'foreign_or_missing_notification' };
  }
  if (capability === 'reminder') {
    const db = await getDb();
    const result = db.exec('SELECT * FROM reminders WHERE id = ? AND phone = ? LIMIT 1', [input.canonicalObjectId, input.phone]);
    const row = result[0]?.values?.[0];
    return row ? { ok: true, object: row } : { ok: false, code: 'foreign_or_missing_reminder' };
  }
  if (capability === 'memory') {
    const id = Number(input.canonicalObjectId);
    return Number.isSafeInteger(id) && id > 0 ? { ok: true, object: { factId: id } } : { ok: false, code: 'invalid_memory_fact_id' };
  }
  return { ok: true };
}

async function dispatchCanonicalAction(input: CanonicalCapabilityExecutionInput, object?: any): Promise<CanonicalCapabilityExecutionResult> {
  const args = input.arguments || {};
  if (input.capability === 'safety' && input.action === 'emergency_dispatch') {
    const service = String(args.service || 'emergency').toLowerCase() as 'national' | 'police' | 'ambulance' | 'fire' | 'disaster';
    const country = String(args.country || 'NG').toUpperCase();
    const contact = getPreferredEmergencyNumber(country, ['police', 'ambulance', 'fire'].includes(service) ? service : 'national');
    if (!contact) return baseResult(input, 'unavailable_external', 'I could not verify an emergency contact for this location. Use the emergency number available from your local emergency service now.', { externalActivation: 'unavailable_external_dependency', retryRecovery: [{ action: 'clarify_location', label: 'Provide your country or location' }, { action: 'retry', label: 'Retry emergency routing' }] });
    return baseResult(input, 'externally_pending', `Emergency ${service} routing is ready to hand off to ${contact.name} on ${contact.number}. Live dialing/connection is not activated in this deployment, so Kurukoo has not claimed that a call or dispatch occurred.`, {
      canonicalFacts: { service, country, emergencyNumber: contact.number, contactName: contact.name, source: contact.source, verificationState: contact.verificationState, dialable: contact.dialable },
      evidenceLevel: 'canonical_service',
      externalActivation: 'repository_ready_external_activation',
      nextActions: [{ action: 'dial', label: `Call ${contact.number}` }, { action: 'open_voice', label: 'Open Kurukoo voice' }],
      retryRecovery: [{ action: 'retry', label: 'Retry emergency routing' }, { action: 'continue_chat', label: 'Continue here while you seek emergency help' }],
    });
  }
  if (input.capability === 'reminder' && input.action === 'create') {
    const reminder = await createReminder(input.phone, { title: String(args.title || ''), note: args.note ? String(args.note) : undefined, dueAt: String(args.dueAt || args.due_at || ''), recurrence: args.recurrence ? String(args.recurrence) : null });
    return baseResult(input, 'completed', `Reminder created for ${reminder.due_at}.`, { canonicalObjectId: reminder.id, canonicalFacts: { reminderId: reminder.id, dueAt: reminder.due_at, status: reminder.status }, evidenceLevel: 'canonical_service', nextActions: [{ action: 'open', label: 'Open reminder' }, { action: 'cancel', label: 'Cancel reminder', confirmationRequired: false }] });
  }
  if (input.capability === 'reminder' && input.action === 'cancel') {
    const cancelled = await cancelReminder(input.phone, input.canonicalObjectId!);
    return cancelled ? baseResult(input, 'completed', 'The exact reminder was cancelled.', { canonicalFacts: { reminderId: input.canonicalObjectId, status: 'cancelled' }, evidenceLevel: 'canonical_service' }) : invalidResult(input, 'stale_context', 'That exact reminder is no longer active. I did not substitute another reminder.', 'reminder_not_active');
  }
  if (input.capability === 'agent' && ['pause', 'resume', 'cancel'].includes(input.action)) {
    const goal = input.action === 'pause' ? await pauseAgentGoal(input.phone, input.canonicalObjectId!) : input.action === 'resume' ? await resumeAgentGoal(input.phone, input.canonicalObjectId!) : await cancelAgentGoal(input.phone, input.canonicalObjectId!);
    return goal ? baseResult(input, 'completed', `The exact agent goal was ${input.action}d.`, { canonicalFacts: { goalId: goal.id, status: goal.status, objective: goal.objective }, evidenceLevel: 'canonical_service', canonicalObjectId: goal.id }) : invalidResult(input, 'stale_context', 'That exact agent goal is no longer available. I did not substitute another goal.', 'agent_goal_not_active');
  }
  if (input.capability === 'notification' && input.action === 'open') return baseResult(input, 'completed', 'The exact notification is available.', { canonicalFacts: { notification: object }, evidenceLevel: 'canonical_service' });
  if (input.capability === 'notification' && input.action === 'dismiss') {
    const dismissed = await markNotificationRead(Number(input.canonicalObjectId), input.phone);
    return dismissed ? baseResult(input, 'completed', 'The exact notification was marked as read.', { canonicalFacts: { notificationId: input.canonicalObjectId, status: 'read' }, evidenceLevel: 'canonical_service' }) : invalidResult(input, 'stale_context', 'That exact notification is no longer available.', 'notification_not_active');
  }
  if (input.capability === 'memory' && input.action === 'forget') {
    const outcome = await revokeMemoryFact(input.phone, Number(input.canonicalObjectId));
    return outcome.revoked ? baseResult(input, 'completed', 'The exact memory fact was revoked from active retrieval.', { canonicalFacts: { factId: input.canonicalObjectId, revoked: true }, evidenceLevel: 'canonical_service' }) : invalidResult(input, 'stale_context', 'That exact memory fact was not available for revocation.', 'memory_fact_not_found');
  }
  if (input.capability === 'economic_request' && ['update', 'cancel', 'select_provider'].includes(input.action)) {
    const card = await advanceStorefront(input.phone, input.canonicalObjectId!, input.action === 'select_provider' ? { providerPhone: String(args.providerPhone || '') } : (args as Record<string, unknown>), input.action === 'update' ? undefined : input.action, input.idempotencyKey);
    const projected = projectCapabilityResult({ capability: input.capability, action: input.action, contextId: input.contextId, canonicalObjectId: input.canonicalObjectId, cardData: card, message: card.message || 'The exact Economic Request was updated.' });
    return { ...projected, capability: input.capability, action: input.action, contextId: input.contextId, canonicalObjectId: input.canonicalObjectId, idempotencyKey: input.idempotencyKey || '', canonicalFacts: { ...projected.canonicalFacts, card } } as CanonicalCapabilityExecutionResult;
  }
  if (['payment', 'provider', 'channel', 'execution', 'subscription', 'order', 'product'].includes(input.capability)) {
    return baseResult(input, 'external_unavailable', 'This capability is implemented behind its canonical boundary, but the required external activation or evidence is not available in this deployment. No external action was performed.', { externalActivation: 'repository_ready_external_activation', retryRecovery: [{ action: 'retry', label: 'Retry after activation is configured' }, { action: 'wait', label: 'Keep the exact request and wait' }, { action: 'cancel', label: 'Cancel without external execution' }] });
  }
  return invalidResult(input, 'invalid', 'That capability/action has no canonical executor adapter yet. No alternate action was substituted.', 'canonical_adapter_missing');
}

export async function executeCanonicalCapabilityProposal(input: CanonicalCapabilityExecutionInput): Promise<CanonicalCapabilityExecutionResult> {
  const idempotencyKey = String(input.idempotencyKey || `capability:${input.phone}:${input.capability}:${input.action}:${input.canonicalObjectId || input.contextId || crypto.randomUUID()}`);
  const normalized = { ...input, phone: String(input.phone || '').trim(), idempotencyKey };
  const duplicate = await readIdempotentResult(normalized.phone, idempotencyKey);
  if (duplicate) return duplicate;

  const descriptor = getCanonicalOperationDescriptor(normalized.capability) || (await listUniversalCapabilities()).find(item => item.capability === normalized.capability);
  if (!descriptor) return invalidResult(normalized, 'invalid', 'That capability is not registered. No alternate action was selected.', 'missing_capability');
  const interactionPolicy = deriveCapabilityInteractionPolicy(normalized.capability === 'safety' ? { ...descriptor, actions: [...descriptor.actions, 'emergency_dispatch'], mode: 'external_execution', risk: 'high_risk', activationState: 'repository_ready_external_activation' } : descriptor);
  const criticalGuestInitialHelp = interactionPolicy.priority === 'critical' && interactionPolicy.guestAccess === 'allowed_for_initial_help';
  const hasAuthenticatedOwner = Boolean(normalized.phone && !normalized.phone.startsWith('anon_'));

  if (!hasAuthenticatedOwner && !criticalGuestInitialHelp) {
    const result = invalidResult(normalized, 'unauthorized', 'Sign in before asking Kurukoo to execute this account-owned action.', 'authenticated_owner_required');
    await persistResult(normalized, idempotencyKey, result);
    return result;
  }

  if (normalized.conversationId && hasAuthenticatedOwner) {
    const messages = await listChatMessages(normalized.phone, { conversationId: normalized.conversationId, limit: 1 });
    if (!messages.length) {
      const result = invalidResult(normalized, 'unauthorized', 'The conversation context is not owned by this account. No alternate conversation was selected.', 'foreign_conversation');
      await persistResult(normalized, idempotencyKey, result);
      return result;
    }
  }

  const missing = requiredArgumentMissing(descriptor, normalized);
  if (missing && !criticalGuestInitialHelp) {
    const result = invalidResult(normalized, 'needs_user', `I still need ${missing} before the canonical service can proceed.`, 'missing_required_argument');
    await persistResult(normalized, idempotencyKey, result);
    return result;
  }

  const emergencyAction = normalized.capability === 'safety' && normalized.action === 'emergency_dispatch';
  const validation = emergencyAction && criticalGuestInitialHelp
    ? { valid: true as const }
    : validateCapabilityProposal(normalized, descriptor, { ownerVerified: hasAuthenticatedOwner || criticalGuestInitialHelp, objectVerified: true, stale: false, confirmationGranted: Boolean(normalized.confirmationGranted) });
  if (!validation.valid) {
    const status: ExecutorStatus = validation.code === 'stale_context' ? 'stale_context' : validation.code === 'foreign_context' ? 'unauthorized' : validation.code === 'missing_confirmation' ? 'confirmation_required' : 'invalid';
    const result = invalidResult(normalized, status, validation.message || 'The canonical action was not accepted.', validation.code || 'invalid');
    await persistResult(normalized, idempotencyKey, result);
    return result;
  }

  const explicitConfirmationRequired = interactionPolicy.confirmation === 'explicit';
  if (explicitConfirmationRequired && !normalized.confirmationGranted && !emergencyAction) {
    const result = baseResult(normalized, 'confirmation_required', 'This action requires your explicit confirmation before any state or external effect can occur.', { retryRecovery: [{ action: 'confirm', label: 'Confirm this exact action' }, { action: 'cancel', label: 'Cancel without changing state' }] });
    await persistResult(normalized, idempotencyKey, result);
    return result;
  }

  const owner = hasAuthenticatedOwner ? await verifyExactOwner(normalized) : { ok: true };
  if (!owner.ok) {
    const result = invalidResult(normalized, 'unauthorized', 'The exact referenced object is not available to this account. No replacement object was selected.', owner.code || 'foreign_context');
    await persistResult(normalized, idempotencyKey, result);
    return result;
  }

  const result = await dispatchCanonicalAction(normalized, owner.object);
  result.idempotencyKey = idempotencyKey;
  await persistResult(normalized, idempotencyKey, result);
  return result;
}

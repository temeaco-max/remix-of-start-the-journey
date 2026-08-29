/* Copyright (c) 2026 temeaco-max. All rights reserved. Proprietary and confidential. */
import { createHash } from 'node:crypto';
import { getDb, saveDb } from '../database.js';
import { getEconomicRequest } from './skillFlows.js';
import { addEconomicParticipant } from './economicParticipants.js';
import {
  createExecutionRequest,
  getExecutionRequest,
  recordExecutionEvidence,
  updateExecutionStatus,
  type ExecutionRequestRecord,
} from './executionConnector.js';
import { ensureProviderVerification, getProviderVerification, type ProviderVerificationState } from './providerVerificationLifecycle.js';
import {
  EXTERNAL_AGENT_CONTRACT_VERSION,
  externalAgentCapability,
  externalAgentPayloadHash,
  isExternalAgentCallbackFresh,
  validateExternalAgentCallback,
  validateExternalAgentManifest,
  type ExternalAgentCallbackPayload,
  type ExternalAgentParticipantManifest,
} from './externalAgentContract.js';

export const EXTERNAL_AGENT_AUTHORIZATION_STATUSES = ['active', 'revoked', 'expired'] as const;
export type ExternalAgentAuthorizationStatus = typeof EXTERNAL_AGENT_AUTHORIZATION_STATUSES[number];

export interface ExternalAgentParticipantRegistration {
  participantId: string;
  providerPhone: string;
  manifest: ExternalAgentParticipantManifest;
  verificationState: ProviderVerificationState | 'unverified';
  registeredAt: string;
  updatedAt: string;
}

export interface ExternalAgentAuthorizationGrant {
  id: string;
  ownerPhone: string;
  requestId: string;
  participantId: string;
  capability: string;
  allowedActions: string[];
  spendingCeilingMinor: number | null;
  currency: string | null;
  expiresAt: string;
  humanApprovalRequired: true;
  maxDelegationDepth: 0;
  status: ExternalAgentAuthorizationStatus;
  revokedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ExternalAgentDiscoveryRecord {
  participantId: string;
  displayName: string;
  protocol: ExternalAgentParticipantManifest['protocol'];
  capability: ExternalAgentParticipantManifest['capabilities'][number];
  verificationState: ProviderVerificationState | 'unverified';
  agentVerified: boolean;
  capabilityDeclared: true;
  actionExecuted: false;
  outcomeVerified: false;
}

export interface ExternalAgentCallbackResult {
  receipt: 'processed' | 'duplicate';
  execution: ExecutionRequestRecord;
  outcomeVerified: false;
  message: string;
}

class ExternalAgentAuthorizationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ExternalAgentAuthorizationError';
  }
}

class ExternalAgentCallbackError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ExternalAgentCallbackError';
  }
}

function cleanText(value: unknown, field: string, maxLength = 256): string {
  if (typeof value !== 'string' || !value.trim()) throw new Error(`${field} is required`);
  const normalized = value.trim();
  if (normalized.length > maxLength) throw new Error(`${field} is too long`);
  return normalized;
}

function parseObject(value: unknown): Record<string, unknown> {
  try {
    const parsed = JSON.parse(String(value || '{}'));
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed as Record<string, unknown> : {};
  } catch {
    return {};
  }
}

function parseManifest(value: unknown): ExternalAgentParticipantManifest {
  return validateExternalAgentManifest(parseObject(value));
}

function parseStringList(value: unknown): string[] {
  try {
    const parsed = JSON.parse(String(value || '[]'));
    return Array.isArray(parsed) ? parsed.map(String) : [];
  } catch {
    return [];
  }
}

function parseResult(value: unknown): ExternalAgentCallbackResult | null {
  try {
    const parsed = JSON.parse(String(value || '{}'));
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return null;
    const candidate = parsed as ExternalAgentCallbackResult;
    return candidate.execution?.id && (candidate.receipt === 'processed' || candidate.receipt === 'duplicate') ? candidate : null;
  } catch {
    return null;
  }
}

async function ensureExternalAgentSchema(): Promise<void> {
  const db = await getDb();
  db.run(`CREATE TABLE IF NOT EXISTS external_agent_participants (
    participant_id TEXT PRIMARY KEY,
    provider_phone TEXT NOT NULL UNIQUE,
    manifest_json TEXT NOT NULL,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );
  CREATE TABLE IF NOT EXISTS external_agent_authorizations (
    id TEXT PRIMARY KEY,
    owner_phone TEXT NOT NULL,
    request_id TEXT NOT NULL,
    participant_id TEXT NOT NULL,
    capability TEXT NOT NULL,
    allowed_actions_json TEXT NOT NULL,
    spending_ceiling_minor INTEGER,
    currency TEXT,
    expires_at TEXT NOT NULL,
    human_approval_required INTEGER NOT NULL DEFAULT 1,
    max_delegation_depth INTEGER NOT NULL DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'active',
    revoked_at TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );
  CREATE INDEX IF NOT EXISTS idx_external_agent_authorizations_request ON external_agent_authorizations(request_id, participant_id, status, expires_at);
  CREATE INDEX IF NOT EXISTS idx_external_agent_authorizations_owner ON external_agent_authorizations(owner_phone, status, expires_at);
  CREATE TABLE IF NOT EXISTS external_agent_callback_receipts (
    event_id TEXT PRIMARY KEY,
    participant_id TEXT NOT NULL,
    execution_id TEXT NOT NULL,
    idempotency_key TEXT NOT NULL,
    payload_hash TEXT NOT NULL,
    result_json TEXT NOT NULL,
    received_at TEXT NOT NULL
  );
  CREATE UNIQUE INDEX IF NOT EXISTS idx_external_agent_callback_execution_key ON external_agent_callback_receipts(execution_id, idempotency_key);
  CREATE INDEX IF NOT EXISTS idx_external_agent_callback_participant ON external_agent_callback_receipts(participant_id, received_at DESC);`);
  saveDb();
}

function registrationFromRow(row: any, verificationState: ProviderVerificationState | 'unverified'): ExternalAgentParticipantRegistration {
  return {
    participantId: String(row.participant_id),
    providerPhone: String(row.provider_phone),
    manifest: parseManifest(row.manifest_json),
    verificationState,
    registeredAt: String(row.created_at || ''),
    updatedAt: String(row.updated_at || ''),
  };
}

function authorizationFromRow(row: any): ExternalAgentAuthorizationGrant {
  return {
    id: String(row.id),
    ownerPhone: String(row.owner_phone),
    requestId: String(row.request_id),
    participantId: String(row.participant_id),
    capability: String(row.capability),
    allowedActions: parseStringList(row.allowed_actions_json),
    spendingCeilingMinor: row.spending_ceiling_minor === null || row.spending_ceiling_minor === undefined ? null : Number(row.spending_ceiling_minor),
    currency: row.currency ? String(row.currency) : null,
    expiresAt: String(row.expires_at),
    humanApprovalRequired: true,
    maxDelegationDepth: 0,
    status: String(row.status) as ExternalAgentAuthorizationStatus,
    revokedAt: row.revoked_at ? String(row.revoked_at) : null,
    createdAt: String(row.created_at || ''),
    updatedAt: String(row.updated_at || ''),
  };
}

async function verificationStateFor(providerPhone: string): Promise<ProviderVerificationState | 'unverified'> {
  const verification = await getProviderVerification(providerPhone);
  return verification?.state || 'unverified';
}

export async function registerExternalAgentParticipant(input: {
  providerPhone: string;
  manifest: unknown;
}): Promise<ExternalAgentParticipantRegistration> {
  const providerPhone = cleanText(input.providerPhone, 'Provider phone', 128);
  const manifest = validateExternalAgentManifest(input.manifest);
  await ensureExternalAgentSchema();
  // This only creates a declaration record. It does not mark the participant trusted.
  await ensureProviderVerification(providerPhone, 'software_service');
  const db = await getDb();
  const priorByProvider = db.prepare('SELECT participant_id FROM external_agent_participants WHERE provider_phone=? LIMIT 1');
  priorByProvider.bind([providerPhone]);
  const existingParticipantId = priorByProvider.step() ? String(priorByProvider.getAsObject().participant_id) : null;
  priorByProvider.free();
  if (existingParticipantId && existingParticipantId !== manifest.participantId) throw new ExternalAgentAuthorizationError('A provider identity cannot be rebound to a different external participant id');
  const priorById = db.prepare('SELECT provider_phone FROM external_agent_participants WHERE participant_id=? LIMIT 1');
  priorById.bind([manifest.participantId]);
  const existingProviderPhone = priorById.step() ? String(priorById.getAsObject().provider_phone) : null;
  priorById.free();
  if (existingProviderPhone && existingProviderPhone !== providerPhone) throw new ExternalAgentAuthorizationError('An external participant id cannot be rebound to a different provider identity');
  const now = new Date().toISOString();
  db.run(`INSERT INTO external_agent_participants(participant_id,provider_phone,manifest_json,created_at,updated_at)
    VALUES(?,?,?,?,?)
    ON CONFLICT(participant_id) DO UPDATE SET manifest_json=excluded.manifest_json,updated_at=excluded.updated_at`, [
    manifest.participantId,
    providerPhone,
    JSON.stringify(manifest),
    now,
    now,
  ]);
  saveDb();
  return (await getExternalAgentParticipant(manifest.participantId))!;
}

export async function getExternalAgentParticipant(participantId: string): Promise<ExternalAgentParticipantRegistration | null> {
  await ensureExternalAgentSchema();
  const db = await getDb();
  const stmt = db.prepare('SELECT * FROM external_agent_participants WHERE participant_id=? LIMIT 1');
  stmt.bind([cleanText(participantId, 'Participant id', 128)]);
  const row = stmt.step() ? stmt.getAsObject() : null;
  stmt.free();
  if (!row) return null;
  return registrationFromRow(row, await verificationStateFor(String(row.provider_phone)));
}

export async function discoverExternalAgentCapabilities(input: { capability?: string; includeUnavailable?: boolean } = {}): Promise<ExternalAgentDiscoveryRecord[]> {
  await ensureExternalAgentSchema();
  const capabilityFilter = input.capability ? cleanText(input.capability, 'Capability', 128) : undefined;
  const db = await getDb();
  const stmt = db.prepare('SELECT * FROM external_agent_participants ORDER BY updated_at DESC, participant_id ASC');
  const rows: any[] = [];
  while (stmt.step()) rows.push(stmt.getAsObject());
  stmt.free();
  const results: ExternalAgentDiscoveryRecord[] = [];
  for (const row of rows) {
    const verificationState = await verificationStateFor(String(row.provider_phone));
    const manifest = parseManifest(row.manifest_json);
    for (const capability of manifest.capabilities) {
      if (capabilityFilter && capability.capability !== capabilityFilter) continue;
      if (!input.includeUnavailable && ['unavailable', 'unknown'].includes(capability.availability)) continue;
      results.push({
        participantId: manifest.participantId,
        displayName: manifest.displayName,
        protocol: manifest.protocol,
        capability,
        verificationState,
        agentVerified: verificationState === 'verified',
        capabilityDeclared: true,
        actionExecuted: false,
        outcomeVerified: false,
      });
    }
  }
  return results;
}

export async function createExternalAgentAuthorization(input: {
  ownerPhone: string;
  requestId: string;
  participantId: string;
  capability: string;
  allowedActions: string[];
  spendingCeilingMinor?: number | null;
  currency?: string | null;
  expiresAt: string;
  humanApprovalRequired: true;
  maxDelegationDepth: 0;
}): Promise<ExternalAgentAuthorizationGrant> {
  await ensureExternalAgentSchema();
  const ownerPhone = cleanText(input.ownerPhone, 'Owner phone', 128);
  const requestId = cleanText(input.requestId, 'Request id', 128);
  const participantId = cleanText(input.participantId, 'Participant id', 128);
  const capabilityName = cleanText(input.capability, 'Capability', 128);
  const request = await getEconomicRequest(requestId);
  if (!request || request.phone !== ownerPhone) throw new ExternalAgentAuthorizationError('Economic Request ownership is required');
  if (input.humanApprovalRequired !== true) throw new ExternalAgentAuthorizationError('External agent execution requires an explicit human-approval boundary');
  if (input.maxDelegationDepth !== 0) throw new ExternalAgentAuthorizationError('Recursive external-agent delegation is not permitted');
  const expiresAt = new Date(cleanText(input.expiresAt, 'Authorization expiry', 64));
  if (!Number.isFinite(expiresAt.getTime()) || expiresAt.getTime() <= Date.now() || expiresAt.getTime() > Date.now() + 30 * 24 * 60 * 60 * 1000) throw new ExternalAgentAuthorizationError('Authorization expiry must be within the next 30 days');
  const allowedActions = Array.from(new Set((input.allowedActions || []).map(action => cleanText(action, 'Allowed action', 128))));
  if (!allowedActions.length || allowedActions.length > 32) throw new ExternalAgentAuthorizationError('At least one and at most 32 allowed actions are required');
  const spendingCeilingMinor = input.spendingCeilingMinor === undefined || input.spendingCeilingMinor === null ? null : input.spendingCeilingMinor;
  if (spendingCeilingMinor !== null && (!Number.isSafeInteger(spendingCeilingMinor) || spendingCeilingMinor < 0)) throw new ExternalAgentAuthorizationError('Spending ceiling must be a non-negative integer amount in minor units');
  const currency = input.currency === undefined || input.currency === null ? null : cleanText(input.currency, 'Currency', 16);
  const participant = await getExternalAgentParticipant(participantId);
  if (!participant) throw new ExternalAgentAuthorizationError('External agent participant is not registered');
  const declaration = externalAgentCapability(participant.manifest, capabilityName);
  if (!declaration) throw new ExternalAgentAuthorizationError('External agent did not declare this capability');
  if (['unavailable', 'unknown'].includes(declaration.availability)) throw new ExternalAgentAuthorizationError('External agent capability is not currently available');
  if (allowedActions.some(action => !declaration.supportedActions.includes(action))) throw new ExternalAgentAuthorizationError('Authorization exceeds declared external-agent actions');
  const id = `agent_auth_${crypto.randomUUID()}`;
  const now = new Date().toISOString();
  const db = await getDb();
  db.run(`INSERT INTO external_agent_authorizations(
    id,owner_phone,request_id,participant_id,capability,allowed_actions_json,spending_ceiling_minor,currency,expires_at,human_approval_required,max_delegation_depth,status,created_at,updated_at
  ) VALUES(?,?,?,?,?,?,?,?,?,?,?,'active',?,?)`, [
    id,
    ownerPhone,
    requestId,
    participantId,
    capabilityName,
    JSON.stringify(allowedActions),
    spendingCeilingMinor,
    currency,
    expiresAt.toISOString(),
    1,
    0,
    now,
    now,
  ]);
  saveDb();
  return (await getExternalAgentAuthorization(id))!;
}

export async function getExternalAgentAuthorization(id: string): Promise<ExternalAgentAuthorizationGrant | null> {
  await ensureExternalAgentSchema();
  const db = await getDb();
  const stmt = db.prepare('SELECT * FROM external_agent_authorizations WHERE id=? LIMIT 1');
  stmt.bind([cleanText(id, 'Authorization id', 128)]);
  const row = stmt.step() ? stmt.getAsObject() : null;
  stmt.free();
  if (!row) return null;
  const grant = authorizationFromRow(row);
  if (grant.status === 'active' && new Date(grant.expiresAt).getTime() <= Date.now()) {
    db.run(`UPDATE external_agent_authorizations SET status='expired', updated_at=? WHERE id=? AND status='active'`, [new Date().toISOString(), grant.id]);
    saveDb();
    return { ...grant, status: 'expired', updatedAt: new Date().toISOString() };
  }
  return grant;
}

export async function revokeExternalAgentAuthorization(input: { id: string; ownerPhone: string }): Promise<ExternalAgentAuthorizationGrant> {
  const grant = await getExternalAgentAuthorization(input.id);
  if (!grant) throw new ExternalAgentAuthorizationError('External agent authorization not found');
  if (grant.ownerPhone !== cleanText(input.ownerPhone, 'Owner phone', 128)) throw new ExternalAgentAuthorizationError('Authorization ownership is required');
  if (grant.status === 'revoked') return grant;
  const db = await getDb();
  const now = new Date().toISOString();
  db.run(`UPDATE external_agent_authorizations SET status='revoked', revoked_at=?, updated_at=? WHERE id=?`, [now, now, grant.id]);
  saveDb();
  return (await getExternalAgentAuthorization(grant.id))!;
}

async function requireActiveGrant(id: string, options: { ownerPhone?: string; requestId?: string; participantId?: string; capability?: string; action?: string } = {}): Promise<ExternalAgentAuthorizationGrant> {
  const grant = await getExternalAgentAuthorization(id);
  if (!grant || grant.status !== 'active') throw new ExternalAgentAuthorizationError('External agent authorization is not active');
  if (options.ownerPhone && grant.ownerPhone !== options.ownerPhone) throw new ExternalAgentAuthorizationError('Authorization owner does not match');
  if (options.requestId && grant.requestId !== options.requestId) throw new ExternalAgentAuthorizationError('Authorization request does not match');
  if (options.participantId && grant.participantId !== options.participantId) throw new ExternalAgentAuthorizationError('Authorization participant does not match');
  if (options.capability && grant.capability !== options.capability) throw new ExternalAgentAuthorizationError('Authorization capability does not match');
  if (options.action && !grant.allowedActions.includes(options.action)) throw new ExternalAgentAuthorizationError('Action is outside the authorization scope');
  return grant;
}

/**
 * Creates an execution through the existing connector boundary. This service
 * never sends a network request itself; a separately registered connector is
 * required, and the existing connector authorization remains authoritative.
 */
export async function prepareExternalAgentExecution(input: {
  authorizationId: string;
  confirmedByPhone: string;
  action: string;
  idempotencyKey: string;
  correlationId: string;
}): Promise<ExecutionRequestRecord> {
  const authorizationId = cleanText(input.authorizationId, 'Authorization id', 128);
  const action = cleanText(input.action, 'Action', 128);
  const grant = await requireActiveGrant(authorizationId, { action });
  const confirmedByPhone = cleanText(input.confirmedByPhone, 'Confirming user', 128);
  if (confirmedByPhone !== grant.ownerPhone) throw new ExternalAgentAuthorizationError('The Economic Request owner must confirm external-agent execution');
  const participant = await getExternalAgentParticipant(grant.participantId);
  if (!participant) throw new ExternalAgentAuthorizationError('External agent participant is not registered');
  if (participant.verificationState !== 'verified') throw new ExternalAgentAuthorizationError('External agent participant is not verified');
  const capability = externalAgentCapability(participant.manifest, grant.capability);
  if (!capability || !capability.supportedActions.includes(action)) throw new ExternalAgentAuthorizationError('Action is not declared by the external agent');
  // This is an Economic Request participant only. It does not become the escrow recipient or request owner.
  await addEconomicParticipant({
    requestId: grant.requestId,
    ownerPhone: grant.ownerPhone,
    role: 'external_platform',
    providerPhone: participant.providerPhone,
    capability: grant.capability,
    status: 'selected',
    evidence: {
      participant_id: participant.participantId,
      protocol: participant.manifest.protocol,
      capability_declared: true,
      verification_state: participant.verificationState,
      authorization_id: grant.id,
      delegation_depth: 0,
      transport_status: 'not_connected',
    },
  });
  return createExecutionRequest({
    requestId: grant.requestId,
    actionId: `external-agent:${grant.id}:${action}`.slice(0, 128),
    providerPhone: participant.providerPhone,
    role: 'external_platform',
    capability: grant.capability,
    actionRequested: action,
    idempotencyKey: cleanText(input.idempotencyKey, 'Idempotency key', 256),
    correlationId: cleanText(input.correlationId, 'Correlation id', 256),
    authorizationContext: {
      external_agent_contract_version: EXTERNAL_AGENT_CONTRACT_VERSION,
      external_agent_participant_id: participant.participantId,
      external_agent_authorization_id: grant.id,
      human_approval_required: true,
      delegation_depth: 0,
      spending_ceiling_minor: grant.spendingCeilingMinor,
      currency: grant.currency,
      external_interoperability: 'unverified',
    },
  });
}

function externalAgentAuthorizationId(execution: ExecutionRequestRecord): string {
  const candidate = execution.authorizationContext.external_agent_authorization_id;
  if (typeof candidate !== 'string' || !candidate) throw new ExternalAgentCallbackError('Execution is not bound to an external-agent authorization');
  return candidate;
}

function executionParticipantId(execution: ExecutionRequestRecord): string {
  const candidate = execution.authorizationContext.external_agent_participant_id;
  if (typeof candidate !== 'string' || !candidate) throw new ExternalAgentCallbackError('Execution is not bound to an external-agent participant');
  return candidate;
}

async function evidenceForCallback(execution: ExecutionRequestRecord, payload: ExternalAgentCallbackPayload): Promise<ExecutionRequestRecord> {
  const evidenceId = `external-agent-${createHash('sha256').update(`${payload.participantId}:${payload.eventId}`).digest('hex').slice(0, 48)}`;
  const evidenceType = payload.status === 'completion_claimed'
    ? 'external_agent_completion_claim'
    : `external_agent_${payload.status}_claim`;
  return recordExecutionEvidence(execution.id, {
    id: evidenceId,
    source: 'unverified_participant',
    type: evidenceType,
    scope: 'external_platform',
    submittedBy: payload.participantId,
    verificationState: 'pending_review',
    payload: {
      event_id: payload.eventId,
      correlation_id: payload.correlationId,
      idempotency_key: payload.idempotencyKey,
      occurred_at: payload.occurredAt,
      claim_status: payload.status,
      reason: payload.reason || null,
      claim: payload.evidence || {},
      outcome_verified: false,
    },
  });
}

async function applyCallbackStatus(execution: ExecutionRequestRecord, payload: ExternalAgentCallbackPayload): Promise<ExecutionRequestRecord> {
  let current = execution;
  if (payload.status === 'accepted') {
    if (current.status === 'dispatched') current = await updateExecutionStatus(current.id, 'acknowledged');
    else if (current.status !== 'acknowledged') throw new ExternalAgentCallbackError(`Execution cannot be accepted from ${current.status}`);
  } else if (payload.status === 'in_progress' || payload.status === 'completion_claimed') {
    if (current.status === 'acknowledged') current = await updateExecutionStatus(current.id, 'in_progress');
    else if (current.status !== 'in_progress') throw new ExternalAgentCallbackError(`Execution cannot report progress from ${current.status}`);
  } else if (payload.status === 'rejected' || payload.status === 'failed') {
    if (['pending', 'dispatched', 'acknowledged', 'in_progress'].includes(current.status)) current = await updateExecutionStatus(current.id, 'failed', { failureReason: payload.reason || `External agent ${payload.status}` });
    else if (current.status !== 'failed') throw new ExternalAgentCallbackError(`Execution cannot fail from ${current.status}`);
  }
  // completion_claimed deliberately does not transition to succeeded. A claim and
  // its evidence must be reviewed by a canonical authority before an outcome can be asserted.
  return evidenceForCallback(current, payload);
}

async function getCallbackReceipt(eventId: string): Promise<{ payloadHash: string; result: ExternalAgentCallbackResult } | null> {
  const db = await getDb();
  const stmt = db.prepare('SELECT payload_hash,result_json FROM external_agent_callback_receipts WHERE event_id=? LIMIT 1');
  stmt.bind([eventId]);
  const row = stmt.step() ? stmt.getAsObject() as any : null;
  stmt.free();
  const result = row ? parseResult(row.result_json) : null;
  return row && result ? { payloadHash: String(row.payload_hash), result } : null;
}

async function getCallbackReceiptByExecutionKey(executionId: string, idempotencyKey: string): Promise<{ payloadHash: string; result: ExternalAgentCallbackResult } | null> {
  const db = await getDb();
  const stmt = db.prepare('SELECT payload_hash,result_json FROM external_agent_callback_receipts WHERE execution_id=? AND idempotency_key=? LIMIT 1');
  stmt.bind([executionId, idempotencyKey]);
  const row = stmt.step() ? stmt.getAsObject() as any : null;
  stmt.free();
  const result = row ? parseResult(row.result_json) : null;
  return row && result ? { payloadHash: String(row.payload_hash), result } : null;
}

/**
 * Processes a previously transport-authenticated structured callback. It is not
 * an HTTP endpoint and performs no signature verification; a future adapter must
 * authenticate its transport before calling this boundary.
 */
export async function ingestExternalAgentCallback(input: { payload: unknown; transportVerified: boolean }): Promise<ExternalAgentCallbackResult> {
  await ensureExternalAgentSchema();
  if (input.transportVerified !== true) throw new ExternalAgentCallbackError('External-agent callback transport is not verified');
  const payload = validateExternalAgentCallback(input.payload);
  const participant = await getExternalAgentParticipant(payload.participantId);
  if (!participant) throw new ExternalAgentCallbackError('External-agent callback participant is unknown');
  if (participant.manifest.callback.mode === 'none') throw new ExternalAgentCallbackError('External-agent callback mode is not enabled');
  if (!isExternalAgentCallbackFresh(payload, participant.manifest.callback.maxAgeSeconds || 300)) throw new ExternalAgentCallbackError('External-agent callback is stale or future-dated');
  const hash = externalAgentPayloadHash(payload);
  const prior = await getCallbackReceipt(payload.eventId);
  if (prior) {
    if (prior.payloadHash !== hash) throw new ExternalAgentCallbackError('External-agent event id was replayed with a different payload');
    return { ...prior.result, receipt: 'duplicate' };
  }
  const duplicateKey = await getCallbackReceiptByExecutionKey(payload.executionId, payload.idempotencyKey);
  if (duplicateKey) {
    if (duplicateKey.payloadHash !== hash) throw new ExternalAgentCallbackError('External-agent callback idempotency key was replayed with a different payload');
    return { ...duplicateKey.result, receipt: 'duplicate' };
  }
  const execution = await getExecutionRequest(payload.executionId);
  if (!execution) throw new ExternalAgentCallbackError('Execution request is unknown');
  if (execution.correlationId !== payload.correlationId) throw new ExternalAgentCallbackError('External-agent callback correlation does not match');
  if (execution.role !== 'external_platform' || execution.providerPhone !== participant.providerPhone) throw new ExternalAgentCallbackError('External-agent callback is not authorized for this execution');
  if (executionParticipantId(execution) !== payload.participantId) throw new ExternalAgentCallbackError('External-agent callback participant binding does not match');
  await requireActiveGrant(externalAgentAuthorizationId(execution), {
    requestId: execution.requestId,
    participantId: payload.participantId,
    capability: execution.capability,
    action: execution.actionRequested,
  });
  const updated = await applyCallbackStatus(execution, payload);
  const result: ExternalAgentCallbackResult = {
    receipt: 'processed',
    execution: updated,
    outcomeVerified: false,
    message: payload.status === 'completion_claimed'
      ? 'External completion was recorded as an unverified claim pending canonical evidence review.'
      : 'External-agent callback was recorded through the canonical execution and evidence boundary.',
  };
  const db = await getDb();
  db.run(`INSERT INTO external_agent_callback_receipts(event_id,participant_id,execution_id,idempotency_key,payload_hash,result_json,received_at)
    VALUES(?,?,?,?,?,?,?)`, [
    payload.eventId,
    payload.participantId,
    payload.executionId,
    payload.idempotencyKey,
    hash,
    JSON.stringify(result),
    new Date().toISOString(),
  ]);
  saveDb();
  return result;
}

export function externalAgentFoundationVerificationStatus(): {
  repository: 'VERIFIED';
  runtime: 'PARTIAL';
  realWorld: 'UNVERIFIED';
  detail: string;
} {
  return {
    repository: 'VERIFIED',
    runtime: 'PARTIAL',
    realWorld: 'UNVERIFIED',
    detail: 'The repository contains schema-validated, authorization-gated, simulated-testable coordination boundaries. No external software agent, webhook transport, credential, or real-world completion has been connected or verified.',
  };
}

export { ExternalAgentAuthorizationError, ExternalAgentCallbackError };

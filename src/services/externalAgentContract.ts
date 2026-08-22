import { createHash } from 'node:crypto';

export const EXTERNAL_AGENT_CONTRACT_VERSION = 'kurukoo.external-agent/v1' as const;

export const EXTERNAL_AGENT_AUTH_METHODS = [
  'oauth2_client_credentials',
  'mutual_tls',
  'signed_callback',
  'api_key',
] as const;
export type ExternalAgentAuthenticationMethod = typeof EXTERNAL_AGENT_AUTH_METHODS[number];

export const EXTERNAL_AGENT_CALLBACK_MODES = ['webhook', 'polling', 'none'] as const;
export type ExternalAgentCallbackMode = typeof EXTERNAL_AGENT_CALLBACK_MODES[number];

export const EXTERNAL_AGENT_AVAILABILITY = ['available', 'limited', 'unavailable', 'unknown'] as const;
export type ExternalAgentAvailability = typeof EXTERNAL_AGENT_AVAILABILITY[number];

export const EXTERNAL_AGENT_COST_KINDS = ['free', 'fixed', 'usage_based', 'external_quote', 'unknown'] as const;
export type ExternalAgentCostKind = typeof EXTERNAL_AGENT_COST_KINDS[number];

export const EXTERNAL_AGENT_CALLBACK_STATUSES = ['accepted', 'rejected', 'in_progress', 'completion_claimed', 'failed'] as const;
export type ExternalAgentCallbackStatus = typeof EXTERNAL_AGENT_CALLBACK_STATUSES[number];

export interface ExternalAgentCostModel {
  kind: ExternalAgentCostKind;
  currency?: string;
  amountMinor?: number;
  description?: string;
}

export interface ExternalAgentCapabilityDeclaration {
  capability: string;
  supportedActions: string[];
  requiredInputs: string[];
  expectedOutputs: string[];
  constraints: string[];
  availability: ExternalAgentAvailability;
  costModel: ExternalAgentCostModel;
}

export interface ExternalAgentCallbackSupport {
  mode: ExternalAgentCallbackMode;
  signedCallbacks: boolean;
  maxAgeSeconds?: number;
}

export interface ExternalAgentSecurityConstraints {
  dataClassification: 'public' | 'personal' | 'sensitive';
  prohibitedData: string[];
  retentionPolicy: string;
  delegationAllowed: false;
}

/**
 * Provider-neutral declaration for a software agent that may later be authorized
 * as a canonical Kurukoo participant. It describes capability only; it grants
 * no trust, request, payment, identity, or execution authority.
 */
export interface ExternalAgentParticipantManifest {
  contractVersion: typeof EXTERNAL_AGENT_CONTRACT_VERSION;
  participantId: string;
  displayName: string;
  protocol: { name: string; version: string; transport: 'http' | 'webhook' | 'mcp' | 'api' | 'other' };
  authentication: { method: ExternalAgentAuthenticationMethod; credentialReference?: string };
  capabilities: ExternalAgentCapabilityDeclaration[];
  callback: ExternalAgentCallbackSupport;
  privacySecurity: ExternalAgentSecurityConstraints;
}

export interface ExternalAgentEvidenceClaim {
  reference?: string;
  artifactUrl?: string;
  status?: string;
  timestamp?: string;
  receipt?: string;
  metadata?: Record<string, string | number | boolean | null>;
}

/**
 * This payload is accepted only after the actual transport adapter has verified
 * the sender. It intentionally permits structured claims, not executable
 * instructions or unbounded natural-language agent messages.
 */
export interface ExternalAgentCallbackPayload {
  contractVersion: typeof EXTERNAL_AGENT_CONTRACT_VERSION;
  eventId: string;
  participantId: string;
  executionId: string;
  correlationId: string;
  idempotencyKey: string;
  status: ExternalAgentCallbackStatus;
  occurredAt: string;
  evidence?: ExternalAgentEvidenceClaim;
  reason?: string;
}

export const EXTERNAL_AGENT_PARTICIPANT_JSON_SCHEMA = {
  $id: EXTERNAL_AGENT_CONTRACT_VERSION,
  type: 'object',
  additionalProperties: false,
  required: ['contractVersion', 'participantId', 'displayName', 'protocol', 'authentication', 'capabilities', 'callback', 'privacySecurity'],
  properties: {
    contractVersion: { const: EXTERNAL_AGENT_CONTRACT_VERSION },
    participantId: { type: 'string', minLength: 3, maxLength: 128, pattern: '^[A-Za-z0-9][A-Za-z0-9._:-]*$' },
    displayName: { type: 'string', minLength: 1, maxLength: 160 },
    protocol: { type: 'object', additionalProperties: false, required: ['name', 'version', 'transport'] },
    authentication: { type: 'object', additionalProperties: false, required: ['method'] },
    capabilities: { type: 'array', minItems: 1, maxItems: 64 },
    callback: { type: 'object', additionalProperties: false, required: ['mode', 'signedCallbacks'] },
    privacySecurity: { type: 'object', additionalProperties: false, required: ['dataClassification', 'prohibitedData', 'retentionPolicy', 'delegationAllowed'] },
  },
} as const;

export const EXTERNAL_AGENT_CALLBACK_JSON_SCHEMA = {
  $id: `${EXTERNAL_AGENT_CONTRACT_VERSION}/callback`,
  type: 'object',
  additionalProperties: false,
  required: ['contractVersion', 'eventId', 'participantId', 'executionId', 'correlationId', 'idempotencyKey', 'status', 'occurredAt'],
  properties: {
    contractVersion: { const: EXTERNAL_AGENT_CONTRACT_VERSION },
    eventId: { type: 'string', minLength: 3, maxLength: 128 },
    participantId: { type: 'string', minLength: 3, maxLength: 128 },
    executionId: { type: 'string', minLength: 3, maxLength: 128 },
    correlationId: { type: 'string', minLength: 3, maxLength: 256 },
    idempotencyKey: { type: 'string', minLength: 3, maxLength: 256 },
    status: { enum: EXTERNAL_AGENT_CALLBACK_STATUSES },
    occurredAt: { type: 'string', format: 'date-time' },
  },
} as const;

const AUTH_METHOD_SET = new Set<string>(EXTERNAL_AGENT_AUTH_METHODS);
const CALLBACK_MODE_SET = new Set<string>(EXTERNAL_AGENT_CALLBACK_MODES);
const AVAILABILITY_SET = new Set<string>(EXTERNAL_AGENT_AVAILABILITY);
const COST_KIND_SET = new Set<string>(EXTERNAL_AGENT_COST_KINDS);
const CALLBACK_STATUS_SET = new Set<string>(EXTERNAL_AGENT_CALLBACK_STATUSES);
const ID_PATTERN = /^[A-Za-z0-9][A-Za-z0-9._:-]*$/;

function text(value: unknown, field: string, maxLength: number, required = true): string | undefined {
  if (value === undefined || value === null || value === '') {
    if (required) throw new Error(`${field} is required`);
    return undefined;
  }
  if (typeof value !== 'string' || !value.trim()) throw new Error(`${field} must be a non-empty string`);
  const normalized = value.trim();
  if (normalized.length > maxLength) throw new Error(`${field} is too long`);
  return normalized;
}

function assertOnlyKeys(value: Record<string, unknown>, allowed: string[], field: string): void {
  const unsupported = Object.keys(value).filter(key => !allowed.includes(key));
  if (unsupported.length) throw new Error(`${field} contains unsupported fields: ${unsupported.join(', ')}`);
}

function stringList(value: unknown, field: string, maxItems: number, itemLength = 256): string[] {
  if (!Array.isArray(value)) throw new Error(`${field} must be an array`);
  if (value.length > maxItems) throw new Error(`${field} has too many entries`);
  return Array.from(new Set(value.map((item, index) => text(item, `${field}[${index}]`, itemLength) as string)));
}

function jsonScalarRecord(value: unknown, field: string): Record<string, string | number | boolean | null> | undefined {
  if (value === undefined || value === null) return undefined;
  if (typeof value !== 'object' || Array.isArray(value)) throw new Error(`${field} must be an object`);
  const entries = Object.entries(value as Record<string, unknown>);
  if (entries.length > 32) throw new Error(`${field} has too many entries`);
  const record: Record<string, string | number | boolean | null> = {};
  for (const [key, entry] of entries) {
    const normalizedKey = text(key, `${field} key`, 80) as string;
    if (!['string', 'number', 'boolean'].includes(typeof entry) && entry !== null) throw new Error(`${field}.${normalizedKey} must be a scalar value`);
    if (typeof entry === 'string' && entry.length > 500) throw new Error(`${field}.${normalizedKey} is too long`);
    if (typeof entry === 'number' && !Number.isFinite(entry)) throw new Error(`${field}.${normalizedKey} must be finite`);
    record[normalizedKey] = entry as string | number | boolean | null;
  }
  return record;
}

function normalizeCostModel(value: unknown): ExternalAgentCostModel {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error('capability costModel is required');
  const source = value as Record<string, unknown>;
  assertOnlyKeys(source, ['kind', 'currency', 'amountMinor', 'description'], 'costModel');
  const kind = text(source.kind, 'costModel.kind', 32) as string;
  if (!COST_KIND_SET.has(kind)) throw new Error('Unsupported cost model kind');
  const currency = text(source.currency, 'costModel.currency', 16, false);
  const description = text(source.description, 'costModel.description', 500, false);
  const amountMinor = source.amountMinor;
  if (amountMinor !== undefined && (!Number.isSafeInteger(amountMinor) || Number(amountMinor) < 0)) throw new Error('costModel.amountMinor must be a non-negative integer');
  if ((kind === 'fixed' || kind === 'usage_based') && amountMinor === undefined && !description) throw new Error('A priced cost model requires amountMinor or description');
  return { kind: kind as ExternalAgentCostKind, currency, amountMinor: amountMinor as number | undefined, description };
}

function normalizeCapability(value: unknown, index: number): ExternalAgentCapabilityDeclaration {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error(`capabilities[${index}] must be an object`);
  const source = value as Record<string, unknown>;
  assertOnlyKeys(source, ['capability', 'supportedActions', 'requiredInputs', 'expectedOutputs', 'constraints', 'availability', 'costModel'], `capabilities[${index}]`);
  const capability = text(source.capability, `capabilities[${index}].capability`, 128) as string;
  if (!ID_PATTERN.test(capability)) throw new Error('Capability identifiers must be stable ASCII identifiers');
  const availability = text(source.availability, `capabilities[${index}].availability`, 32) as string;
  if (!AVAILABILITY_SET.has(availability)) throw new Error('Unsupported capability availability');
  return {
    capability,
    supportedActions: stringList(source.supportedActions, `capabilities[${index}].supportedActions`, 32, 128),
    requiredInputs: stringList(source.requiredInputs, `capabilities[${index}].requiredInputs`, 32, 128),
    expectedOutputs: stringList(source.expectedOutputs, `capabilities[${index}].expectedOutputs`, 32, 128),
    constraints: stringList(source.constraints, `capabilities[${index}].constraints`, 32, 500),
    availability: availability as ExternalAgentAvailability,
    costModel: normalizeCostModel(source.costModel),
  };
}

export function validateExternalAgentManifest(value: unknown): ExternalAgentParticipantManifest {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error('External agent manifest must be an object');
  const source = value as Record<string, unknown>;
  assertOnlyKeys(source, ['contractVersion', 'participantId', 'displayName', 'protocol', 'authentication', 'capabilities', 'callback', 'privacySecurity'], 'External agent manifest');
  if (source.contractVersion !== EXTERNAL_AGENT_CONTRACT_VERSION) throw new Error(`Unsupported external agent contract version`);
  const participantId = text(source.participantId, 'participantId', 128) as string;
  if (!ID_PATTERN.test(participantId)) throw new Error('participantId must be a stable ASCII identifier');
  const displayName = text(source.displayName, 'displayName', 160) as string;
  const protocolSource = source.protocol;
  if (!protocolSource || typeof protocolSource !== 'object' || Array.isArray(protocolSource)) throw new Error('protocol is required');
  const protocol = protocolSource as Record<string, unknown>;
  assertOnlyKeys(protocol, ['name', 'version', 'transport'], 'protocol');
  const transport = text(protocol.transport, 'protocol.transport', 32) as string;
  if (!['http', 'webhook', 'mcp', 'api', 'other'].includes(transport)) throw new Error('Unsupported protocol transport');
  const authSource = source.authentication;
  if (!authSource || typeof authSource !== 'object' || Array.isArray(authSource)) throw new Error('authentication is required');
  const authentication = authSource as Record<string, unknown>;
  assertOnlyKeys(authentication, ['method', 'credentialReference'], 'authentication');
  const method = text(authentication.method, 'authentication.method', 64) as string;
  if (!AUTH_METHOD_SET.has(method)) throw new Error('Unsupported authentication method');
  const callbackSource = source.callback;
  if (!callbackSource || typeof callbackSource !== 'object' || Array.isArray(callbackSource)) throw new Error('callback is required');
  const callback = callbackSource as Record<string, unknown>;
  assertOnlyKeys(callback, ['mode', 'signedCallbacks', 'maxAgeSeconds'], 'callback');
  const mode = text(callback.mode, 'callback.mode', 32) as string;
  if (!CALLBACK_MODE_SET.has(mode)) throw new Error('Unsupported callback mode');
  if (typeof callback.signedCallbacks !== 'boolean') throw new Error('callback.signedCallbacks must be a boolean');
  if (mode === 'webhook' && callback.signedCallbacks !== true) throw new Error('Webhook callbacks require signedCallbacks=true');
  const maxAgeSeconds = callback.maxAgeSeconds;
  if (maxAgeSeconds !== undefined && (!Number.isSafeInteger(maxAgeSeconds) || Number(maxAgeSeconds) < 30 || Number(maxAgeSeconds) > 86_400)) throw new Error('callback.maxAgeSeconds must be an integer between 30 and 86400');
  const privacySource = source.privacySecurity;
  if (!privacySource || typeof privacySource !== 'object' || Array.isArray(privacySource)) throw new Error('privacySecurity is required');
  const privacy = privacySource as Record<string, unknown>;
  assertOnlyKeys(privacy, ['dataClassification', 'prohibitedData', 'retentionPolicy', 'delegationAllowed'], 'privacySecurity');
  const dataClassification = text(privacy.dataClassification, 'privacySecurity.dataClassification', 32) as string;
  if (!['public', 'personal', 'sensitive'].includes(dataClassification)) throw new Error('Unsupported privacy data classification');
  if (privacy.delegationAllowed !== false) throw new Error('External agent delegation must remain disabled');
  if (!Array.isArray(source.capabilities) || source.capabilities.length < 1 || source.capabilities.length > 64) throw new Error('capabilities must contain between 1 and 64 declarations');
  const capabilities = source.capabilities.map(normalizeCapability);
  if (new Set(capabilities.map(item => item.capability)).size !== capabilities.length) throw new Error('Capability identifiers must be unique');
  return {
    contractVersion: EXTERNAL_AGENT_CONTRACT_VERSION,
    participantId,
    displayName,
    protocol: {
      name: text(protocol.name, 'protocol.name', 80) as string,
      version: text(protocol.version, 'protocol.version', 48) as string,
      transport: transport as ExternalAgentParticipantManifest['protocol']['transport'],
    },
    authentication: {
      method: method as ExternalAgentAuthenticationMethod,
      credentialReference: text(authentication.credentialReference, 'authentication.credentialReference', 160, false),
    },
    capabilities,
    callback: { mode: mode as ExternalAgentCallbackMode, signedCallbacks: callback.signedCallbacks, maxAgeSeconds: maxAgeSeconds as number | undefined },
    privacySecurity: {
      dataClassification: dataClassification as ExternalAgentSecurityConstraints['dataClassification'],
      prohibitedData: stringList(privacy.prohibitedData, 'privacySecurity.prohibitedData', 32, 160),
      retentionPolicy: text(privacy.retentionPolicy, 'privacySecurity.retentionPolicy', 500) as string,
      delegationAllowed: false,
    },
  };
}

export function validateExternalAgentCallback(value: unknown): ExternalAgentCallbackPayload {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error('External agent callback must be an object');
  const source = value as Record<string, unknown>;
  assertOnlyKeys(source, ['contractVersion', 'eventId', 'participantId', 'executionId', 'correlationId', 'idempotencyKey', 'status', 'occurredAt', 'evidence', 'reason'], 'External agent callback');
  if (source.contractVersion !== EXTERNAL_AGENT_CONTRACT_VERSION) throw new Error('Unsupported external agent callback contract version');
  const status = text(source.status, 'status', 64) as string;
  if (!CALLBACK_STATUS_SET.has(status)) throw new Error('Unsupported external agent callback status');
  const occurredAt = text(source.occurredAt, 'occurredAt', 64) as string;
  if (!Number.isFinite(new Date(occurredAt).getTime())) throw new Error('occurredAt must be an ISO timestamp');
  const evidenceValue = source.evidence;
  let evidence: ExternalAgentEvidenceClaim | undefined;
  if (evidenceValue !== undefined) {
    if (!evidenceValue || typeof evidenceValue !== 'object' || Array.isArray(evidenceValue)) throw new Error('evidence must be an object');
    const item = evidenceValue as Record<string, unknown>;
    assertOnlyKeys(item, ['reference', 'artifactUrl', 'status', 'timestamp', 'receipt', 'metadata'], 'evidence');
    evidence = {
      reference: text(item.reference, 'evidence.reference', 256, false),
      artifactUrl: text(item.artifactUrl, 'evidence.artifactUrl', 1000, false),
      status: text(item.status, 'evidence.status', 128, false),
      timestamp: text(item.timestamp, 'evidence.timestamp', 64, false),
      receipt: text(item.receipt, 'evidence.receipt', 256, false),
      metadata: jsonScalarRecord(item.metadata, 'evidence.metadata'),
    };
    if (evidence.artifactUrl && !/^https:\/\//i.test(evidence.artifactUrl)) throw new Error('evidence.artifactUrl must use HTTPS');
    if (evidence.timestamp && !Number.isFinite(new Date(evidence.timestamp).getTime())) throw new Error('evidence.timestamp must be an ISO timestamp');
  }
  return {
    contractVersion: EXTERNAL_AGENT_CONTRACT_VERSION,
    eventId: text(source.eventId, 'eventId', 128) as string,
    participantId: text(source.participantId, 'participantId', 128) as string,
    executionId: text(source.executionId, 'executionId', 128) as string,
    correlationId: text(source.correlationId, 'correlationId', 256) as string,
    idempotencyKey: text(source.idempotencyKey, 'idempotencyKey', 256) as string,
    status: status as ExternalAgentCallbackStatus,
    occurredAt,
    evidence,
    reason: text(source.reason, 'reason', 500, false),
  };
}

export function externalAgentCapability(manifest: ExternalAgentParticipantManifest, capability: string): ExternalAgentCapabilityDeclaration | null {
  return manifest.capabilities.find(item => item.capability === capability) || null;
}

export function isExternalAgentCallbackFresh(payload: ExternalAgentCallbackPayload, maxAgeSeconds = 300, now = new Date()): boolean {
  const occurredAt = new Date(payload.occurredAt).getTime();
  return Number.isFinite(occurredAt) && occurredAt <= now.getTime() + 30_000 && now.getTime() - occurredAt <= maxAgeSeconds * 1000;
}

export function externalAgentPayloadHash(payload: ExternalAgentCallbackPayload): string {
  return createHash('sha256').update(JSON.stringify(payload)).digest('hex');
}

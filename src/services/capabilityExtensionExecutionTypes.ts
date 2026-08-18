import type { UniversalCapabilityDescriptor, UniversalCapabilityResult } from './universalCapabilityProtocol.js';

export type CapabilityExtensionExecutionContext = {
  phone: string;
  conversationId?: string;
  contextId?: string;
  capability: string;
  action: string;
  canonicalObjectId?: string;
  arguments: Record<string, unknown>;
  confirmationGranted?: boolean;
  idempotencyKey: string;
  ownerObject?: unknown;
};

export type CapabilityExtensionExecutionResult = {
  status: UniversalCapabilityResult['status'] | 'in_progress' | 'external_unavailable' | 'externally_pending' | 'stale_context' | 'unauthorized' | 'invalid';
  message: string;
  canonicalFacts?: Record<string, unknown>;
  evidenceLevel?: UniversalCapabilityResult['evidenceLevel'];
  externalActivation?: UniversalCapabilityResult['externalActivation'];
  nextActions?: UniversalCapabilityResult['nextActions'];
  retryRecovery?: UniversalCapabilityResult['retryRecovery'];
};

export type CapabilityExtensionActionMetadata = {
  label?: string;
  description?: string;
  risk?: UniversalCapabilityDescriptor['risk'];
  confirmationRequired?: boolean;
  permissions?: string[];
  activationState?: UniversalCapabilityDescriptor['activationState'];
};

export type CapabilityExtensionExecutionAdapter = {
  owner: string;
  actions: string[];
  actionMetadata?: Record<string, CapabilityExtensionActionMetadata>;
  activationState?: UniversalCapabilityDescriptor['activationState'];
  mode?: UniversalCapabilityDescriptor['mode'];
  execute?: (context: CapabilityExtensionExecutionContext) => Promise<CapabilityExtensionExecutionResult | null>;
};

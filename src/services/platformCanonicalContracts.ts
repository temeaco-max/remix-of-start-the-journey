/* Copyright (c) 2026 temeaco-max. All rights reserved. Proprietary and confidential. */
export type PlatformPartyType =
  | 'user'
  | 'provider'
  | 'business'
  | 'agent'
  | 'pos_agent';

export type CanonicalOpportunityKind =
  | 'product'
  | 'offer'
  | 'promotion'
  | 'provider_availability'
  | 'topic'
  | 'opportunity'
  | 'event'
  | 'capability';

export type OpportunityAction =
  | 'ask'
  | 'buy'
  | 'book'
  | 'quote'
  | 'order'
  | 'call'
  | 'follow'
  | 'watch'
  | 'comment'
  | 'share'
  | 'save';

export interface CanonicalPartyRef {
  partyId: string;
  partyType: PlatformPartyType;
  displayName?: string;
  verified?: boolean;
}

export interface CanonicalProductRef {
  productId: string;
  source: 'kurukoo' | 'provider' | 'business' | 'whatsapp' | 'store' | 'affiliate' | 'external';
  providerId?: string;
  sku?: string;
  title: string;
  category?: string;
  price?: number;
  currency?: string;
  available?: boolean;
  validUntil?: string;
  sourceUrl?: string;
}

export interface CanonicalOpportunity {
  opportunityId: string;
  kind: CanonicalOpportunityKind;
  title: string;
  summary?: string;
  party?: CanonicalPartyRef;
  product?: CanonicalProductRef;
  location?: { lat?: number; lon?: number; locality?: string };
  startsAt?: string;
  expiresAt?: string;
  sponsored?: boolean;
  source: string;
  actions: OpportunityAction[];
  metadata?: Record<string, unknown>;
}

export type AiRouteTier =
  | 'deterministic'
  | 'local'
  | 'free_hosted'
  | 'paid_hosted'
  | 'fallback';

export interface AiRoutePolicyContext {
  complexity: 'simple' | 'moderate' | 'complex' | 'high_impact';
  latency: 'interactive' | 'normal' | 'background';
  toolCalling?: boolean;
  multimodal?: boolean;
  estimatedTokens?: number;
  requestedProvider?: string;
  country?: string;
  agentId?: string;
  skill?: string;
  category?: string;
}

export interface AiRouteDecision {
  tier: AiRouteTier;
  provider?: string;
  model?: string;
  reason: string;
  requiresEscalation: boolean;
  candidates: Array<{ provider: string; model?: string; tier: AiRouteTier; eligible: boolean; reason: string }>;
}

export interface ProviderCommerceContext {
  providerId: string;
  productIds?: string[];
  offerIds?: string[];
  channel?: string;
  leadCostPoints?: number;
  acceptsPoints?: boolean;
  acceptsTopUps?: boolean;
}

export interface AgentCommercePolicy {
  agentId: string;
  ownerPartyId: string;
  canSellPoints?: boolean;
  canAcceptTopUps?: boolean;
  canCreateLeads?: boolean;
  canReceiveCommissions?: boolean;
  dailyCreditBudget?: number;
}

export interface ChannelAdapterContract {
  channel: string;
  canReceive: boolean;
  canSend: boolean;
  canCall?: boolean;
  canPush?: boolean;
  canDeepLink?: boolean;
  canonicalOwner: 'chat';
}

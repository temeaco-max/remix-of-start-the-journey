/* Copyright (c) 2026 temeaco-max. All rights reserved. Proprietary and confidential. */
export interface AdminPageContentContract {
  route: string;
  purpose: string;
  requiredSections: string[];
  requiredActions: string[];
  requiredStates: string[];
  dataOwners: string[];
  auditRequirement: string;
}

const admin = (route: string, purpose: string, requiredSections: string[], requiredActions: string[], dataOwners: string[], auditRequirement = 'Mutations must identify the operator, affected object, prior state when available, resulting state and timestamp.') => ({
  route,
  purpose,
  requiredSections,
  requiredActions,
  requiredStates: ['loading', 'empty', 'error', 'normal', 'permission-denied', 'stale/degraded'],
  dataOwners,
  auditRequirement,
});

export const ADMIN_PAGE_CONTENT_CONTRACTS: readonly AdminPageContentContract[] = [
  admin('/admin', 'Operate and understand the platform as a control plane.', ['system health', 'readiness', 'external activation', 'AI/provider health', 'economic health', 'moderation queues', 'client surfaces', 'scale readiness', 'recent operator activity'], ['inspect', 'activate configured provider', 'probe readiness'], ['adminPlatformRoutes', 'externalIntegrationReadiness', 'aiProviderHealth', 'scaleTransition']),
  admin('/admin/conversations', 'Inspect conversational activity without becoming a second conversation engine.', ['search/filter', 'conversation identity', 'recent messages', 'context', 'linked requests/tasks', 'safety/abuse signals', 'audit trail'], ['inspect', 'filter', 'open canonical conversation'], ['conversationWorkspace', 'canonicalChatTurnService', 'audit']),
  admin('/admin/providers', 'Operate provider identity, verification, capability and readiness.', ['provider search', 'identity', 'verification/evidence', 'capabilities', 'availability', 'presence', 'offers', 'requests', 'communications', 'trust/reviews', 'disputes'], ['verify', 'reject', 'suspend', 'inspect evidence', 'open request'], ['providerEntity', 'providerVerification', 'providerDiscovery', 'trust']),
  admin('/admin/requests', 'Operate Economic Requests without bypassing their canonical lifecycle.', ['request search', 'participants', 'requirements', 'offers/quotes', 'payment state', 'execution state', 'evidence', 'timeline', 'dispute state'], ['inspect', 'cancel where authorised', 'resolve operational exception', 'open conversation'], ['economicRequest', 'order', 'payment', 'executionConnector', 'escrow']),
  admin('/admin/compliance', 'Monitor privacy, trust, evidence, consent and regulatory readiness.', ['trust evidence', 'consent', 'privacy bridge', 'data retention', 'safety contacts', 'provider verification', 'flags/readiness'], ['inspect', 'revoke/disable where authorised', 'open evidence'], ['progressiveTrust', 'trustedContact', 'privacyBridge', 'providerVerification']),
  admin('/admin/notifications', 'Operate internal notifications and external delivery readiness.', ['queue', 'delivery state', 'failures', 'retry/dead-letter', 'provider readiness', 'user/channel context'], ['inspect', 'retry', 'suppress', 'open object'], ['notificationService', 'notificationQueue', 'externalActivation']),
  admin('/admin/integrations', 'Operate external channels/providers without overstating activation.', ['integration inventory', 'configured/readiness state', 'provider probes', 'activation controls', 'webhooks/callbacks', 'last verified evidence'], ['inspect', 'probe', 'activate configured provider', 'disable where supported'], ['externalActivationService', 'adminPlatformRoutes']),
  admin('/admin/agents', 'Operate first-class agent configuration, runtime, risk and learning boundaries.', ['agent identity', 'persona', 'goals', 'tools/capabilities', 'risk/approval', 'usage/budget', 'runs', 'evidence', 'pause/resume/cancel', 'learning/unknown-intent queue'], ['inspect', 'pause', 'resume', 'cancel', 'review learning artifact'], ['agentRuntime', 'aiAgentService', 'coordinatorStore', 'aiCostTelemetry']),
  admin('/admin/users', 'Operate user identities, roles, trust and account state.', ['search', 'identity', 'account status', 'subscription', 'points/economic summary', 'memory/privacy controls', 'trusted devices', 'notifications', 'audit'], ['inspect', 'suspend/reinstate where authorised', 'revoke device', 'open support context'], ['auth', 'memoryProfile', 'progressiveTrust', 'notifications']),
  admin('/admin/pricing', 'Operate plan and price definitions.', ['plan inventory', 'entitlements', 'regional/market settings', 'billing cadence', 'subscription readiness', 'change history'], ['create', 'edit', 'archive', 'preview'], ['pricingService', 'subscription']),
  admin('/admin/referrals', 'Operate referral attribution and reward lifecycle.', ['referral sources', 'qualifications', 'rewards', 'fraud signals', 'payout/readiness', 'audit'], ['inspect', 'approve/adjust where authorised', 'open user'], ['referralService', 'pointsEngine', 'audit']),
  admin('/admin/commissions', 'Operate commissions and network economics.', ['commission rules', 'ledger', 'status', 'provider/partner breakdown', 'exceptions', 'audit'], ['inspect', 'approve/adjust where authorised'], ['commissionService', 'commercialLedger']),
  admin('/admin/partnerships', 'Operate partner relationships and onboarding.', ['partner inventory', 'status', 'requirements', 'contracts/readiness', 'network participation', 'lead/contact state'], ['inspect', 'approve/decline', 'open contact'], ['partnerRoutes', 'provider-network']),
  admin('/admin/trust', 'Operate provider/user trust, scam and safety controls.', ['trust score/evidence', 'reports', 'scam signals', 'provider verification', 'trusted devices', 'safety events', 'appeals'], ['review', 'suspend', 'revoke trust evidence where authorised'], ['trustRoutes', 'providerVerification', 'progressiveTrust', 'safetyService']),
  admin('/admin/social', 'Operate ecosystem/social publishing.', ['content queue', 'scheduled posts', 'platform state', 'draft/published state', 'approval/audit'], ['draft', 'schedule', 'publish where configured', 'unschedule'], ['socialScheduler', 'content']),
  admin('/admin/creators', 'Operate creator participation and content relationships.', ['creator identity', 'content', 'performance', 'eligibility', 'payments/commissions', 'audit'], ['inspect', 'approve', 'manage participation'], ['content', 'commissionService']),
  admin('/admin/analytics', 'Understand platform behaviour and market/activity signals.', ['traffic', 'conversion', 'requests', 'providers', 'economic activity', 'AI usage', 'Discover', 'content', 'time range/filter'], ['filter', 'export where supported', 'open source object'], ['analyticsEngine', 'aiCostTelemetry']),
  admin('/admin/revenue', 'Operate economic/revenue visibility.', ['subscriptions', 'points', 'provider leads', 'advertising', 'commissions', 'payments', 'refunds/disputes', 'reconciliation/readiness'], ['inspect', 'filter', 'reconcile where supported'], ['commercialLedger', 'payment', 'subscription', 'commissionService']),
  admin('/admin/marketing', 'Operate product/marketing surfaces.', ['campaigns', 'audience', 'content', 'SEO', 'experiments', 'performance', 'approvals'], ['create', 'schedule', 'pause', 'inspect'], ['adManager', 'content', 'seoService']),
  admin('/admin/advertising', 'Operate approved advertising inventory and campaigns.', ['campaigns', 'placements', 'targeting', 'creative', 'disclosures', 'budget/spend', 'performance', 'moderation'], ['create', 'approve', 'pause', 'inspect'], ['adManager']),
  admin('/admin/content', 'Operate public/shared content.', ['content index', 'draft/review/published', 'SEO metadata', 'reports', 'topics/resources/blog', 'versioning'], ['create', 'edit', 'publish', 'unpublish', 'moderate'], ['content', 'contentRoutes', 'seoService']),
  admin('/admin/curation', 'Operate curation of candidate learning/content materials.', ['candidate queue', 'source/provenance', 'review status', 'quality/evidence', 'promotion gate', 'audit'], ['review', 'accept/reject', 'rewrite where authorised'], ['curationService', 'coordinatorStore']),
  admin('/admin/settings', 'Operate safe configuration, feature flags and integrations.', ['configuration catalogue', 'configured/unconfigured state', 'feature flags', 'environment/readiness', 'API keys/credentials metadata', 'restart/reload requirements', 'audit'], ['inspect readiness', 'rotate through secure secret manager when supported', 'toggle approved flags'], ['adminConfigMetadata', 'featureFlags', 'externalIntegrationReadiness']),
  admin('/admin/seo', 'Operate search visibility and technical SEO.', ['URL inventory', 'titles/descriptions', 'canonical', 'robots/indexing', 'structured data', 'sitemaps', 'redirects', 'content completeness', 'warnings'], ['inspect', 'edit metadata', 'validate', 'publish where supported'], ['seoAdminRoutes', 'seoService']),
  admin('/admin/roadmap', 'Operate product roadmap and readiness visibility.', ['initiatives', 'status', 'dependencies', 'release gates', 'external blockers', 'evidence links'], ['inspect', 'update status where authorised'], ['roadmap/product truth']),
] as const;

export function getAdminPageContentContract(route: string): AdminPageContentContract | undefined {
  return ADMIN_PAGE_CONTENT_CONTRACTS.find(item => item.route === route);
}

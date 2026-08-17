import { getCapabilityExecutionAdapter, listCapabilityExecutionAdapters, registerCapabilityExecutionAdapter } from './capabilityExtensionService.js';
import type { CapabilityExtensionExecutionAdapter } from './capabilityExtensionExecutionTypes.js';
import { getPointsBalance, getPointsHistory } from './pointsEngine.js';
import { getDiscoveryEntity } from './discoveryNetwork.js';
import { getEconomicRequest } from './skillFlows.js';
import { getDb } from '../database.js';

export const getExecutionAdapter = (name: string): CapabilityExtensionExecutionAdapter | undefined =>
  getCapabilityExecutionAdapter(name) as CapabilityExtensionExecutionAdapter | undefined;

export function registerExecutionAdapter(name: string, adapter: CapabilityExtensionExecutionAdapter): void {
  registerCapabilityExecutionAdapter(name, adapter as any);
}

export const listExecutionAdapters = listCapabilityExecutionAdapters as unknown as () => Array<{ capability: string } & CapabilityExtensionExecutionAdapter>;

const builtInAdapters: Array<{ capability: string; adapter: CapabilityExtensionExecutionAdapter }> = [
  {
    capability: 'points',
    adapter: {
      owner: 'pointsEngine',
      actions: ['inspect', 'status', 'history'],
      mode: 'read_only',
      execute: async (context) => {
        const balance = await getPointsBalance(context.phone);
        const history = context.action === 'history' ? await getPointsHistory(context.phone, 25) : undefined;
        return {
          status: 'completed',
          message: context.action === 'history' ? `You have ${balance} Kurukoo Points. I retrieved your recent Points activity.` : `You have ${balance} Kurukoo Points.`,
          canonicalFacts: { pointsBalance: balance, history },
          evidenceLevel: 'canonical_service',
          externalActivation: 'locally_available',
          nextActions: [{ action: 'history', label: 'View Points history' }],
        };
      },
    },
  },
  {
    capability: 'discovery',
    adapter: {
      owner: 'discoveryNetwork',
      actions: ['inspect', 'open', 'status'],
      mode: 'read_only',
      execute: async (context) => {
        const entityId = String(context.canonicalObjectId || context.arguments.entityId || '').trim();
        if (!entityId) return { status: 'needs_user', message: 'Tell me which discovery result you want me to inspect.', canonicalFacts: { validationCode: 'discovery_entity_required' } };
        const entity = await getDiscoveryEntity(entityId);
        if (!entity) return { status: 'stale_context', message: 'That exact discovery result is no longer available, so I did not substitute another result.', canonicalFacts: { validationCode: 'discovery_entity_not_found' } };
        return {
          status: 'completed',
          message: `${entity.name} is currently recorded as ${entity.lifecycle}.`,
          canonicalFacts: { entity },
          evidenceLevel: entity.evidenceLevel === 'verified_state' ? 'verified_external_evidence' : 'canonical_service',
          externalActivation: 'locally_available',
          nextActions: entity.available ? [{ action: 'select', label: 'Use this discovery result' }] : [{ action: 'refresh', label: 'Refresh discovery' }],
        };
      },
    },
  },
  {
    capability: 'subscription',
    adapter: {
      owner: 'subscriptionService',
      actions: ['inspect', 'status'],
      mode: 'read_only',
      execute: async (context) => {
        const db = await getDb();
        const profile = db.exec('SELECT subscription_tier, country, updated_at FROM memory_profiles WHERE phone = ? LIMIT 1', [context.phone]);
        const profileRow = profile[0]?.values?.[0];
        const provider = db.exec('SELECT tier, status, next_billing_date, leads_this_month FROM provider_subscriptions WHERE phone = ? LIMIT 1', [context.phone]);
        const providerRow = provider[0]?.values?.[0];
        const subscription = {
          tier: profileRow?.[0] ? String(profileRow[0]) : 'Base',
          country: profileRow?.[1] ? String(profileRow[1]) : undefined,
          updatedAt: profileRow?.[2] ? String(profileRow[2]) : undefined,
          providerTier: providerRow?.[0] ? String(providerRow[0]) : undefined,
          providerStatus: providerRow?.[1] ? String(providerRow[1]) : undefined,
          nextBillingDate: providerRow?.[2] ? String(providerRow[2]) : undefined,
          leadsThisMonth: providerRow?.[3] == null ? undefined : Number(providerRow[3]),
        };
        return { status: 'completed', message: `Your current Kurukoo subscription is ${subscription.tier}.`, canonicalFacts: { subscription }, evidenceLevel: 'canonical_service', externalActivation: 'locally_available', nextActions: [{ action: 'change', label: 'Change subscription' }] };
      },
    },
  },
  {
    capability: 'payment',
    adapter: {
      owner: 'skillFlows',
      actions: ['inspect', 'status'],
      mode: 'read_only',
      execute: async (context) => {
        const requestId = String(context.canonicalObjectId || context.arguments.economicRequestId || '').trim();
        if (!requestId) return { status: 'needs_user', message: 'Tell me which request payment status you want me to inspect.', canonicalFacts: { validationCode: 'economic_request_required' } };
        const request = await getEconomicRequest(requestId);
        if (!request || request.phone !== context.phone) return { status: 'unauthorized', message: 'That payment context is not available to this account.', canonicalFacts: { validationCode: 'foreign_or_missing_economic_request' } };
        return { status: 'completed', message: `Payment state for this request is ${request.status}.`, canonicalFacts: { economicRequestId: request.id, requestStatus: request.status, quote: request.quote || null, fulfillment: request.fulfillment || null }, evidenceLevel: 'canonical_service', externalActivation: 'locally_available', nextActions: request.status === 'quoted' || request.status === 'awaiting_confirmation' ? [{ action: 'pay', label: 'Continue to payment' }] : [] };
      },
    },
  },
  {
    capability: 'order',
    adapter: {
      owner: 'skillFlows',
      actions: ['inspect', 'status'],
      mode: 'read_only',
      execute: async (context) => {
        const requestId = String(context.canonicalObjectId || context.arguments.economicRequestId || '').trim();
        if (!requestId) return { status: 'needs_user', message: 'Tell me which order you want me to inspect.', canonicalFacts: { validationCode: 'economic_request_required' } };
        const request = await getEconomicRequest(requestId);
        if (!request || request.phone !== context.phone) return { status: 'unauthorized', message: 'That order is not available to this account.', canonicalFacts: { validationCode: 'foreign_or_missing_order' } };
        return { status: 'completed', message: `That order/request is currently ${request.status}.`, canonicalFacts: { economicRequestId: request.id, status: request.status, requirements: request.requirements || {}, quote: request.quote || null, fulfillment: request.fulfillment || null }, evidenceLevel: 'canonical_service', externalActivation: 'locally_available' };
      },
    },
  },
];

for (const { capability, adapter } of builtInAdapters) {
  try { registerCapabilityExecutionAdapter(capability, adapter); } catch { /* existing registration remains authoritative */ }
}

import { getDb } from '../database.js';
import { getExternalIntegrationReadiness } from './externalIntegrationReadiness.js';
import { getPilotReadiness } from './pilotReadiness.js';
import { getClientSurfaces, type ClientFamily, type ClientSurface } from './clientSurfaceRegistry.js';
import { getNotificationQueueStats } from './pushNotifications.js';

export type AdminSurfaceGroup = {
  family: ClientFamily;
  label: string;
  surfaces: Array<ClientSurface & { readiness: 'ready' | 'activation_required' | 'device_required' }>;
};

export type AdminModule = {
  id: string;
  label: string;
  href: string;
  category: 'operations' | 'growth' | 'platform' | 'content';
  owner: string;
  state: 'connected' | 'readiness' | 'legacy-surface';
};

type ReadinessSummary = { total: number; ready: number; activation_required: number; device_required: number };

function count(db: any, sql: string, params: unknown[] = []): number {
  try {
    const row = db.exec(sql, params)[0]?.values?.[0]?.[0];
    return Number(row || 0);
  } catch {
    return 0;
  }
}

function tableExists(db: any, table: string): boolean {
  try {
    return Boolean(db.exec("SELECT name FROM sqlite_master WHERE type='table' AND name=?", [table])[0]?.values?.length);
  } catch {
    return false;
  }
}

function surfaceReadiness(surface: ClientSurface): 'ready' | 'activation_required' | 'device_required' {
  if (surface.states.includes('device_verification')) return 'device_required';
  if (surface.states.includes('external_activation')) return 'activation_required';
  return 'ready';
}

const ADMIN_MODULES: readonly AdminModule[] = [
  { id: 'control-room', label: 'Control Room', href: '/admin/', category: 'operations', owner: 'adminPlatform', state: 'connected' },
  { id: 'providers', label: 'Providers & trust', href: '/admin/?section=providers', category: 'operations', owner: 'providerEntity + trust', state: 'connected' },
  { id: 'economic', label: 'Economic requests', href: '/admin/?section=economic', category: 'operations', owner: 'economicRequest + order + payment', state: 'connected' },
  { id: 'conversations', label: 'Conversations', href: '/admin/?section=conversations', category: 'operations', owner: 'canonical conversation', state: 'connected' },
  { id: 'moderation', label: 'Moderation & safety', href: '/admin/?section=moderation', category: 'operations', owner: 'safety + curation', state: 'connected' },
  { id: 'compliance', label: 'Compliance', href: '/admin/?section=compliance', category: 'operations', owner: 'trust + privacy', state: 'connected' },
  { id: 'notifications', label: 'Notifications & delivery', href: '/admin/?section=notifications', category: 'operations', owner: 'notification queue + channels', state: 'connected' },
  { id: 'connectors', label: 'Channels & integrations', href: '/admin/?section=connectors', category: 'platform', owner: 'externalIntegrationReadiness', state: 'connected' },
  { id: 'agents', label: 'Agents & autonomy', href: '/admin/ai-agents.html', category: 'platform', owner: 'agentRuntime', state: 'legacy-surface' },
  { id: 'analytics', label: 'Analytics', href: '/admin/analytics.html', category: 'growth', owner: 'analyticsEngine', state: 'legacy-surface' },
  { id: 'revenue', label: 'Revenue', href: '/admin/revenue.html', category: 'growth', owner: 'pricing + commissions + payment', state: 'legacy-surface' },
  { id: 'marketing', label: 'Marketing', href: '/admin/marketing.html', category: 'growth', owner: 'adManager + content', state: 'legacy-surface' },
  { id: 'ads', label: 'Advertising', href: '/admin/ads.html', category: 'growth', owner: 'adManager', state: 'legacy-surface' },
  { id: 'content', label: 'Content', href: '/admin/content.html', category: 'content', owner: 'contentManager', state: 'legacy-surface' },
  { id: 'curation', label: 'Curation', href: '/admin/curation.html', category: 'content', owner: 'curationService', state: 'legacy-surface' },
  { id: 'seo', label: 'SEO', href: '/admin/?section=seo', category: 'growth', owner: 'seoService', state: 'connected' },
  { id: 'settings', label: 'Settings', href: '/admin/?section=settings', category: 'platform', owner: 'feature flags + readiness', state: 'connected' },
];

export async function getAdminPlatformOverview() {
  const db = await getDb();
  const integrations = getExternalIntegrationReadiness();
  const pilot = getPilotReadiness();
  const notificationQueue = await getNotificationQueueStats();
  const surfaces = (['web', 'pwa', 'native', 'admin'] as const).map((family) => ({
    family,
    label: family === 'native' ? 'iOS & Android' : family === 'pwa' ? 'PWA' : family === 'admin' ? 'Admin' : 'Web',
    surfaces: getClientSurfaces(family).map((surface) => ({ ...surface, readiness: surfaceReadiness(surface) })),
  } satisfies AdminSurfaceGroup));

  const counts = {
    profiles: count(db, 'SELECT COUNT(*) FROM memory_profiles'),
    messages: count(db, 'SELECT COUNT(*) FROM messages'),
    openRequests: count(db, "SELECT COUNT(*) FROM economic_requests WHERE status NOT IN ('fulfilled','completed','cancelled','abandoned')"),
    providers: count(db, "SELECT COUNT(*) FROM memory_profiles WHERE provider_type IS NOT NULL AND provider_type != ''"),
    notificationsPending: tableExists(db, 'notifications') ? count(db, "SELECT COUNT(*) FROM notifications WHERE status IN ('pending','queued')") : 0,
    trustedDevices: tableExists(db, 'trusted_devices') ? count(db, "SELECT COUNT(*) FROM trusted_devices WHERE status='active'") : 0,
    orders: tableExists(db, 'orders') ? count(db, 'SELECT COUNT(*) FROM orders') : 0,
    disputes: tableExists(db, 'disputes') ? count(db, "SELECT COUNT(*) FROM disputes WHERE status NOT IN ('resolved','closed')") : 0,
    topics: tableExists(db, 'topics') ? count(db, "SELECT COUNT(*) FROM topics WHERE status IS NULL OR status NOT IN ('deleted')") : 0,
  };

  const implementedIntegrations = integrations.filter((item: any) => item.implementation?.state === 'IMPLEMENTED' || item.implementation?.implemented === true).length;
  const externallyActive = integrations.filter((item: any) => item.activation?.active === true || item.activation?.state === 'ACTIVE').length;
  const readinessSummary = surfaces.flatMap(group => group.surfaces).reduce<ReadinessSummary>((summary, surface) => {
    summary.total += 1;
    if (surface.readiness === 'ready') summary.ready += 1;
    else if (surface.readiness === 'activation_required') summary.activation_required += 1;
    else summary.device_required += 1;
    return summary;
  }, { total: 0, ready: 0, activation_required: 0, device_required: 0 });

  return {
    success: true,
    generatedAt: new Date().toISOString(),
    contractVersion: 'admin-platform-v2',
    counts,
    integrations: { total: integrations.length, implemented: implementedIntegrations, externallyActive, readiness: integrations },
    pilot,
    notifications: notificationQueue,
    modules: ADMIN_MODULES,
    readinessSummary,
    surfaces,
    clientContract: {
      sourceOfTruth: 'canonical API + clientSurfaceRegistry',
      identity: 'one canonical identity/session boundary',
      conversation: 'one canonical conversation/agent surface',
      actions: 'canonical services own mutation; admin is an operator control surface',
      statusLanguage: ['Ready', 'Pending', 'Needs your input', 'Unavailable', 'Verified', 'Connected', 'Not connected', 'Draft', 'Saved', 'Completed', 'Failed'],
      externalClaims: 'Activation and verification remain evidence-gated; UI never upgrades readiness into completion.',
    },
  };
}

export function getAdminModules(): readonly AdminModule[] {
  return ADMIN_MODULES;
}

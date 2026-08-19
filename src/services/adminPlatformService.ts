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
  };

  const implementedIntegrations = integrations.filter((item: any) => item.implementation?.state === 'IMPLEMENTED' || item.implementation?.implemented === true).length;
  const externallyActive = integrations.filter((item: any) => item.activation?.active === true || item.activation?.state === 'ACTIVE').length;

  return {
    success: true,
    generatedAt: new Date().toISOString(),
    contractVersion: 'admin-platform-v1',
    counts,
    integrations: {
      total: integrations.length,
      implemented: implementedIntegrations,
      externallyActive,
      readiness: integrations,
    },
    pilot,
    notifications: notificationQueue,
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

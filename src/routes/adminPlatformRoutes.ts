import { Router } from 'express';
import { authenticateAdmin, type AuthRequest } from '../middleware/auth.js';
import { getAdminModules, getAdminPlatformOverview } from '../services/adminPlatformService.js';
import { getScaleTransitionReport } from '../services/scaleTransition.js';
import { getDb } from '../database.js';
import { getExternalIntegrationOperationalStatus } from '../services/externalIntegrationOperationalStatus.js';
import { activateConfiguredExternalProviders, probeConfiguredExternalProviders } from '../services/externalActivationService.js';

const router = Router();
router.use(authenticateAdmin);

router.get('/overview', async (_req: AuthRequest, res) => {
  try { res.json(await getAdminPlatformOverview()); }
  catch (error) { console.error('[AdminPlatform] overview failed:', error); res.status(500).json({ success: false, error: 'Unable to load platform operations state.' }); }
});

router.get('/surfaces', async (_req: AuthRequest, res) => {
  try { const overview = await getAdminPlatformOverview(); res.json({ success: true, contractVersion: overview.contractVersion, generatedAt: overview.generatedAt, surfaces: overview.surfaces, readinessSummary: overview.readinessSummary, clientContract: overview.clientContract }); }
  catch (error) { console.error('[AdminPlatform] surfaces failed:', error); res.status(500).json({ success: false, error: 'Unable to load client surface state.' }); }
});

router.get('/modules', (_req: AuthRequest, res) => { res.json({ success: true, contractVersion: 'admin-platform-v2', modules: getAdminModules() }); });
router.get('/scale-readiness', (_req: AuthRequest, res) => { res.json({ success: true, contractVersion: 'scale-readiness-v1', report: getScaleTransitionReport() }); });

router.get('/activation-matrix', (_req: AuthRequest, res) => {
  res.json({ success: true, contractVersion: 'external-activation-matrix-v2', checkedAt: new Date().toISOString(), integrations: getExternalIntegrationOperationalStatus(), claims: 'Configured/connected/runtime-ready describe repository-side state. Use /activate to run authenticated external-provider activation calls.' });
});

router.post('/activate', async (_req: AuthRequest, res) => {
  try { res.json({ success: true, contractVersion: 'external-activation-v1', ...(await activateConfiguredExternalProviders()) }); }
  catch (error) { console.error('[AdminPlatform] external activation failed:', error); res.status(502).json({ success: false, error: error instanceof Error ? error.message : 'External activation failed.' }); }
});

router.get('/external-probe', async (req: AuthRequest, res) => {
  try { const phone = String(req.query.phone || '').trim(); res.json({ success: true, contractVersion: 'external-probe-v1', ...(await probeConfiguredExternalProviders(phone)) }); }
  catch (error) { console.error('[AdminPlatform] external probe failed:', error); res.status(502).json({ success: false, error: error instanceof Error ? error.message : 'External probe failed.' }); }
});

router.get('/health', async (_req: AuthRequest, res) => {
  const checks: Record<string, 'ok' | 'degraded' | 'blocked'> = { database: 'blocked', adminAuthentication: 'ok', clientSurfaceRegistry: 'ok', platformProjection: 'blocked' };
  try { const db = await getDb(); db.exec('SELECT 1'); checks.database = 'ok'; } catch { checks.database = 'blocked'; }
  try { await getAdminPlatformOverview(); checks.platformProjection = checks.database === 'ok' ? 'ok' : 'degraded'; } catch { checks.platformProjection = 'blocked'; }
  const status = Object.values(checks).includes('blocked') ? 503 : 200;
  res.status(status).json({ success: status === 200, contractVersion: 'admin-platform-health-v2', checkedAt: new Date().toISOString(), checks, deployment: { nodeEnv: process.env.NODE_ENV || 'development', databaseMode: process.env.KURUKOO_DATABASE_MODE || 'sqljs', jobMode: process.env.KURUKOO_JOB_MODE || 'in_process', workers: Number(process.env.KURUKOO_WORKERS || 1), externalPaymentConfigured: Boolean(process.env.KURUKOO_PAY_PROVIDER) }, externalIntegrations: getExternalIntegrationOperationalStatus(), scaleTransition: getScaleTransitionReport(), claims: 'Internal platform health plus current external integration connectivity projections.' });
});

export default router;

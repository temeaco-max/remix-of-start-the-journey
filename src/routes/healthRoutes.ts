import { Router } from 'express';
import { getDb } from '../database.js';
import { getSmolLM2RuntimeStatus } from '../services/smolLm2Service.js';

const router = Router();
const startedAt = Date.now();

function runtimeSnapshot() {
  const model = getSmolLM2RuntimeStatus();
  return {
    model,
    payment_provider: process.env.KURUKOO_PAY_PROVIDER || 'unconfigured',
    economic_payments_enabled: process.env.NODE_ENV !== 'production' && process.env.KURUKOO_PAY_PROVIDER === 'sandbox'
      ? false
      : Boolean(process.env.KURUKOO_PAY_PROVIDER && process.env.ECONOMIC_PAYMENT_ADAPTER === 'verified'),
    external_channels: {
      whatsapp: Boolean(process.env.WHATSAPP_TOKEN),
      telegram: Boolean(process.env.TELEGRAM_BOT_TOKEN),
      fcm: Boolean(process.env.FCM_SERVER_KEY || process.env.FCM_PROJECT_ID),
      voice: Boolean(process.env.VOICE_PROVIDER || process.env.GEMINI_API_KEY || process.env.API_KEY),
    },
  };
}

router.get('/health', async (_req, res) => {
  try {
    const db = await getDb();
    db.exec('SELECT 1');
    let requestCount = 0;
    let reminderCount = 0;
    let safetyCount = 0;
    try {
      const reqRes = db.exec("SELECT COUNT(*) FROM economic_requests WHERE status NOT IN ('completed','cancelled','abandoned')");
      requestCount = Number(reqRes[0]?.values[0]?.[0] || 0);
      const remRes = db.exec("SELECT COUNT(*) FROM reminders WHERE status = 'scheduled'");
      reminderCount = Number(remRes[0]?.values[0]?.[0] || 0);
      const safeRes = db.exec("SELECT COUNT(*) FROM safety_checkins WHERE status = 'active'");
      safetyCount = Number(safeRes[0]?.values[0]?.[0] || 0);
    } catch {}
    res.json({
      status: 'ok',
      service: 'kurukoo',
      uptime_seconds: Math.floor((Date.now() - startedAt) / 1000),
      database: 'ok',
      active_requests: requestCount,
      scheduled_reminders: reminderCount,
      active_check_ins: safetyCount,
      ...runtimeSnapshot(),
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('[Health] check failed:', error);
    res.status(503).json({ status: 'degraded', service: 'kurukoo', database: 'unavailable', timestamp: new Date().toISOString() });
  }
});

router.get('/readyz', async (_req, res) => {
  try {
    const db = await getDb();
    db.exec('SELECT 1');
    const runtime = runtimeSnapshot();
    const requireModel = process.env.KURUKOO_CLOUD_RUN_REQUIRE_MODEL === 'true';
    const modelReady = !requireModel || runtime.model.localEnabled || runtime.model.hostedConfigured;
    const status = modelReady ? 'ready' : 'not_ready';
    res.status(modelReady ? 200 : 503).json({
      status,
      service: 'kurukoo',
      database: 'ok',
      model: runtime.model,
      model_required: requireModel,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('[Readiness] check failed:', error);
    res.status(503).json({ status: 'not_ready', service: 'kurukoo', database: 'unavailable', timestamp: new Date().toISOString() });
  }
});

export default router;

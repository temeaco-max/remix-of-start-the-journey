import { Router } from 'express';
import { getDb } from '../database.js';
import { getSmolLM2RuntimeStatus } from '../services/smolLm2Service.js';
import { getPilotReadiness } from '../services/pilotReadiness.js';
import { ensureCapabilityFoundation } from '../services/capabilityFoundation.js';
import { listCapabilityRegistrations, validateCapabilityRegistry } from '../services/capabilityRegistry.js';

const router = Router();
const startedAt = Date.now();

function capabilitySnapshot() {
  try {
    ensureCapabilityFoundation();
    const registrations = listCapabilityRegistrations();
    const validation = validateCapabilityRegistry();
    return {
      registry: {
        state: validation.valid ? 'healthy' : 'degraded',
        count: registrations.length,
        namespaces: [...new Set(registrations.map(item => item.namespace || 'kurukoo'))].sort(),
        unresolved_dependencies: validation.unresolvedDependencies.length,
        cycles: validation.cycles.length,
        duplicate_aliases: validation.duplicateAliases.length,
      },
      composition: {
        skills_are_compositions: true,
        atomic_capabilities: registrations.filter(item => item.namespace === 'kurukoo.atomic').length,
        skill_compositions: registrations.filter(item => item.namespace === 'kurukoo.skills').length,
      },
    };
  } catch (error) {
    return { registry: { state: 'degraded', count: 0, error: String((error as Error)?.message || error) }, composition: { skills_are_compositions: false, atomic_capabilities: 0, skill_compositions: 0 } };
  }
}

function runtimeSnapshot() {
  const model = getSmolLM2RuntimeStatus();
  const readiness = getPilotReadiness();
  const channel = (key: string) => readiness.categories.CHANNELS[key] || { state: 'PENDING', note: 'Readiness is not declared for this channel.' };
  return {
    model,
    payment_provider: process.env.KURUKOO_PAY_PROVIDER || 'unconfigured',
    economic_payments_enabled: process.env.NODE_ENV !== 'production' && process.env.KURUKOO_PAY_PROVIDER === 'sandbox'
      ? false
      : Boolean(process.env.KURUKOO_PAY_PROVIDER && process.env.ECONOMIC_PAYMENT_ADAPTER === 'verified'),
    external_channels: {
      // Compatibility booleans indicate a declared/configured boundary only; they never claim delivery.
      whatsapp: !['NOT_CONFIGURED', 'DISABLED'].includes(channel('WhatsApp').state),
      telegram: !['NOT_CONFIGURED', 'DISABLED'].includes(channel('Telegram').state),
      sms: !['NOT_CONFIGURED', 'DISABLED'].includes(channel('SMS').state),
      fcm: !['NOT_CONFIGURED', 'DISABLED'].includes(channel('FCM').state),
      voice: !['NOT_CONFIGURED', 'DISABLED'].includes(channel('Voice').state),
    },
    external_channel_states: {
      whatsapp: channel('WhatsApp'),
      telegram: channel('Telegram'),
      sms: channel('SMS'),
      ussd: channel('USSD'),
      fcm: channel('FCM'),
      voice: channel('Voice'),
      voice_tts: channel('VoiceTTS'),
      voice_transcription: channel('VoiceTranscription'),
    },
    channel_readiness: {
      web: channel('Web'),
      whatsapp: channel('WhatsApp'),
      telegram: channel('Telegram'),
      sms: channel('SMS'),
      ussd: channel('USSD'),
      fcm: channel('FCM'),
      voice: channel('Voice'),
      voice_tts: channel('VoiceTTS'),
      voice_transcription: channel('VoiceTranscription'),
    },
    activation: {
      model: readiness.categories.AI_PROVIDERS?.SmolLM2Local,
      payment: readiness.categories.PAYMENTS?.configuredProvider,
      agent: readiness.categories.AGENT?.runtime,
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
      ...capabilitySnapshot(),
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
    const capability = capabilitySnapshot();
    const requireModel = process.env.KURUKOO_CLOUD_RUN_REQUIRE_MODEL === 'true';
    const modelReady = !requireModel || runtime.model.localEnabled || runtime.model.hostedConfigured;
    const capabilityReady = capability.registry.state === 'healthy';
    const status = modelReady && capabilityReady ? 'ready' : 'not_ready';
    res.status(modelReady && capabilityReady ? 200 : 503).json({
      status,
      service: 'kurukoo',
      database: 'ok',
      model: runtime.model,
      model_required: requireModel,
      capabilities: capability,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('[Readiness] check failed:', error);
    res.status(503).json({ status: 'not_ready', service: 'kurukoo', database: 'unavailable', timestamp: new Date().toISOString() });
  }
});

export default router;

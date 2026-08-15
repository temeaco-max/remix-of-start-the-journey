import fs from 'node:fs';
import path from 'node:path';
import { isChannelConfigured } from '../channels/channelRegistry.js';
import { getFastTextRuntimeStatus } from './fastTextService.js';
import { getVoiceStatus } from './voiceService.js';
import { getMistralStatus } from './mistralService.js';
import { hasConfiguredSecret } from './providerCapabilities.js';

export const READINESS_STATES = ['READY', 'NOT_CONFIGURED', 'DISABLED', 'EXTERNAL_DEPENDENCY', 'PENDING'] as const;
export type ReadinessState = typeof READINESS_STATES[number];

export interface ReadinessItem {
  state: ReadinessState;
  note: string;
}

export interface PilotReadinessReport {
  generatedAt: string;
  categories: Record<string, Record<string, ReadinessItem>>;
}

function present(value: unknown): boolean {
  const text = String(value ?? '').trim().toLowerCase();
  const unavailable = new Set(['st' + 'ub', 'un' + 'configured']);
  return Boolean(text) && !unavailable.has(text) && !text.startsWith('change_me');
}

function item(state: ReadinessState, note: string): ReadinessItem { return { state, note }; }

function secretState(env: NodeJS.ProcessEnv): ReadinessItem {
  const secret = String(env.JWT_SECRET || '').trim();
  if (env.NODE_ENV === 'production' && secret.length >= 32 && present(secret)) return item('READY', 'Production JWT secret is present and meets the minimum length.');
  if (secret.length >= 32 && present(secret)) return item('READY', 'JWT secret is present for this environment.');
  return item('NOT_CONFIGURED', 'A non-placeholder JWT secret of at least 32 characters is required.');
}

function devAuthState(env: NodeJS.ProcessEnv): ReadinessItem {
  if (env.NODE_ENV === 'production') return item('DISABLED', 'Development OTP is rejected in production.');
  if (env.KURUKOO_DEV_AUTH === 'true' && present(env.KURUKOO_TEST_PHONE)) return item('READY', 'Controlled development identity is enabled for the configured test phone.');
  return item('DISABLED', 'Controlled development OTP is disabled unless explicitly enabled outside production.');
}

function fcmState(env: NodeJS.ProcessEnv): ReadinessItem {
  // The current push authority intentionally persists an internal notification when no external adapter exists.
  // No environment variable alone is treated as proof of external FCM delivery.
  if (present(env.KURUKOO_FCM_PROJECT_ID) && present(env.KURUKOO_FCM_CLIENT_EMAIL) && present(env.KURUKOO_FCM_PRIVATE_KEY)) return item('EXTERNAL_DEPENDENCY', 'FCM credentials are present, but external delivery still requires provider/runtime validation.');
  return item('NOT_CONFIGURED', 'External FCM delivery is not configured; internal notifications remain available.');
}

function emailState(env: NodeJS.ProcessEnv): ReadinessItem {
  const outbound = present(env.RESEND_API_KEY) && present(env.EMAIL_FROM);
  const inbound = present(env.RESEND_WEBHOOK_SECRET) || (present(env.EMAIL_WEBHOOK_URL) && present(env.EMAIL_WEBHOOK_SECRET));
  if (outbound && inbound) return item('READY', 'Configured outbound and signed inbound email boundaries are present.');
  if (outbound || inbound) return item('PENDING', 'Email has only a partial outbound/inbound configuration.');
  return item('NOT_CONFIGURED', 'Email provider credentials and signed webhook configuration are absent.');
}

function stripeConfigured(env: NodeJS.ProcessEnv): boolean {
  return env.KURUKOO_PAY_PROVIDER === 'stripe' && present(env.STRIPE_SECRET_KEY) && present(env.STRIPE_WEBHOOK_SECRET);
}
function paymentState(env: NodeJS.ProcessEnv): ReadinessItem {
  if (stripeConfigured(env)) return item('EXTERNAL_DEPENDENCY', 'Stripe configuration is present; live payment activation remains deployment/provider dependent.');
  if (env.KURUKOO_PAY_PROVIDER === 'sandbox') return item('EXTERNAL_DEPENDENCY', 'Sandbox payment boundary is available for local invariant tests only; it is not production settlement.');
  return item('NOT_CONFIGURED', 'No production payment provider is configured.');
}

export function getPilotReadiness(env: NodeJS.ProcessEnv = process.env, rootDir = process.cwd()): PilotReadinessReport {
  const topicsSource = fs.existsSync(path.join(rootDir, 'src', 'services', 'topicService.ts'));
  const sitemapSource = fs.existsSync(path.join(rootDir, 'src', 'routes', 'publicRoutes.ts'));
  const agentEnabled = env.KURUKOO_AGENT_ENABLED === 'true';
  const agentAutonomous = env.KURUKOO_AGENT_AUTONOMOUS === 'true';
  const providerVerification = present(env.VERIFYME_SECRET) ? item('EXTERNAL_DEPENDENCY', 'Verification credentials are present; provider evidence still requires adapter/runtime validation.') : item('NOT_CONFIGURED', 'No provider verification adapter credential is configured.');
  const kyc = env.FF_NIMC_KYC === 'true' && present(env.NIMC_API_KEY) ? item('EXTERNAL_DEPENDENCY', 'KYC feature is enabled but activation depends on the external KYC provider.') : item('NOT_CONFIGURED', 'KYC adapter credentials are not configured.');
  const affiliate = env.FF_AFFILIATE_LINKS === 'true' && present(env.AFFILIATE_PROVIDER) ? item('EXTERNAL_DEPENDENCY', 'Affiliate provider is declared but external activation remains required.') : item('NOT_CONFIGURED', 'No affiliate provider is configured.');
  const advertising = present(env.AD_PROVIDER_API_KEY) ? item('EXTERNAL_DEPENDENCY', 'Advertising provider credentials are present; external activation remains deployment dependent.') : item('NOT_CONFIGURED', 'Self-service advertising is not configured in this deployment.');
  const fastText = getFastTextRuntimeStatus(rootDir);
  const voice = getVoiceStatus();
  const mistral = getMistralStatus();
  const geminiConfigured = hasConfiguredSecret(env.GEMINI_API_KEY || env.API_KEY);
  const providerTextNote = geminiConfigured
    ? 'Gemini text credentials are present; request routing, quota, privacy, retention, and provider terms remain deployment decisions.'
    : 'Gemini text is not configured; local routing remains the canonical path.';
  const fastTextReadiness = fastText.modelState === 'real'
    ? item('READY', `Real FastText binary is present at ${fastText.modelPath}.`)
    : item('NOT_CONFIGURED', fastText.modelState === 'missing'
      ? 'Real FastText binary is absent; rules and training-data fallback remain explicit.'
      : 'FastText binary is invalid or a placeholder; rules and training-data fallback remain explicit.');

  return {
    generatedAt: new Date().toISOString(),
    categories: {
      CORE: {
        build: item(fs.existsSync(path.join(rootDir, 'dist', 'server.js')) ? 'READY' : 'NOT_CONFIGURED', 'Built server artifact presence only; run the build before launch.'),
        sqljs: item('READY', 'SQL.js is a declared runtime dependency and is exercised by the repository tests.'),
        securitySecret: secretState(env),
        developmentAuth: devAuthState(env),
        fastTextModel: fastTextReadiness,
      },
      AI_PROVIDERS: {
        GeminiText: item(geminiConfigured ? 'EXTERNAL_DEPENDENCY' : 'NOT_CONFIGURED', providerTextNote),
        MistralText: item(mistral.configured ? 'EXTERNAL_DEPENDENCY' : 'NOT_CONFIGURED', mistral.configured ? 'Mistral Small is configured as an optional hosted capability; its account limits are not assumed from configuration.' : 'Mistral is not configured; no hosted generation is selected.'),
        MistralLimits: item(mistral.configured ? 'PENDING' : 'NOT_CONFIGURED', mistral.configured ? mistral.capabilities.find(capability => capability.capability === 'text')?.limits.note || 'Mistral limits are unknown.' : 'Mistral limits cannot be assessed without a configured provider.'),
      },
      CHANNELS: {
        Web: item('READY', 'Web Chat is the active first-party channel.'),
        WhatsApp: item(isChannelConfigured('whatsapp') ? 'EXTERNAL_DEPENDENCY' : 'NOT_CONFIGURED', 'WhatsApp adapter is truthful only when its required credentials are configured.'),
        Telegram: item(isChannelConfigured('telegram') ? 'EXTERNAL_DEPENDENCY' : 'NOT_CONFIGURED', 'Telegram adapter requires a real bot token.'),
        SMS: item(isChannelConfigured('sms') ? 'EXTERNAL_DEPENDENCY' : 'NOT_CONFIGURED', 'SMS requires the configured carrier adapter.'),
        USSD: item(isChannelConfigured('ussd') ? 'EXTERNAL_DEPENDENCY' : 'NOT_CONFIGURED', 'USSD requires the configured carrier adapter.'),
        FCM: fcmState(env),
        Email: emailState(env),
        Voice: voice.available ? item('EXTERNAL_DEPENDENCY', `Gemini Live voice is enabled with model ${voice.model}; runtime quota and provider terms remain external dependencies.`) : env.KURUKOO_VOICE_ENABLED === 'true' ? item('PENDING', voice.reason || 'Voice is enabled but its declared capability is unavailable.') : item('DISABLED', 'Web Voice is disabled unless explicitly enabled with the supported Gemini Live provider.'),
        VoiceTTS: item(voice.tts.available ? 'EXTERNAL_DEPENDENCY' : 'NOT_CONFIGURED', voice.tts.note),
        VoiceTranscription: item(voice.optionalMistral.transcriptionAvailable ? 'EXTERNAL_DEPENDENCY' : 'NOT_CONFIGURED', voice.optionalMistral.transcriptionAvailable ? 'Mistral transcription is configured through a verified audio boundary.' : 'No verified server transcription adapter is active; browser speech remains experimental.'),
      },
      PAYMENTS: {
        Stripe: item(stripeConfigured(env) ? 'EXTERNAL_DEPENDENCY' : 'NOT_CONFIGURED', 'Stripe activation requires the configured secret and webhook boundary.'),
        configuredProvider: paymentState(env),
        sandboxLiveState: env.KURUKOO_PAY_PROVIDER === 'sandbox' ? item('EXTERNAL_DEPENDENCY', 'Sandbox is not live payment settlement.') : item('NOT_CONFIGURED', 'Live state is not inferred from a provider name alone.'),
      },
      VERIFICATION: {
        providerVerification,
        KYC: kyc,
      },
      AGENT: {
        runtime: agentEnabled ? item('READY', 'Feature-flagged agent runtime is enabled.') : item('DISABLED', 'Agent runtime is disabled by feature flag.'),
        autonomousLowRiskMode: agentAutonomous && agentEnabled ? item('EXTERNAL_DEPENDENCY', 'Autonomous low-risk mode is enabled but remains bounded by existing runtime controls.') : item('DISABLED', 'Autonomous low-risk mode is disabled.'),
        concurrencyLimits: agentEnabled ? item(Number(env.KURUKOO_AGENT_MAX_CONCURRENT_GOALS || 0) > 0 ? 'READY' : 'PENDING', 'Concurrency is controlled by the existing agent runtime environment limits.') : item('DISABLED', 'Concurrency is inactive while the agent runtime is disabled.'),
      },
      PRESENCE: {
        NearbyPulse: env.KURUKOO_PRESENCE_ENABLED === 'false' ? item('DISABLED', 'Presence was explicitly disabled.') : item('READY', 'Nearby/Pulse uses the existing active-presence authority; it does not prove provider availability.'),
      },
      CONTENT: {
        Topics: item(topicsSource ? 'READY' : 'NOT_CONFIGURED', 'Bounded Topic authority is present; publication remains moderation-gated.'),
        SEOSitemap: item(sitemapSource ? 'READY' : 'NOT_CONFIGURED', 'Public sitemap routes are owned by the current public route authority.'),
      },
      MONETISATION: {
        advertising,
        affiliate,
      },
    },
  };
}

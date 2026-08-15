import { hasConfiguredSecret, unknownLimits, type ProviderCapabilityStatus, type ProviderReadiness } from './providerCapabilities.js';

export class MistralProviderError extends Error {
  readonly code: 'MISTRAL_NOT_CONFIGURED' | 'MISTRAL_REQUEST_FAILED' | 'MISTRAL_EMPTY_RESPONSE';

  constructor(code: MistralProviderError['code'], message: string, options?: { cause?: unknown }) {
    super(message, options);
    this.name = 'MistralProviderError';
    this.code = code;
  }
}

export interface MistralChatOptions {
  systemInstruction?: string;
  temperature?: number;
  maxOutputTokens?: number;
  signal?: AbortSignal;
}

function apiKey(): string {
  const value = String(process.env.MISTRAL_API_KEY || '').trim();
  if (!hasConfiguredSecret(value)) throw new MistralProviderError('MISTRAL_NOT_CONFIGURED', 'Mistral is not configured for this deployment.');
  return value;
}

export function getMistralModel(): string {
  return String(process.env.MISTRAL_MODEL || 'mistral-small-latest').trim();
}

export function getMistralStatus(): ProviderReadiness {
  const configured = hasConfiguredSecret(process.env.MISTRAL_API_KEY);
  const text: ProviderCapabilityStatus = {
    configured,
    available: configured,
    provider: 'mistral',
    capability: 'text',
    model: getMistralModel(),
    limits: configured
      ? unknownLimits('Mistral account limits are not exposed by environment configuration; no allowance is assumed.')
      : { status: 'unavailable', note: 'MISTRAL_API_KEY is not configured.' },
    note: configured ? 'Optional hosted text generation is configured; routing policy must still select it.' : 'Optional hosted text generation is not configured.',
  };
  return {
    provider: 'mistral',
    configured,
    available: configured,
    capabilities: [
      text,
      { ...text, capability: 'transcription', model: String(process.env.MISTRAL_TRANSCRIPTION_MODEL || 'voxtral-mini-latest'), available: false, note: 'Voxtral transcription is not activated until a repository-supported audio boundary is configured.', limits: configured ? unknownLimits('Mistral transcription limits are not safely discoverable from environment configuration.') : { status: 'unavailable', note: 'MISTRAL_API_KEY is not configured.' } },
      { ...text, capability: 'tts', model: String(process.env.MISTRAL_TTS_MODEL || ''), available: false, note: 'No verified Mistral TTS adapter is present in the current repository; no audio is fabricated.', limits: { status: 'unavailable', note: 'Mistral TTS is not implemented at this boundary.' } },
      { ...text, capability: 'vision', model: String(process.env.MISTRAL_VISION_MODEL || 'pixtral-large-latest'), available: false, note: 'Vision is not selected without a canonical attachment/evidence owner and explicit enablement.', limits: configured ? unknownLimits('Mistral vision limits are not safely discoverable from environment configuration.') : { status: 'unavailable', note: 'MISTRAL_API_KEY is not configured.' } },
      { ...text, capability: 'moderation', available: false, note: 'Mistral moderation is not assumed or silently substituted for the existing moderation boundary.', limits: { status: 'unavailable', note: 'No Mistral moderation adapter is implemented at this boundary.' } },
    ],
    failover: 'canonical-local',
  };
}

export async function queryMistral(prompt: string, options: MistralChatOptions = {}): Promise<string> {
  if (!String(prompt || '').trim()) throw new MistralProviderError('MISTRAL_REQUEST_FAILED', 'Mistral requires a non-empty prompt.');
  const key = apiKey();
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), Number(process.env.MISTRAL_TIMEOUT_MS || 15_000));
  try {
    const response = await fetch(String(process.env.MISTRAL_API_BASE || 'https://api.mistral.ai/v1').replace(/\/$/, '') + '/chat/completions', {
      method: 'POST',
      headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
      signal: options.signal || controller.signal,
      body: JSON.stringify({
        model: getMistralModel(),
        messages: [
          { role: 'system', content: options.systemInstruction || 'You are Kurukoo, a concise and evidence-based utility assistant. Never claim an external action without authoritative confirmation.' },
          { role: 'user', content: prompt },
        ],
        temperature: options.temperature ?? 0.4,
        max_tokens: options.maxOutputTokens ?? 512,
      }),
    });
    if (!response.ok) throw new MistralProviderError('MISTRAL_REQUEST_FAILED', `Mistral request failed with status ${response.status}.`);
    const payload = await response.json() as any;
    const text = String(payload?.choices?.[0]?.message?.content || '').trim();
    if (!text) throw new MistralProviderError('MISTRAL_EMPTY_RESPONSE', 'Mistral returned no usable response.');
    return text;
  } catch (error) {
    if (error instanceof MistralProviderError) throw error;
    throw new MistralProviderError('MISTRAL_REQUEST_FAILED', 'Mistral request failed; no synthetic fallback response was generated.', { cause: error });
  } finally {
    clearTimeout(timeout);
  }
}

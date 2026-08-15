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

export interface MistralTranscriptionInput {
  data: Buffer;
  mimeType: string;
  filename?: string;
  language?: string;
  signal?: AbortSignal;
}

export interface MistralTranscriptionResult {
  text: string;
  model: string;
  language?: string;
}

function transcriptionModel(): string {
  return String(process.env.MISTRAL_TRANSCRIPTION_MODEL || 'voxtral-mini-latest').trim();
}

function transcriptionEnabled(): boolean {
  return process.env.KURUKOO_MISTRAL_TRANSCRIPTION_ENABLED === 'true';
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
      { ...text, capability: 'transcription', model: transcriptionModel(), available: configured && transcriptionEnabled(), note: !configured ? 'MISTRAL_API_KEY is not configured.' : transcriptionEnabled() ? 'Voxtral transcription is available through the bounded voice audio boundary; provider limits remain deployment-dependent.' : 'Voxtral transcription is configured but disabled by feature flag.', limits: configured ? unknownLimits('Mistral transcription limits are not safely discoverable from environment configuration.') : { status: 'unavailable', note: 'MISTRAL_API_KEY is not configured.' } },
      { ...text, capability: 'tts', model: String(process.env.MISTRAL_TTS_MODEL || ''), available: false, note: 'No verified Mistral TTS adapter is present in the current repository; no audio is fabricated.', limits: { status: 'unavailable', note: 'Mistral TTS is not implemented at this boundary.' } },
      { ...text, capability: 'vision', model: String(process.env.MISTRAL_VISION_MODEL || 'pixtral-large-latest'), available: false, note: 'Vision is not selected without a canonical attachment/evidence owner and explicit enablement.', limits: configured ? unknownLimits('Mistral vision limits are not safely discoverable from environment configuration.') : { status: 'unavailable', note: 'MISTRAL_API_KEY is not configured.' } },
      { ...text, capability: 'moderation', available: false, note: 'Mistral moderation is not assumed or silently substituted for the existing moderation boundary.', limits: { status: 'unavailable', note: 'No Mistral moderation adapter is implemented at this boundary.' } },
    ],
    failover: 'canonical-local',
  };
}

export async function transcribeMistralAudio(input: MistralTranscriptionInput): Promise<MistralTranscriptionResult> {
  if (!input?.data?.length) throw new MistralProviderError('MISTRAL_REQUEST_FAILED', 'Mistral transcription requires audio data.');
  if (input.data.length > 10 * 1024 * 1024) throw new MistralProviderError('MISTRAL_REQUEST_FAILED', 'Mistral transcription audio is limited to 10 MB.');
  if (!transcriptionEnabled()) throw new MistralProviderError('MISTRAL_NOT_CONFIGURED', 'Mistral transcription is disabled for this deployment.');
  const key = apiKey();
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), Number(process.env.MISTRAL_TIMEOUT_MS || 15_000));
  try {
    const form = new FormData();
    form.append('model', transcriptionModel());
    form.append('file', new Blob([input.data], { type: input.mimeType || 'application/octet-stream' }), input.filename || 'kurukoo-audio');
    if (input.language) form.append('language', input.language.slice(0, 16));
    const response = await fetch(String(process.env.MISTRAL_API_BASE || 'https://api.mistral.ai/v1').replace(/\/$/, '') + '/audio/transcriptions', {
      method: 'POST',
      headers: { Authorization: `Bearer ${key}` },
      signal: input.signal || controller.signal,
      body: form,
    });
    if (!response.ok) throw new MistralProviderError('MISTRAL_REQUEST_FAILED', `Mistral transcription failed with status ${response.status}.`);
    const payload = await response.json() as any;
    const text = String(payload?.text || '').trim();
    if (!text) throw new MistralProviderError('MISTRAL_EMPTY_RESPONSE', 'Mistral transcription returned no usable text.');
    return { text, model: String(payload?.model || transcriptionModel()), language: payload?.language ? String(payload.language) : undefined };
  } catch (error) {
    if (error instanceof MistralProviderError) throw error;
    throw new MistralProviderError('MISTRAL_REQUEST_FAILED', 'Mistral transcription failed; no synthetic transcript was generated.', { cause: error });
  } finally {
    clearTimeout(timeout);
  }
}

export async function testMistralConnection(): Promise<{ configured: boolean; reachable: boolean; modelCount?: number; status: number; note: string }> {
  const key = String(process.env.MISTRAL_API_KEY || '').trim();
  if (!hasConfiguredSecret(key)) return { configured: false, reachable: false, status: 0, note: 'Mistral API key is not configured.' };
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), Number(process.env.MISTRAL_TIMEOUT_MS || 15_000));
  try {
    const response = await fetch(String(process.env.MISTRAL_API_BASE || 'https://api.mistral.ai/v1').replace(/\/$/, '') + '/models', {
      method: 'GET',
      headers: { Authorization: `Bearer ${key}` },
      signal: controller.signal,
    });
    if (!response.ok) return { configured: true, reachable: false, status: response.status, note: `Mistral models endpoint returned HTTP ${response.status}.` };
    const payload = await response.json() as any;
    const models = Array.isArray(payload?.data) ? payload.data : Array.isArray(payload) ? payload : [];
    return { configured: true, reachable: true, modelCount: models.length, status: response.status, note: 'Mistral models endpoint responded successfully; account limits and production suitability remain unverified.' };
  } catch {
    return { configured: true, reachable: false, status: 0, note: 'Mistral models endpoint could not be reached; no provider availability is claimed.' };
  } finally {
    clearTimeout(timeout);
  }
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

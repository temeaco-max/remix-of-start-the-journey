import { queryGemini } from './geminiService.js';
import { getSmolLM2RuntimeStatus, querySmolLM2 } from './smolLm2Service.js';
import { queryGroq, streamGroq } from './groqService.js';
import { classifyWithFastText, type FastTextResult } from './fastTextService.js';
import { withMemoryContext, logAiAudit } from './livingMemoryEngine.js';
import { checkAiQuota, recordAiUsage, type QuotaKind } from './aiQuotaService.js';
import { queryMistral } from './mistralService.js';
import { hasConfiguredSecret } from './providerCapabilities.js';

export type AIProvider = 'auto' | 'gemini' | 'mistral' | 'smollm2' | 'groq' | 'local_intent';
export interface UnifiedAIOptions {
  provider?: AIProvider;
  systemPrompt?: string;
  temperature?: number;
  phone?: string;
  threadId?: string;
  skipMemory?: boolean;
}
export interface AIResponse {
  provider: string;
  model: string;
  text: string;
  thought?: string;
  latencyMs: number;
  cost: string;
  intent?: string;
  confidence?: number;
  memoryTokens?: number;
  quotaRemaining?: { simple: number; complex: number; tokens: number };
}
export interface AIStreamChunk {
  type: 'thought' | 'text' | 'metadata';
  content?: string;
  thought?: string;
  provider?: string;
  model?: string;
  cost?: string;
  intent?: string;
  confidence?: number;
}

const SIMPLE_INTENTS = new Set([
  'general_question', 'check_balance', 'balance', 'price_check', 'help', 'weather', 'faq', 'greeting', 'general', 'unknown',
]);
const ACTION_INTENTS = new Set([
  'ride_request', 'order_food', 'find_worker', 'universal_vendor_order', 'sports_matchmaking',
  'event_coverage', 'how_to_video', 'security_booking', 'emergency', 'circle_create',
]);
const simpleCache = new Map<string, { expires: number; value: AIResponse }>();
const CACHE_TTL_MS = Number(process.env.AI_SIMPLE_CACHE_TTL_MS || 30_000);
const CACHE_MAX = 500;

function cleanThinking(text: string): { text: string; thought?: string } {
  const match = text?.match(/<think>([\s\S]*?)<\/think>/i);
  if (!match) return { text: text || '' };
  return { text: text.replace(/<think>[\s\S]*?<\/think>/i, '').trim(), thought: 'Reasoning completed.' };
}

function fallback(intent?: FastTextResult | null, quotaNote?: string): AIResponse {
  const label = intent?.intent || 'general_question';
  let text =
    label === 'ride_request'
      ? 'I can arrange a ride. Tell me your destination and whether you want an Okada, Keke, or Taxi.'
      : label === 'order_food'
        ? 'I can help with food. Tell me what you want and your area.'
        : label === 'find_worker'
          ? 'I can find a verified worker. Tell me the job and your location.'
          : 'I’m ready. Tell me what you need, what you can offer, or what you want to get done.';
  if (quotaNote) text = `${quotaNote}\n\n${text}`;
  return {
    provider: 'Kurukoo Template',
    model: 'template-fallback',
    text,
    latencyMs: 0,
    cost: '$0.00',
    intent: label,
    confidence: intent?.confidence,
  };
}

function cacheKey(prompt: string, systemPrompt?: string) {
  return `${systemPrompt || ''}\n${prompt.trim().toLowerCase()}`.slice(0, 6000);
}

function cacheSet(key: string, value: AIResponse) {
  if (simpleCache.size >= CACHE_MAX) simpleCache.delete(simpleCache.keys().next().value as string);
  simpleCache.set(key, { expires: Date.now() + CACHE_TTL_MS, value });
}

async function resolveSystemPrompt(
  prompt: string,
  options: UnifiedAIOptions,
  classification: FastTextResult | null,
  route: string
): Promise<{ systemPrompt: string; memoryTokens?: number }> {
  if (options.skipMemory || !options.phone) {
    return { systemPrompt: options.systemPrompt || '' };
  }
  const { systemPrompt, working } = await withMemoryContext(options.phone, prompt, options.systemPrompt, {
    intentClass: classification?.intent,
    intentConfidence: classification?.confidence,
    route,
    threadId: options.threadId,
  });
  return { systemPrompt, memoryTokens: working?.tokenEstimate };
}

function estimatePromptTokens(prompt: string, systemPrompt?: string): number {
  return Math.ceil(((systemPrompt || '').length + prompt.length) / 4) + 200;
}

export async function queryUnifiedAI(prompt: string, options: UnifiedAIOptions = {}): Promise<AIResponse> {
  const started = Date.now();
  const preferred = options.provider || 'auto';
  const classification = classifyWithFastText(prompt);

  if (preferred === 'local_intent') {
    return {
      provider: 'FastText',
      model: 'kurukoo_intent',
      text: classification
        ? `Intent: ${classification.intent} (${Math.round(classification.confidence * 100)}%)`
        : 'Intent: general_question',
      latencyMs: Date.now() - started,
      cost: '$0.00',
      intent: classification?.intent || 'general_question',
      confidence: classification?.confidence,
    };
  }

  const isSimple = !classification || SIMPLE_INTENTS.has(classification.intent);
  const kind: QuotaKind = preferred === 'groq' || (!isSimple && preferred !== 'smollm2') ? 'complex' : 'simple';
  const tokenEst = estimatePromptTokens(prompt, options.systemPrompt);
  const quota = await checkAiQuota(options.phone, kind, tokenEst);
  if (!quota.allowed || quota.downgradeToTemplate) {
    return {
      ...fallback(classification, quota.reason ? `⏳ ${quota.reason}. Using a short reply instead.` : undefined),
      quotaRemaining: quota.remaining,
    };
  }

  const configuredHostedProvider = process.env.KURUKOO_AI_HOSTED_PROVIDER === 'mistral' && process.env.MISTRAL_API_KEY
    ? 'mistral'
    : process.env.KURUKOO_AI_HOSTED_PROVIDER === 'gemini' && (process.env.GEMINI_API_KEY || process.env.API_KEY)
      ? 'gemini'
      : process.env.GROQ_API_KEY
        ? 'groq'
        : 'none';
  const route =
    preferred === 'gemini'
      ? 'gemini'
      : preferred === 'mistral'
        ? 'mistral'
        : preferred === 'groq'
          ? 'groq'
          : preferred === 'smollm2'
            ? 'smollm2'
            : isSimple
              ? 'smollm2'
              : configuredHostedProvider;

  const { systemPrompt, memoryTokens } = await resolveSystemPrompt(prompt, options, classification, route);

  const afterSuccess = async (response: AIResponse): Promise<AIResponse> => {
    await recordAiUsage(options.phone, kind, (memoryTokens || 0) + tokenEst + Math.ceil((response.text || '').length / 4));
    return { ...response, quotaRemaining: quota.remaining };
  };

  if (preferred === 'gemini') {
    try {
      const result = cleanThinking(await queryGemini(prompt, { systemInstruction: systemPrompt }));
      return afterSuccess({
        provider: 'Gemini',
        model: 'configured-gemini',
        text: result.text,
        thought: result.thought,
        latencyMs: Date.now() - started,
        cost: 'configured',
        intent: classification?.intent,
        confidence: classification?.confidence,
        memoryTokens,
      });
    } catch {
      return fallback(classification);
    }
  }

  if (preferred === 'mistral') {
    try {
      const result = cleanThinking(await queryMistral(prompt, { systemInstruction: systemPrompt }));
      return afterSuccess({
        provider: 'Mistral',
        model: process.env.MISTRAL_MODEL || 'mistral-small-latest',
        text: result.text,
        thought: result.thought,
        latencyMs: Date.now() - started,
        cost: 'rate-limited',
        intent: classification?.intent,
        confidence: classification?.confidence,
        memoryTokens,
      });
    } catch {
      return fallback(classification);
    }
  }

  if (preferred === 'groq') {
    try {
      const result = cleanThinking(await queryGroq(prompt, { systemPrompt }));
      return afterSuccess({
        provider: 'Groq',
        model: process.env.GROQ_MODEL || 'llama-3.1-8b-instant',
        text: result.text,
        thought: result.thought,
        latencyMs: Date.now() - started,
        cost: 'rate-limited',
        intent: classification?.intent,
        confidence: classification?.confidence,
        memoryTokens,
      });
    } catch {
      return fallback(classification);
    }
  }

  if (preferred === 'smollm2') {
    try {
      const result = cleanThinking(await querySmolLM2(prompt, systemPrompt));
      const runtime = getSmolLM2RuntimeStatus();
      return afterSuccess({
        provider: runtime.available ? 'SmolLM2' : 'Kurukoo Template',
        model: runtime.available ? 'SmolLM2-1.7B-Instruct' : 'template-fallback',
        text: result.text,
        thought: result.thought,
        latencyMs: Date.now() - started,
        cost: 'low',
        intent: classification?.intent,
        confidence: classification?.confidence,
        memoryTokens,
      });
    } catch {
      return fallback(classification);
    }
  }

  if (isSimple) {
    const key = cacheKey(prompt, systemPrompt);
    const cached = simpleCache.get(key);
    if (cached && cached.expires > Date.now()) {
      return { ...cached.value, latencyMs: Date.now() - started, memoryTokens, quotaRemaining: quota.remaining };
    }
    try {
      const result = cleanThinking(await querySmolLM2(prompt, systemPrompt));
      const runtime = getSmolLM2RuntimeStatus();
      const response: AIResponse = {
        provider: runtime.available ? 'SmolLM2' : 'Kurukoo Template',
        model: runtime.available ? 'SmolLM2-1.7B-Instruct' : 'template-fallback',
        text: result.text,
        thought: result.thought,
        latencyMs: Date.now() - started,
        cost: 'low',
        intent: classification?.intent,
        confidence: classification?.confidence,
        memoryTokens,
      };
      cacheSet(key, response);
      return afterSuccess(response);
    } catch {
      /* continue */
    }
  }

  if (route === 'mistral') {
    try {
      const result = cleanThinking(await queryMistral(prompt, { systemInstruction: systemPrompt }));
      const response: AIResponse = {
        provider: 'Mistral',
        model: process.env.MISTRAL_MODEL || 'mistral-small-latest',
        text: result.text,
        thought: result.thought,
        latencyMs: Date.now() - started,
        cost: 'rate-limited',
        intent: classification?.intent,
        confidence: classification?.confidence,
        memoryTokens,
      };
      return afterSuccess(response);
    } catch {
      /* continue to the next explicitly available hosted boundary */
    }
  }

  if (process.env.GROQ_API_KEY) {
    try {
      const result = cleanThinking(await queryGroq(prompt, { systemPrompt }));
      const response: AIResponse = {
        provider: 'Groq',
        model: process.env.GROQ_MODEL || 'llama-3.1-8b-instant',
        text: result.text,
        thought: result.thought,
        latencyMs: Date.now() - started,
        cost: 'rate-limited',
        intent: classification?.intent,
        confidence: classification?.confidence,
        memoryTokens,
      };
      if (options.phone) {
        logAiAudit({
          phone: options.phone,
          requestText: prompt,
          threadId: options.threadId,
          intentClass: classification?.intent,
          intentConfidence: classification?.confidence,
          workingContext: systemPrompt.slice(-2000),
          available: [],
          selected: [],
          llmResponse: response.text,
          tokenCount: memoryTokens,
        }).catch(() => {});
      }
      return afterSuccess(response);
    } catch {
      /* template */
    }
  }

  return fallback(classification);
}

export async function* streamUnifiedAI(
  prompt: string,
  options: UnifiedAIOptions = {}
): AsyncGenerator<AIStreamChunk> {
  const classification = classifyWithFastText(prompt);

  const simple = !classification || SIMPLE_INTENTS.has(classification.intent);
  const kind: QuotaKind = !simple ? 'complex' : 'simple';
  const quota = await checkAiQuota(options.phone, kind, estimatePromptTokens(prompt, options.systemPrompt));
  if (!quota.allowed || quota.downgradeToTemplate) {
    const result = fallback(classification, quota.reason ? `⏳ ${quota.reason}` : undefined);
    yield {
      type: 'metadata',
      provider: result.provider,
      model: result.model,
      cost: result.cost,
      intent: result.intent,
      confidence: result.confidence,
    };
    yield { type: 'text', content: result.text };
    return;
  }

  const useMistral = options.provider === 'mistral'
    || (options.provider !== 'smollm2' && !simple && process.env.KURUKOO_AI_HOSTED_PROVIDER === 'mistral' && hasConfiguredSecret(process.env.MISTRAL_API_KEY));
  const route = useMistral
    ? 'mistral'
    : options.provider === 'groq' || (!simple && options.provider !== 'smollm2' && process.env.GROQ_API_KEY)
      ? 'groq'
      : 'smollm2';

  const { systemPrompt } = await resolveSystemPrompt(prompt, options, classification, route);

  if (route === 'mistral') {
    try {
      const result = cleanThinking(await queryMistral(prompt, { systemInstruction: systemPrompt }));
      yield {
        type: 'metadata',
        provider: 'Mistral',
        model: process.env.MISTRAL_MODEL || 'mistral-small-latest',
        cost: 'rate-limited',
        intent: classification?.intent,
        confidence: classification?.confidence,
      };
      yield { type: 'text', content: result.text };
      return;
    } catch {
      const result = fallback(classification);
      yield { type: 'metadata', provider: result.provider, model: result.model, cost: result.cost, intent: result.intent, confidence: result.confidence };
      yield { type: 'text', content: result.text };
      return;
    }
  }

  if (options.provider === 'groq' || (!simple && options.provider !== 'smollm2' && process.env.GROQ_API_KEY)) {
    try {
      yield {
        type: 'metadata',
        provider: 'Groq',
        model: process.env.GROQ_MODEL || 'llama-3.1-8b-instant',
        cost: 'rate-limited',
        intent: classification?.intent,
        confidence: classification?.confidence,
      };
      let full = '';
      for await (const chunk of streamGroq(prompt, { systemPrompt })) {
        full += chunk;
        yield { type: 'text', content: chunk };
      }
      await recordAiUsage(options.phone, 'complex', estimatePromptTokens(prompt, systemPrompt) + Math.ceil(full.length / 4));
      return;
    } catch {
      /* fallback */
    }
  }

  try {
    const result = await queryUnifiedAI(prompt, {
      ...options,
      systemPrompt,
      skipMemory: true,
      provider: simple ? 'smollm2' : 'auto',
    });
    yield {
      type: 'metadata',
      provider: result.provider,
      model: result.model,
      cost: result.cost,
      intent: result.intent,
      confidence: result.confidence,
    };
    if (result.thought) yield { type: 'thought', thought: result.thought };
    yield { type: 'text', content: result.text };
  } catch {
    const result = fallback(classification);
    yield {
      type: 'metadata',
      provider: result.provider,
      model: result.model,
      cost: result.cost,
      intent: result.intent,
      confidence: result.confidence,
    };
    yield { type: 'text', content: result.text };
  }
}

import { queryGemini } from './geminiService.js';
import { querySmolLM2 } from './smolLm2Service.js';
import { queryGroq, streamGroq } from './groqService.js';
import { classifyWithFastText, type FastTextResult } from './fastTextService.js';
import { withMemoryContext, logAiAudit } from './livingMemoryEngine.js';

export type AIProvider = 'auto' | 'gemini' | 'smollm2' | 'groq' | 'local_intent';
export interface UnifiedAIOptions {
  provider?: AIProvider;
  systemPrompt?: string;
  temperature?: number;
  phone?: string;
  threadId?: string;
  /** Skip living-memory enrichment (e.g. internal tools). */
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

function fallback(intent?: FastTextResult | null): AIResponse {
  const label = intent?.intent || 'general_question';
  const text =
    label === 'ride_request'
      ? 'I can arrange a ride. Tell me your destination and whether you want an Okada, Keke, or Taxi.'
      : label === 'order_food'
        ? 'I can help with food. Tell me what you want and your area.'
        : label === 'find_worker'
          ? 'I can find a verified worker. Tell me the job and your location.'
          : 'I’m ready. Tell me what you need, what you can offer, or what you want to get done.';
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

  // Deterministic action intents: no LLM / no memory cost
  if (preferred === 'auto' && classification && ACTION_INTENTS.has(classification.intent)) {
    return fallback(classification);
  }

  const route =
    preferred === 'gemini'
      ? 'gemini'
      : preferred === 'groq'
        ? 'groq'
        : preferred === 'smollm2'
          ? 'smollm2'
          : classification && SIMPLE_INTENTS.has(classification.intent)
            ? 'smollm2'
            : 'groq';

  const { systemPrompt, memoryTokens } = await resolveSystemPrompt(prompt, options, classification, route);

  if (preferred === 'gemini') {
    try {
      const result = cleanThinking(await queryGemini(prompt, { systemInstruction: systemPrompt }));
      return {
        provider: 'Gemini',
        model: 'configured-gemini',
        text: result.text,
        thought: result.thought,
        latencyMs: Date.now() - started,
        cost: 'configured',
        intent: classification?.intent,
        confidence: classification?.confidence,
        memoryTokens,
      };
    } catch {
      return fallback(classification);
    }
  }

  if (preferred === 'groq') {
    try {
      const result = cleanThinking(await queryGroq(prompt, { systemPrompt }));
      return {
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
    } catch {
      return fallback(classification);
    }
  }

  if (preferred === 'smollm2') {
    try {
      const result = cleanThinking(await querySmolLM2(prompt, systemPrompt));
      return {
        provider: 'SmolLM2',
        model: 'SmolLM2-1.7B-Instruct',
        text: result.text,
        thought: result.thought,
        latencyMs: Date.now() - started,
        cost: 'low',
        intent: classification?.intent,
        confidence: classification?.confidence,
        memoryTokens,
      };
    } catch {
      return fallback(classification);
    }
  }

  // auto path
  if (!classification || SIMPLE_INTENTS.has(classification.intent)) {
    const key = cacheKey(prompt, systemPrompt);
    const cached = simpleCache.get(key);
    if (cached && cached.expires > Date.now()) {
      return { ...cached.value, latencyMs: Date.now() - started, memoryTokens };
    }
    try {
      const result = cleanThinking(await querySmolLM2(prompt, systemPrompt));
      const response: AIResponse = {
        provider: 'SmolLM2',
        model: 'SmolLM2-1.7B-Instruct',
        text: result.text,
        thought: result.thought,
        latencyMs: Date.now() - started,
        cost: 'low',
        intent: classification?.intent,
        confidence: classification?.confidence,
        memoryTokens,
      };
      cacheSet(key, response);
      return response;
    } catch {
      /* continue to paid fallback */
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
      return response;
    } catch {
      /* template fallback */
    }
  }

  return fallback(classification);
}

export async function* streamUnifiedAI(
  prompt: string,
  options: UnifiedAIOptions = {}
): AsyncGenerator<AIStreamChunk> {
  const classification = classifyWithFastText(prompt);

  if (classification && ACTION_INTENTS.has(classification.intent)) {
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
    return;
  }

  const simple = !classification || SIMPLE_INTENTS.has(classification.intent);
  const route = options.provider === 'groq' || (!simple && options.provider !== 'smollm2' && process.env.GROQ_API_KEY)
    ? 'groq'
    : 'smollm2';

  const { systemPrompt } = await resolveSystemPrompt(prompt, options, classification, route);

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
      for await (const chunk of streamGroq(prompt, { systemPrompt })) {
        yield { type: 'text', content: chunk };
      }
      return;
    } catch {
      /* fallback below */
    }
  }

  try {
    const result = await queryUnifiedAI(prompt, {
      ...options,
      systemPrompt,
      skipMemory: true, // already resolved above
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

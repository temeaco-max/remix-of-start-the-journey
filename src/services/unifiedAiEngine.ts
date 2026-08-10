import { querySmolLM2 } from './smolLm2Service.js';
import { queryGroq } from './groqService.js';
import { classifyWithFastText, type FastTextResult } from './fastTextService.js';

export type AIProvider = 'auto' | 'gemini' | 'smollm2' | 'groq' | 'local_intent';

export interface UnifiedAIOptions {
    provider?: AIProvider;
    systemPrompt?: string;
    temperature?: number;
    phone?: string;
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
    'general_question', 'check_balance', 'balance', 'price_check', 'help', 'weather',
    'faq', 'greeting', 'general', 'unknown'
]);

const ACTION_INTENTS = new Set([
    'ride_request', 'order_food', 'find_worker', 'universal_vendor_order', 'sports_matchmaking',
    'event_coverage', 'how_to_video', 'security_booking', 'emergency', 'circle_create'
]);

function cleanThinking(text: string): { text: string; thought?: string } {
    const match = text?.match(/<think>([\s\S]*?)<\/think>/i);
    if (!match) return { text: text || '' };
    return { text: text.replace(/<think>[\s\S]*?<\/think>/i, '').trim(), thought: match[1].trim() };
}

function fallback(query: string, intent?: FastTextResult | null): AIResponse {
    const label = intent?.intent || 'general_question';
    const text = label === 'ride_request'
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
        confidence: intent?.confidence
    };
}

export async function queryUnifiedAI(prompt: string, options: UnifiedAIOptions = {}): Promise<AIResponse> {
    const started = Date.now();
    const preferred = options.provider || 'auto';
    const classification = classifyWithFastText(prompt);

    if (preferred === 'local_intent') {
        return {
            provider: 'FastText', model: 'kurukoo_intent',
            text: classification ? `Intent: ${classification.intent} (${Math.round(classification.confidence * 100)}%)` : 'Intent: general_question',
            latencyMs: Date.now() - started, cost: '$0.00',
            intent: classification?.intent || 'general_question', confidence: classification?.confidence
        };
    }

    if (preferred === 'groq') {
        try {
            const result = cleanThinking(await queryGroq(prompt, { systemPrompt: options.systemPrompt }));
            return { provider: 'Groq', model: 'llama-3.1-8b-instant', text: result.text, thought: result.thought, latencyMs: Date.now() - started, cost: 'rate-limited', intent: classification?.intent, confidence: classification?.confidence };
        } catch (err) {
            console.warn('[AI] Groq failed:', err);
            return fallback(prompt, classification);
        }
    }

    if (preferred === 'smollm2') {
        try {
            const result = cleanThinking(await querySmolLM2(prompt, options.systemPrompt));
            return { provider: 'SmolLM2', model: 'SmolLM2-1.7B-Instruct', text: result.text, thought: result.thought, latencyMs: Date.now() - started, cost: 'low', intent: classification?.intent, confidence: classification?.confidence };
        } catch (err) {
            console.warn('[AI] SmolLM2 failed:', err);
            return fallback(prompt, classification);
        }
    }

    // Auto: FastText is always first. Actions go to the skill engine before generation.
    // This function is only for natural-language generation after the action layer.
    if (classification && ACTION_INTENTS.has(classification.intent)) {
        return fallback(prompt, classification);
    }

    if (!classification || SIMPLE_INTENTS.has(classification.intent)) {
        try {
            const result = cleanThinking(await querySmolLM2(prompt, options.systemPrompt));
            return { provider: 'SmolLM2', model: 'SmolLM2-1.7B-Instruct', text: result.text, thought: result.thought, latencyMs: Date.now() - started, cost: 'low', intent: classification?.intent, confidence: classification?.confidence };
        } catch (err) {
            console.warn('[AI] Simple-query SmolLM2 failed:', err);
        }
    }

    if (process.env.GROQ_API_KEY) {
        try {
            const result = cleanThinking(await queryGroq(prompt, { systemPrompt: options.systemPrompt }));
            return { provider: 'Groq', model: 'llama-3.1-8b-instant', text: result.text, thought: result.thought, latencyMs: Date.now() - started, cost: 'rate-limited', intent: classification?.intent, confidence: classification?.confidence };
        } catch (err) {
            console.warn('[AI] Complex-query Groq failed:', err);
        }
    }

    return fallback(prompt, classification);
}

export async function* streamUnifiedAI(prompt: string, options: UnifiedAIOptions = {}): AsyncGenerator<AIStreamChunk> {
    const result = await queryUnifiedAI(prompt, options);
    yield {
        type: 'metadata', provider: result.provider, model: result.model,
        cost: result.cost, intent: result.intent, confidence: result.confidence
    };

    // Never expose private chain-of-thought. A short status is safe for the UI.
    if (result.thought) {
        yield { type: 'thought', thought: 'Reasoning completed.' };
    }

    // Character-level chunks provide the same streaming feel across all providers,
    // including local models whose runtime API returns a completed string.
    const text = result.text || '';
    for (let i = 0; i < text.length; i += 8) {
        yield { type: 'text', content: text.slice(i, i + 8) };
        await new Promise(resolve => setTimeout(resolve, 8));
    }
}

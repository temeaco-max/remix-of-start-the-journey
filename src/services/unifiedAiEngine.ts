import { queryGemini } from './geminiService.js';
import { querySmolLM2 } from './smolLm2Service.js';
import { queryGroq } from './groqService.js';
import { classifyWithFastText } from './fastTextService.js';

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
    latencyMs: number;
    cost: string;
}

/**
 * Universal Free-Tier AI Inference Engine for Kurukoo.
 * Supports:
 *  1. Google Gemini 3.6 Flash / 3.1 Flash-Lite (Google AI Studio Free Tier)
 *  2. SmolLM2-1.7B-Instruct (Hugging Face Free Serverless)
 *  3. Groq Llama 3.1 8B Instant (Groq Free Tier)
 *  4. In-Memory TF-IDF / Semantic Intent Router (100% Offline / Zero-Cost)
 */
export async function queryUnifiedAI(prompt: string, options?: UnifiedAIOptions): Promise<AIResponse> {
    const startTime = Date.now();
    const preferred = options?.provider || 'auto';

    // 1. Explicit Gemini Selection
    if (preferred === 'gemini') {
        const text = await queryGemini(prompt, { systemInstruction: options?.systemPrompt });
        return {
            provider: 'Google Gemini',
            model: 'gemini-3.6-flash',
            text,
            latencyMs: Date.now() - startTime,
            cost: 'Free Tier ($0.00)'
        };
    }

    // 2. Explicit SmolLM2 Selection
    if (preferred === 'smollm2') {
        const text = await querySmolLM2(prompt, options?.systemPrompt);
        return {
            provider: 'HuggingFace SmolLM2',
            model: 'SmolLM2-1.7B-Instruct',
            text,
            latencyMs: Date.now() - startTime,
            cost: 'Free Serverless ($0.00)'
        };
    }

    // 3. Explicit Groq Selection
    if (preferred === 'groq') {
        const text = await queryGroq(prompt);
        return {
            provider: 'Groq Cloud',
            model: 'llama-3.1-8b-instant',
            text,
            latencyMs: Date.now() - startTime,
            cost: 'Free Tier ($0.00)'
        };
    }

    // 4. Explicit Local Fast-Intent
    if (preferred === 'local_intent') {
        const match = classifyWithFastText(prompt);
        const text = match 
            ? `⚡ [In-Memory Fast Intent]: Recognized intent "${match.intent}" with ${(match.confidence * 100).toFixed(0)}% confidence.`
            : `⚡ [In-Memory Fast Intent]: General query acknowledged: "${prompt}".`;
        return {
            provider: 'Local In-Memory Semantic Engine',
            model: 'TF-IDF-Vector-Classifier',
            text,
            latencyMs: Date.now() - startTime,
            cost: '$0.00 (Zero Latency)'
        };
    }

    // AUTO Mode: Resilient multi-tier fallback cascade (Gemini -> SmolLM2 -> Groq -> In-Memory)
    try {
        if (process.env.GEMINI_API_KEY || process.env.API_KEY) {
            const text = await queryGemini(prompt, { systemInstruction: options?.systemPrompt });
            if (text && !text.includes('processed your request')) {
                return {
                    provider: 'Google Gemini',
                    model: 'gemini-3.6-flash',
                    text,
                    latencyMs: Date.now() - startTime,
                    cost: 'Free Tier ($0.00)'
                };
            }
        }
    } catch (e) {
        console.warn('Auto mode Gemini attempt failed, cascading to SmolLM2...');
    }

    try {
        const text = await querySmolLM2(prompt, options?.systemPrompt);
        if (text && !text.startsWith('🤖 [SmolLM2-1.7B-Instruct]: I received your request')) {
            return {
                provider: 'HuggingFace SmolLM2',
                model: 'SmolLM2-1.7B-Instruct',
                text,
                latencyMs: Date.now() - startTime,
                cost: 'Free Serverless ($0.00)'
            };
        }
    } catch (e) {
        console.warn('Auto mode SmolLM2 attempt failed, cascading to Groq...');
    }

    if (process.env.GROQ_API_KEY) {
        try {
            const text = await queryGroq(prompt);
            return {
                provider: 'Groq Cloud',
                model: 'llama-3.1-8b-instant',
                text,
                latencyMs: Date.now() - startTime,
                cost: 'Free Tier ($0.00)'
            };
        } catch (e) {
            console.warn('Auto mode Groq attempt failed, cascading to local intent classifier...');
        }
    }

    // Ultimate Zero-Cost In-Memory Fallback
    const localMatch = classifyWithFastText(prompt);
    const fallbackText = localMatch
        ? `⚡ [Kurukoo Intelligence]: I identified your intent as *${localMatch.intent}* (Confidence: ${(localMatch.confidence * 100).toFixed(0)}%). How can I help fulfill this for you today?`
        : `⚡ *Kurukoo AI Assistant:* I received your request: "${prompt}". Ready to help with live rides, price checks, trade deals, and life-admin reminders!`;

    return {
        provider: 'Local In-Memory Semantic Engine',
        model: 'TF-IDF-Vector-Classifier',
        text: fallbackText,
        latencyMs: Date.now() - startTime,
        cost: '$0.00'
    };
}

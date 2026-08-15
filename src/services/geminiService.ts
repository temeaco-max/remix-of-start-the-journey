import { GoogleGenAI } from '@google/genai';

let genAIInstance: GoogleGenAI | null = null;

export class GeminiProviderError extends Error {
    readonly code: 'GEMINI_NOT_CONFIGURED' | 'GEMINI_REQUEST_FAILED' | 'GEMINI_EMPTY_RESPONSE';

    constructor(code: GeminiProviderError['code'], message: string, options?: { cause?: unknown }) {
        super(message, options);
        this.name = 'GeminiProviderError';
        this.code = code;
    }
}

function configuredApiKey(): string {
    const apiKey = String(process.env.GEMINI_API_KEY || process.env.API_KEY || '').trim();
    if (!apiKey) throw new GeminiProviderError('GEMINI_NOT_CONFIGURED', 'Gemini is not configured for this deployment.');
    return apiKey;
}

export function getGenAIClient(): GoogleGenAI {
    if (!genAIInstance) genAIInstance = new GoogleGenAI({ apiKey: configuredApiKey() });
    return genAIInstance;
}

export interface GeminiChatOptions {
    systemInstruction?: string;
    temperature?: number;
    maxOutputTokens?: number;
    responseMimeType?: string;
}

export async function queryGemini(prompt: string, options?: GeminiChatOptions): Promise<string> {
    if (!String(prompt || '').trim()) throw new GeminiProviderError('GEMINI_REQUEST_FAILED', 'Gemini requires a non-empty prompt.');
    try {
        const response = await getGenAIClient().models.generateContent({
            model: process.env.GEMINI_MODEL || 'gemini-2.5-flash',
            contents: prompt,
            config: {
                systemInstruction: options?.systemInstruction || 'You are Kurukoo, a concise and evidence-based everyday utility assistant. Never claim an external action, payment, dispatch, delivery, booking, or provider connection without authoritative confirmation.',
                temperature: options?.temperature ?? 0.7,
                maxOutputTokens: options?.maxOutputTokens ?? 512,
                responseMimeType: options?.responseMimeType,
            },
        });
        const text = response?.text?.trim();
        if (!text) throw new GeminiProviderError('GEMINI_EMPTY_RESPONSE', 'Gemini returned no usable response.');
        return text;
    } catch (error) {
        if (error instanceof GeminiProviderError) throw error;
        throw new GeminiProviderError('GEMINI_REQUEST_FAILED', 'Gemini request failed; no synthetic fallback response was generated.', { cause: error });
    }
}

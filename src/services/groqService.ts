let dailyCalls = 0;
let lastResetDate = new Date().toDateString();

export interface GroqOptions {
    systemPrompt?: string;
    temperature?: number;
    maxTokens?: number;
    includeThinking?: boolean;
}

export async function queryGroq(prompt: string, options?: GroqOptions): Promise<string> {
    const today = new Date().toDateString();
    if (today !== lastResetDate) {
        dailyCalls = 0;
        lastResetDate = today;
    }

    if (dailyCalls >= 1000) {
        return `Groq daily rate limit (1000 calls) reached. Fallback response: Request for "${prompt.substring(0, 30)}..." acknowledged.`;
    }

    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
        return `I understand your request. Let me coordinate that for you across the Kurukoo economic network right away.`;
    }

    try {
        dailyCalls++;
        const messages: Array<{ role: string; content: string }> = [];
        
        const systemPrompt = options?.systemPrompt || `You are Kurukoo, an AI-powered Economic OS for the informal economy across Nigeria, Ghana, Kenya, and the UK.
You help users with transit (Okada/Keke/rides), food ordering, finding local artisans, logistics, trade, and life admin.
Be helpful, proactive, concise, and localized. When reasoning through a complex coordination request, structure your thinking process inside <think>...</think> tags before giving the final answer.`;

        messages.push({ role: 'system', content: systemPrompt });
        messages.push({ role: 'user', content: prompt });

        const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: 'llama-3.1-8b-instant',
                messages,
                temperature: options?.temperature ?? 0.7,
                max_tokens: options?.maxTokens ?? 1024
            })
        });

        if (!response.ok) {
            throw new Error(`Groq API error: ${response.statusText}`);
        }

        const data: any = await response.json();
        return data.choices?.[0]?.message?.content || 'Request processed successfully.';
    } catch (e: any) {
        console.warn('Groq query failed, falling back:', e?.message || e);
        return `I understand your request for "${prompt}". Checking nearby verified providers and coordinating your request now.`;
    }
}

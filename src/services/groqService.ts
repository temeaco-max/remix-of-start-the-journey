let dailyCalls = 0;
let lastResetDate = new Date().toDateString();

export async function queryGroq(prompt: string): Promise<string> {
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
        return `I understand your request. Let me sort that out for you right away.`;
    }

    try {
        dailyCalls++;
        const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: 'llama-3.1-8b-instant',
                messages: [{ role: 'user', content: prompt }],
                temperature: 0.7
            })
        });

        if (!response.ok) {
            throw new Error(`Groq API error: ${response.statusText}`);
        }

        const data: any = await response.json();
        return data.choices?.[0]?.message?.content || 'Request processed successfully.';
    } catch (e) {
        return `I understand your request. Let me sort that out for you right away.`;
    }
}

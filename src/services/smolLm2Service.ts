import { pipeline, type TextGenerationPipeline } from '@huggingface/transformers';
import { HfInference } from '@huggingface/inference';

const MODEL_NAME = 'HuggingFaceTB/SmolLM2-1.7B-Instruct';
let localPipeline: TextGenerationPipeline | null = null;
let localPipelinePromise: Promise<TextGenerationPipeline> | null = null;
let hfClient: HfInference | null = null;

async function getLocalPipeline(): Promise<TextGenerationPipeline> {
    if (localPipeline) return localPipeline;
    if (!localPipelinePromise) {
        localPipelinePromise = pipeline('text-generation', MODEL_NAME) as Promise<TextGenerationPipeline>;
    }
    localPipeline = await localPipelinePromise;
    return localPipeline;
}

function getHfClient(): HfInference {
    if (!hfClient) {
        hfClient = new HfInference(process.env.HUGGINGFACE_API_KEY || process.env.HF_API_KEY || '');
    }
    return hfClient;
}

function buildPrompt(prompt: string, systemPrompt?: string): string {
    const system = systemPrompt || 'You are Kurukoo, a concise economic coordination assistant. Answer clearly and never invent transactions or provider availability.';
    return `<|im_start|>system\n${system}<|im_end|>\n<|im_start|>user\n${prompt}<|im_end|>\n<|im_start|>assistant\n`;
}

export async function querySmolLM2(prompt: string, systemPrompt?: string): Promise<string> {
    const input = buildPrompt(prompt, systemPrompt);

    // Local Transformers.js is the primary simple-query path. It can be disabled
    // in memory-constrained deployments with KURUKOO_SMOLLM2_LOCAL=false.
    if (process.env.KURUKOO_SMOLLM2_LOCAL !== 'false') {
        try {
            const generator = await getLocalPipeline();
            const output = await generator(input, {
                max_new_tokens: 256,
                temperature: 0.3,
                do_sample: true,
                return_full_text: false
            });
            const first = Array.isArray(output) ? output[0] : output;
            const text = typeof first === 'object' && first && 'generated_text' in first
                ? String((first as any).generated_text || '').trim()
                : '';
            if (text) return text.replace(/<\|im_end\|>[\s\S]*$/g, '').trim();
        } catch (err: any) {
            console.warn('[SmolLM2] Local Transformers.js inference failed:', err?.message || err);
        }
    }

    // Serverless HF remains a useful fallback for hosts that cannot run the 1.7B model.
    if (process.env.HUGGINGFACE_API_KEY || process.env.HF_API_KEY) {
        try {
            const response = await getHfClient().textGeneration({
                model: MODEL_NAME,
                inputs: input,
                parameters: {
                    max_new_tokens: 256,
                    temperature: 0.3,
                    return_full_text: false
                }
            });
            if (response?.generated_text) return response.generated_text.trim();
        } catch (err: any) {
            console.warn('[SmolLM2] HF serverless inference failed:', err?.message || err);
        }
    }

    return getFallbackResponse(prompt);
}

function getFallbackResponse(prompt: string): string {
    const q = prompt.toLowerCase();
    if (q.includes('price') || q.includes('cost')) return 'I can help check a market price. Tell me the item and your area.';
    if (q.includes('weather')) return 'Tell me your city and I can route a weather request for you.';
    if (q.includes('help') || q.includes('support')) return 'I can help with a service request, payment, dispute, profile, or earning opportunity.';
    return 'I can help you find services, coordinate work, manage requests, and answer everyday questions. What would you like to do?';
}

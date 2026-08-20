import type { AIProvider } from './unifiedAiEngine.js';

export type InferenceTask = 'conversation' | 'support' | 'skill_intake' | 'planning' | 'agent_execution' | 'high_stakes' | 'presentation';

export interface InferenceDecision {
  provider: AIProvider;
  reason: string;
  maxComplexity: 'low' | 'medium' | 'high';
}

function configuredMistral(): boolean {
  return Boolean(process.env.MISTRAL_API_KEY && String(process.env.KURUKOO_AI_PRIMARY_PROVIDER || process.env.KURUKOO_AI_HOSTED_PROVIDER || 'mistral').toLowerCase() === 'mistral');
}

export function chooseInferenceProvider(input: { task: InferenceTask; prompt: string; preferred?: AIProvider }): InferenceDecision {
  if (input.preferred && input.preferred !== 'auto') return { provider: input.preferred, reason: 'caller preference', maxComplexity: 'high' };
  const text = input.prompt.trim().toLowerCase();
  const highSignals = ['negotiate', 'compare', 'plan', 'coordinate', 'arrange', 'multi-step', 'same day', 'same-day', 'refund', 'dispute', 'contract', 'medical', 'legal', 'safety'];
  const lowSignals = ['hello', 'hi', 'hey', 'thanks', 'thank you', 'how do i', 'how to', 'what is', 'where is', 'good morning', 'good afternoon', 'good evening'];
  if (input.task === 'high_stakes' || input.task === 'planning' || input.task === 'agent_execution') {
    return configuredMistral() ? { provider: 'mistral', reason: 'higher-reasoning or higher-authority task', maxComplexity: 'high' } : { provider: 'smollm2', reason: 'no hosted high-reasoning provider configured; use bounded local inference', maxComplexity: 'medium' };
  }
  if (lowSignals.some(signal => text === signal || text.startsWith(`${signal} `)) && input.task !== 'high_stakes') return { provider: 'smollm2', reason: 'low-complexity conversational/support turn', maxComplexity: 'low' };
  if (highSignals.some(signal => text.includes(signal)) && configuredMistral()) return { provider: 'mistral', reason: 'complexity signal detected', maxComplexity: 'high' };
  return { provider: 'smollm2', reason: 'default to low-cost inference; canonical tools remain authoritative', maxComplexity: 'medium' };
}

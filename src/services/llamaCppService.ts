/* Copyright (c) 2026 temeaco-max. All rights reserved. Proprietary and confidential. */
/**
 * Llama 3.2 1B (or any GGUF model) through llama.cpp's OpenAI-compatible
 * server. This is a COMPLETELY SEPARATE runtime from onnxruntime-node
 * (which crashes on this macOS build); llama.cpp runs as its own process
 * and cannot affect the SmolLM2 local pipeline or any hosted provider.
 *
 * Enabled only when KURUKOO_LLAMACPP_LOCAL === 'true'.
 */

export type LlamaCppExecutionMode = 'llamacpp_local' | 'unavailable';

let lastMode: LlamaCppExecutionMode = 'unavailable';
let lastLatencyMs: number | null = null;
let lastModel = 'llama-3.2-1b';

function getServerBase(): string {
  return String(process.env.LLAMACPP_API_BASE || 'http://localhost:8081/v1').replace(/\/$/, '');
}

function getModelName(): string {
  return String(process.env.LLAMACPP_MODEL || 'Llama-3.2-1B-Instruct-Q4_K_M.gguf').trim();
}

function getTimeoutMs(): number {
  return Math.max(10_000, Number(process.env.LLAMACPP_TIMEOUT_MS || 120_000));
}

function isEnabled(): boolean {
  return process.env.KURUKOO_LLAMACPP_LOCAL === 'true';
}

export function getLlamaCppRuntimeStatus(): {
  enabled: boolean;
  available: boolean;
  model: string;
  base: string;
  executionMode: LlamaCppExecutionMode;
  latencyMs: number | null;
} {
  return {
    enabled: isEnabled(),
    available: lastMode === 'llamacpp_local',
    model: lastMode === 'llamacpp_local' ? lastModel : getModelName(),
    base: getServerBase(),
    executionMode: lastMode,
    latencyMs: lastLatencyMs,
  };
}

/**
 * Pings the llama.cpp server. Never throws; a missing server simply reports
 * unavailable so the caller can escalate to the next sufficient path.
 */
export async function probeLlamaCppServer(): Promise<boolean> {
  if (!isEnabled()) return false;
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 3_000);
    const response = await fetch(`${getServerBase()}/models`, { signal: controller.signal });
    clearTimeout(timeout);
    return response.ok;
  } catch {
    return false;
  }
}

export async function queryLlamaCpp(prompt: string, systemPrompt?: string): Promise<string> {
  const startedAt = Date.now();
  if (!isEnabled()) {
    lastMode = 'unavailable';
    throw new Error('llama.cpp local runtime is not enabled.');
  }
  const messages = [
    ...(systemPrompt ? [{ role: 'system', content: systemPrompt }] : []),
    { role: 'user', content: prompt },
  ];
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), getTimeoutMs());
  try {
    const response = await fetch(`${getServerBase()}/chat/completions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      signal: controller.signal,
      body: JSON.stringify({
        model: getModelName(),
        messages,
        temperature: Number(process.env.LLAMACPP_TEMPERATURE || 0.3),
        max_tokens: Math.max(16, Number(process.env.LLAMACPP_MAX_NEW_TOKENS || 160)),
      }),
    });
    if (!response.ok) throw new Error(`llama.cpp server returned HTTP ${response.status}.`);
    const payload = (await response.json()) as { choices?: Array<{ message?: { content?: string } }> };
    const text = String(payload?.choices?.[0]?.message?.content || '').trim();
    if (!text) throw new Error('llama.cpp server returned no usable content.');
    lastMode = 'llamacpp_local';
    lastLatencyMs = Date.now() - startedAt;
    return text;
  } catch (error) {
    lastMode = 'unavailable';
    throw error instanceof Error ? error : new Error(String(error));
  } finally {
    clearTimeout(timeout);
  }
}
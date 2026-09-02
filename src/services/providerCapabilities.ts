/* Copyright (c) 2026 temeaco-max. All rights reserved. Proprietary and confidential. */
export type ProviderName = 'local' | 'fasttext' | 'gemini' | 'mistral' | 'groq' | 'openrouter' | 'poolside';
export type ProviderCapability = 'text' | 'transcription' | 'tts' | 'live' | 'vision' | 'moderation';
export type ProviderLimitStatus = 'configured' | 'unknown' | 'unavailable';

export interface ProviderCapabilityStatus {
  configured: boolean;
  available: boolean;
  provider: ProviderName;
  capability: ProviderCapability;
  model?: string;
  limits: { status: ProviderLimitStatus; requestsRemaining?: number; tokensRemaining?: number; note: string };
  note: string;
}
export interface ProviderReadiness { provider: ProviderName; configured: boolean; available: boolean; capabilities: ProviderCapabilityStatus[]; failover: 'none' | 'canonical-local' | 'canonical-template'; }
export type HostedAIProvider = 'gemini' | 'mistral' | 'groq' | 'openrouter' | 'poolside' | 'none';
export function hasConfiguredSecret(value: unknown): boolean { const text=String(value??'').trim().toLowerCase(); return Boolean(text)&&!['stub','unconfigured'].includes(text)&&!text.startsWith('change_me'); }
/** Resolve one explicitly preferred hosted provider when configured; otherwise use the canonical hosted escalation order. */
export function resolveHostedAIProvider(preferred?: string | null): HostedAIProvider {
  const explicit=String(preferred||'').trim().toLowerCase();
  const candidates: HostedAIProvider[] = ['mistral', 'groq', 'gemini', 'openrouter', 'poolside'];
  const configured = (provider: HostedAIProvider): boolean => {
    if (provider === 'mistral') return hasConfiguredSecret(process.env.MISTRAL_API_KEY);
    if (provider === 'groq') return hasConfiguredSecret(process.env.GROQ_API_KEY);
    if (provider === 'gemini') return hasConfiguredSecret(process.env.GEMINI_API_KEY || process.env.API_KEY);
    if (provider === 'openrouter') return hasConfiguredSecret(process.env.OPENROUTER_API_KEY) && Boolean(String(process.env.OPENROUTER_MODEL || '').trim());
    if (provider === 'poolside') return hasConfiguredSecret(process.env.POOLSIDE_API_KEY);
    return false;
  };
  if (candidates.includes(explicit as HostedAIProvider) && configured(explicit as HostedAIProvider)) return explicit as HostedAIProvider;
  return candidates.find(configured) || 'none';
}
export function unknownLimits(note: string): ProviderCapabilityStatus['limits'] { return { status:'unknown', note }; }
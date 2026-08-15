export type ProviderName = 'local' | 'fasttext' | 'gemini' | 'mistral' | 'groq';
export type ProviderCapability = 'text' | 'transcription' | 'tts' | 'live' | 'vision' | 'moderation';
export type ProviderLimitStatus = 'configured' | 'unknown' | 'unavailable';

export interface ProviderCapabilityStatus {
  configured: boolean;
  available: boolean;
  provider: ProviderName;
  capability: ProviderCapability;
  model?: string;
  limits: {
    status: ProviderLimitStatus;
    requestsRemaining?: number;
    tokensRemaining?: number;
    note: string;
  };
  note: string;
}

export interface ProviderReadiness {
  provider: ProviderName;
  configured: boolean;
  available: boolean;
  capabilities: ProviderCapabilityStatus[];
  failover: 'none' | 'canonical-local' | 'canonical-template';
}

export function hasConfiguredSecret(value: unknown): boolean {
  const text = String(value ?? '').trim().toLowerCase();
  return Boolean(text) && !['stub', 'unconfigured'].includes(text) && !text.startsWith('change_me');
}

export function unknownLimits(note: string): ProviderCapabilityStatus['limits'] {
  return { status: 'unknown', note };
}

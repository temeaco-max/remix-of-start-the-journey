/* Copyright (c) 2026 temeaco-max. All rights reserved. Proprietary and confidential. */
export type ConfigSensitivity = 'public_config' | 'secret' | 'credential' | 'webhook_secret' | 'internal';

export interface AdminConfigDefinition {
  key: string;
  subsystem: string;
  sensitivity: ConfigSensitivity;
  required: boolean;
  description: string;
  dependentFeatures: string[];
}

export const ADMIN_CONFIG_DEFINITIONS: readonly AdminConfigDefinition[] = [
  { key: 'KURUKOO_PUBLIC_BASE_URL', subsystem: 'Web/PWA/Deep links', sensitivity: 'public_config', required: true, description: 'Canonical HTTPS origin for links, auth and native app-link configuration.', dependentFeatures: ['auth', 'magic links', 'PWA', 'iOS Universal Links', 'Android App Links'] },
  { key: 'JWT_SECRET', subsystem: 'Authentication', sensitivity: 'secret', required: true, description: 'Server signing secret; never display its value.', dependentFeatures: ['sessions', 'admin auth'] },
  { key: 'ADMIN_USERNAME', subsystem: 'Admin', sensitivity: 'credential', required: true, description: 'Admin login identifier.', dependentFeatures: ['Control Room'] },
  { key: 'ADMIN_PASSWORD', subsystem: 'Admin', sensitivity: 'credential', required: true, description: 'Admin login credential; never display its value.', dependentFeatures: ['Control Room'] },
  { key: 'STRIPE_WEBHOOK_SECRET', subsystem: 'Payments', sensitivity: 'webhook_secret', required: false, description: 'Stripe webhook verification boundary.', dependentFeatures: ['payments', 'subscriptions'] },
  { key: 'ECONOMIC_PAYMENT_ADAPTER', subsystem: 'Economic', sensitivity: 'internal', required: false, description: 'Selects the payment adapter and its readiness path.', dependentFeatures: ['checkout', 'payments', 'escrow'] },
  { key: 'MQTT_BROKER', subsystem: 'Realtime', sensitivity: 'credential', required: false, description: 'Realtime broker configuration for approved physical/network flows.', dependentFeatures: ['physical network', 'device connectivity'] },
  { key: 'HF_API_KEY', subsystem: 'AI', sensitivity: 'secret', required: false, description: 'Hugging Face provider credential.', dependentFeatures: ['AI fallback'] },
  { key: 'GROQ_MODEL', subsystem: 'AI', sensitivity: 'public_config', required: false, description: 'Configured Groq model name.', dependentFeatures: ['AI fallback'] },
  { key: 'GROQ_MAX_CONCURRENT', subsystem: 'AI', sensitivity: 'internal', required: false, description: 'AI concurrency budget.', dependentFeatures: ['AI fallback'] },
  { key: 'QR_CONTEXT_SECRET', subsystem: 'QR', sensitivity: 'secret', required: false, description: 'QR context signing/validation secret.', dependentFeatures: ['QR contextual entry'] },
  { key: 'KURUKOO_MCP_ENABLED', subsystem: 'MCP', sensitivity: 'internal', required: false, description: 'MCP activation flag.', dependentFeatures: ['MCP'] },
  { key: 'KURUKOO_MCP_ISSUER', subsystem: 'MCP', sensitivity: 'public_config', required: false, description: 'MCP OAuth issuer origin.', dependentFeatures: ['MCP OAuth'] },
  { key: 'KURUKOO_MCP_CLIENT_ID', subsystem: 'MCP', sensitivity: 'credential', required: false, description: 'MCP OAuth client identifier.', dependentFeatures: ['MCP OAuth'] },
  { key: 'KURUKOO_MCP_OAUTH_SECRET', subsystem: 'MCP', sensitivity: 'secret', required: false, description: 'MCP OAuth signing secret.', dependentFeatures: ['MCP OAuth'] },
];

export function getAdminConfigDefinitions() {
  return ADMIN_CONFIG_DEFINITIONS.map(definition => ({ ...definition, dependentFeatures: [...definition.dependentFeatures] }));
}

export function getAdminConfigStatus(env: NodeJS.ProcessEnv = process.env) {
  return ADMIN_CONFIG_DEFINITIONS.map(definition => ({
    ...definition,
    configured: String(env[definition.key] || '').trim().length > 0,
    // Values are deliberately excluded. A fingerprint is not produced here to avoid encouraging the UI to expose secret-derived material.
    displayValue: definition.sensitivity === 'public_config' || definition.sensitivity === 'internal'
      ? String(env[definition.key] || '').trim() || null
      : null,
    safeValuePolicy: definition.sensitivity === 'public_config' || definition.sensitivity === 'internal' ? 'display_allowed_when_non-secret' : 'never_display_secret_value',
  }));
}

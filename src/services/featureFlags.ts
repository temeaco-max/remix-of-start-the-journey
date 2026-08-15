import fs from 'fs';
import path from 'path';

const FLAG_ENV_PREFIX = 'FF_';

export type FeatureLifecycle = 'experimental' | 'pilot' | 'production-capable' | 'deprecated';

export interface FeatureDefinition {
    description: string;
    lifecycle: FeatureLifecycle;
    defaultEnabled: boolean;
    markets?: string[];
    requires?: string[];
}

/**
 * Canonical feature registry.
 *
 * Feature flags are rollout controls, not a substitute for provider readiness.
 * A feature may be code-complete but remain disabled until its dependencies are configured.
 */
export const FEATURE_REGISTRY: Record<string, FeatureDefinition> = {
    ussd: { description: 'USSD channel', lifecycle: 'pilot', defaultEnabled: false, markets: ['ng'] },
    whatsapp: { description: 'WhatsApp channel', lifecycle: 'pilot', defaultEnabled: false, markets: ['ng', 'gb', 'ca'], requires: ['WHATSAPP_TOKEN', 'WHATSAPP_PHONE_NUMBER_ID', 'WHATSAPP_APP_SECRET'] },
    telegram: { description: 'Telegram channel', lifecycle: 'pilot', defaultEnabled: false, requires: ['TELEGRAM_BOT_TOKEN'] },
    sms: { description: 'SMS channel', lifecycle: 'pilot', defaultEnabled: false, requires: ['SMS_PROVIDER'] },
    voice: { description: 'Voice interaction', lifecycle: 'pilot', defaultEnabled: false },
    fcm: { description: 'External push delivery', lifecycle: 'pilot', defaultEnabled: false, requires: ['FIREBASE_ADMIN_CREDENTIALS'] },
    agent_runtime: { description: 'Bounded agent runtime', lifecycle: 'production-capable', defaultEnabled: false },
    autonomous_low_risk: { description: 'Low-risk autonomous execution within explicit user permissions', lifecycle: 'pilot', defaultEnabled: false, requires: ['agent_runtime'] },
    webrtc: { description: 'WebRTC realtime media', lifecycle: 'experimental', defaultEnabled: false, requires: ['STUN_TURN_OR_RELAY'] },
    iot_remote: { description: 'Authenticated IoT/MQTT remote control', lifecycle: 'experimental', defaultEnabled: false, requires: ['MQTT_BROKER_URL'] },
    stripe_payments: { description: 'Stripe payment collection', lifecycle: 'pilot', defaultEnabled: false, requires: ['STRIPE_SECRET_KEY', 'STRIPE_WEBHOOK_SECRET'] },
    mobile_money: { description: 'Mobile-money payment adapter', lifecycle: 'pilot', defaultEnabled: false },
    topics: { description: 'Public/shared Topic surface', lifecycle: 'production-capable', defaultEnabled: true },
    advertising: { description: 'Public advertising placements and campaign management', lifecycle: 'production-capable', defaultEnabled: true },
    contributor_tasks: { description: 'Contributor task and evidence workflow', lifecycle: 'production-capable', defaultEnabled: true },
    nearby_pulse: { description: 'Consent-based live presence and nearby discovery', lifecycle: 'pilot', defaultEnabled: false },
    private_number_masking: { description: 'Real routable private-number communication', lifecycle: 'pilot', defaultEnabled: false, requires: ['NUMBER_MASKING_PROVIDER'] },
    catalog_ordering: { description: 'Shared catalogue/product ordering flow', lifecycle: 'pilot', defaultEnabled: false },
};

function parseBoolean(value: string | undefined): boolean | undefined {
    if (value === undefined) return undefined;
    const normalized = value.trim().toLowerCase();
    if (['true', '1', 'yes', 'on'].includes(normalized)) return true;
    if (['false', '0', 'no', 'off'].includes(normalized)) return false;
    return undefined;
}

function localeCandidates(country: string): string[] {
    const normalized = String(country || 'ng').toLowerCase();
    const candidates = [normalized];
    if (normalized === 'gb' || normalized === 'uk') candidates.push('gb', 'en');
    else if (normalized === 'ng') candidates.push('ng', 'en');
    else candidates.push('en');
    return [...new Set(candidates)];
}

function hasRequirement(requirement: string): boolean {
    if (requirement === 'FIREBASE_ADMIN_CREDENTIALS') {
        return Boolean(process.env.FIREBASE_ADMIN_PRIVATE_KEY && process.env.FIREBASE_ADMIN_CLIENT_EMAIL);
    }
    if (requirement === 'STUN_TURN_OR_RELAY') {
        return Boolean(process.env.STUN_SERVERS || process.env.TURN_URL || process.env.TURN_SERVER_URL);
    }
    if (requirement === 'SMS_PROVIDER') {
        return Boolean(process.env.SMS_PROVIDER || process.env.SMS_API_KEY);
    }
    if (requirement === 'NUMBER_MASKING_PROVIDER') {
        return Boolean(process.env.NUMBER_MASKING_PROVIDER || process.env.TWILIO_ACCOUNT_SID || process.env.AFTERA_PROVIDER_KEY);
    }
    if (requirement === 'agent_runtime') return process.env.KURUKOO_AGENT_ENABLED === 'true';
    return Boolean(process.env[requirement]);
}

export function getFeatureDefinition(flagName: string): FeatureDefinition | undefined {
    return FEATURE_REGISTRY[flagName];
}

export function getFeatureFlagStatus(country: string, flagName: string): {
    enabled: boolean;
    lifecycle: FeatureLifecycle | 'unknown';
    configured: boolean;
    missingRequirements: string[];
} {
    const definition = FEATURE_REGISTRY[flagName];
    if (!definition) return { enabled: false, lifecycle: 'unknown', configured: false, missingRequirements: [] };

    const missingRequirements = (definition.requires || []).filter((requirement) => !hasRequirement(requirement));
    const configured = missingRequirements.length === 0;
    const enabled = getFeatureFlag(country, flagName) && configured;
    return { enabled, lifecycle: definition.lifecycle, configured, missingRequirements };
}

export function getFeatureFlag(country: string, flagName: string): boolean {
    const envValue = parseBoolean(process.env[`${FLAG_ENV_PREFIX}${flagName.toUpperCase()}`]);
    if (envValue !== undefined) {
        if (!envValue) return false;
        const definition = FEATURE_REGISTRY[flagName];
        if (!definition) return true;
        return (definition.requires || []).every(hasRequirement);
    }

    for (const locale of localeCandidates(country)) {
        const filePath = path.join(process.cwd(), 'locales', `${locale}.json`);
        try {
            if (!fs.existsSync(filePath)) continue;
            const localeData = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
            const value = localeData?.feature_flags?.[flagName];
            const parsed = typeof value === 'boolean' ? value : parseBoolean(value);
            if (parsed !== undefined) {
                if (!parsed) return false;
                const definition = FEATURE_REGISTRY[flagName];
                return (definition?.requires || []).every(hasRequirement);
            }
        } catch (e) {
            console.error(`Error reading feature flag ${flagName} for locale ${locale}:`, e);
        }
    }

    const definition = FEATURE_REGISTRY[flagName];
    if (!definition) return false;
    return definition.defaultEnabled && (definition.requires || []).every(hasRequirement);
}

export function isFeatureEnabled(country: string, flagName: string): boolean {
    return getFeatureFlag(country, flagName);
}

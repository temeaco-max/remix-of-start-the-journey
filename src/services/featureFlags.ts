import fs from 'fs';
import path from 'path';

const FLAG_ENV_PREFIX = 'FF_';

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

export function getFeatureFlag(country: string, flagName: string): boolean {
    // Environment always wins, allowing deployment-specific overrides.
    const envValue = parseBoolean(process.env[`${FLAG_ENV_PREFIX}${flagName.toUpperCase()}`]);
    if (envValue !== undefined) return envValue;

    for (const locale of localeCandidates(country)) {
        const filePath = path.join(process.cwd(), 'locales', `${locale}.json`);
        try {
            if (!fs.existsSync(filePath)) continue;
            const localeData = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
            const value = localeData?.feature_flags?.[flagName];
            if (typeof value === 'boolean') return value;
            if (typeof value === 'string') {
                const parsed = parseBoolean(value);
                if (parsed !== undefined) return parsed;
            }
        } catch (e) {
            console.error(`Error reading feature flag ${flagName} for locale ${locale}:`, e);
        }
    }

    // Blueprint default is fail-closed for optional features.
    return false;
}

export function isFeatureEnabled(country: string, flagName: string): boolean {
    return getFeatureFlag(country, flagName);
}

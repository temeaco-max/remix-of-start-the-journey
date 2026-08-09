import fs from 'fs';
import path from 'path';

export function getFeatureFlag(country: string, flagName: string): any {
    const localeFile = country === 'gb' ? 'gb' : 'en'; // Simple logic for now
    const filePath = path.join(process.cwd(), 'locales', `${localeFile}.json`);
    
    try {
        if (fs.existsSync(filePath)) {
            const localeData = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
            if (localeData.feature_flags && localeData.feature_flags[flagName] !== undefined) {
                return localeData.feature_flags[flagName];
            }
        }
    } catch (e) {
        console.error(`Error reading feature flag ${flagName} for locale ${localeFile}:`, e);
    }
    return null; // Default or error
}

import { getDb, saveDb } from '../database.js';
import fs from 'fs';
import path from 'path';

let blocklistPatterns: string[] = [];
try {
    const configPath = path.join(process.cwd(), 'config', 'blocklist.json');
    if (fs.existsSync(configPath)) {
        const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
        blocklistPatterns = config.patterns || [];
    }
} catch (err) {
    console.error('Failed to load blocklist.json:', err);
}

const SCAM_KEYWORDS = [
    ...blocklistPatterns,
    'bitcoin', 'crypto', 'investment return', 'double your money', 'wire transfer', 
    'western union', 'urgent cash', 'lottery', 'inheritance', 'bank account details',
    'send money urgently', 'gift card', 'pay outside the platform', 'bypass kurukoo'
];

const SCAM_REGEX = [
    /w\.?e\.?s\.?t\.?e\.?r\.?n\s*u\.?n\.?i\.?o\.?n/i,
    /b\.?i\.?t\.?c\.?o\.?i\.?n/i,
    /c\.?r\.?y\.?p\.?t\.?o/i,
    /\+?[0-9\s\-]{8,20}/ // Phone number detection in suspicious context
];

export async function checkCompliance(phone: string, text: string): Promise<boolean> {
    const q = text.toLowerCase();
    
    // Keyword check
    for (const kw of SCAM_KEYWORDS) {
        if (q.includes(kw)) {
            await logComplianceEvent(`Scam keyword detected: ${kw}`, phone);
            return false;
        }
    }

    // Regex check
    for (const re of SCAM_REGEX) {
        if (re.test(q)) {
            await logComplianceEvent(`Scam pattern detected: ${re.source}`, phone);
            return false;
        }
    }

    return true;
}

async function logComplianceEvent(reason: string, phone: string) {
    const db = await getDb();
    db.run(`INSERT INTO compliance_events (event) VALUES (?)`, [`${reason} from ${phone}`]);
    saveDb();
}

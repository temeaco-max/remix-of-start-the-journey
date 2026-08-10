import { getDb, saveDb } from '../database.js';

const SUPPORTED_PLATFORMS = new Set(['youtube', 'instagram', 'facebook', 'tiktok']);

/**
 * Social publishing is an external integration. Never report a post as
 * scheduled until a real platform adapter accepts it.
 */
export async function schedulePost(platform: string, content: string, scheduledTime: string): Promise<boolean> {
    const normalized = platform.trim().toLowerCase();
    if (!SUPPORTED_PLATFORMS.has(normalized)) throw new Error(`Unsupported social platform: ${platform}`);
    if (!content.trim()) throw new Error('Post content is required');
    const date = new Date(scheduledTime);
    if (Number.isNaN(date.getTime()) || date.getTime() <= Date.now()) throw new Error('Scheduled time must be in the future');

    const configured = Boolean(process.env[`SOCIAL_${normalized.toUpperCase()}_TOKEN`]);
    if (!configured) {
        const db = await getDb();
        db.run(`CREATE TABLE IF NOT EXISTS social_posts (id INTEGER PRIMARY KEY AUTOINCREMENT, platform TEXT, content TEXT, scheduled_time TEXT, status TEXT, created_at TEXT DEFAULT CURRENT_TIMESTAMP)`);
        db.run(`INSERT INTO social_posts (platform, content, scheduled_time, status) VALUES (?, ?, ?, 'awaiting_provider')`, [normalized, content, date.toISOString()]);
        saveDb();
        return false;
    }

    // Provider-specific publishing adapters should be implemented before this
    // flag is enabled. We intentionally fail closed rather than creating a fake
    // scheduled post that will never publish.
    return false;
}

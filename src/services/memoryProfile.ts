import crypto from 'crypto';
import { getDb, saveDb } from '../database.js';

const ALGORITHM = 'aes-256-cbc';
const getSecretKey = () => {
    const raw = process.env.MEMORY_ENCRYPTION_KEY || 'kurukoo-secret-encryption-key-32bytes!';
    return crypto.createHash('sha256').update(raw).digest();
};

export function encryptData(text: string): string {
    if (!text) return text;
    try {
        const iv = crypto.randomBytes(16);
        const cipher = crypto.createCipheriv(ALGORITHM, getSecretKey(), iv);
        let encrypted = cipher.update(text, 'utf8', 'hex');
        encrypted += cipher.final('hex');
        return iv.toString('hex') + ':' + encrypted;
    } catch (e) {
        return text;
    }
}

export function decryptData(encryptedText: string): string {
    if (!encryptedText || !encryptedText.includes(':')) return encryptedText;
    try {
        const parts = encryptedText.split(':');
        const iv = Buffer.from(parts[0], 'hex');
        const encrypted = parts[1];
        const decipher = crypto.createDecipheriv(ALGORITHM, getSecretKey(), iv);
        let decrypted = decipher.update(encrypted, 'hex', 'utf8');
        decrypted += decipher.final('utf8');
        return decrypted;
    } catch (e) {
        return encryptedText;
    }
}

export async function logProfileAccess(phone: string, serviceName: string, action: 'read' | 'write') {
    try {
        const db = await getDb();
        db.run(`INSERT INTO profile_access_log (phone, service_name, action) VALUES (?, ?, ?)`, [phone, serviceName, action]);
        saveDb();
    } catch (e) {
        console.error('Failed to log profile access:', e);
    }
}

export async function getProfile(phone: string, serviceName: string = 'system') {
    await logProfileAccess(phone, serviceName, 'read');
    const db = await getDb();
    const stmt = db.prepare(`SELECT * FROM memory_profiles WHERE phone = ?`);
    stmt.bind([phone]);
    let profile: any = null;
    if (stmt.step()) {
        profile = stmt.getAsObject();
    }
    stmt.free();

    if (profile) {
        if (profile.preferences) {
            const decryptedPrefs = decryptData(profile.preferences);
            try {
                profile.preferences = JSON.parse(decryptedPrefs);
            } catch (e) {
                profile.preferences = {};
            }
        }
        if (profile.behavior_patterns) {
            const decryptedPatterns = decryptData(profile.behavior_patterns);
            try {
                profile.behavior_patterns = JSON.parse(decryptedPatterns);
            } catch (e) {
                profile.behavior_patterns = {};
            }
        }
    }
    return profile;
}

export async function updateProfile(phone: string, serviceName: string = 'system', updates: {
    name?: string;
    location?: string;
    country?: string;
    subscription_tier?: string;
    wallet_balance_minor?: number;
    preferences?: any;
    behavior_patterns?: any;
    fcm_token?: string;
    is_available?: number;
}) {
    await logProfileAccess(phone, serviceName, 'write');
    const db = await getDb();
    
    // Check if profile exists
    const existing = await getProfile(phone, serviceName);
    
    const name = updates.name !== undefined ? updates.name : (existing ? existing.name : 'New User');
    const location = updates.location !== undefined ? updates.location : (existing ? existing.location : 'Ibadan');
    const country = updates.country !== undefined ? updates.country : (existing ? existing.country : 'ng');
    const subscription_tier = updates.subscription_tier !== undefined ? updates.subscription_tier : (existing ? existing.subscription_tier : 'Base');
    const wallet_balance_minor = updates.wallet_balance_minor !== undefined ? updates.wallet_balance_minor : (existing ? existing.wallet_balance_minor : 30);
    
    const prefsObj = updates.preferences !== undefined ? updates.preferences : (existing ? existing.preferences : {});
    if (!prefsObj.referral_code) {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        let code = '';
        for (let i = 0; i < 8; i++) {
            code += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        prefsObj.referral_code = code;
    }
    if (!prefsObj.badges) {
        prefsObj.badges = [];
    }
    const prefsStr = encryptData(JSON.stringify(prefsObj));

    const patternsObj = updates.behavior_patterns !== undefined ? updates.behavior_patterns : (existing ? existing.behavior_patterns : {});
    const patternsStr = encryptData(JSON.stringify(patternsObj));

    const fcm_token = updates.fcm_token !== undefined ? updates.fcm_token : (existing ? existing.fcm_token : null);
    const is_available = updates.is_available !== undefined ? updates.is_available : (existing ? existing.is_available : 0);

    if (!existing) {
        db.run(`INSERT INTO memory_profiles (phone, name, location, country, subscription_tier, wallet_balance_minor, preferences, behavior_patterns, fcm_token, is_available) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [phone, name, location, country, subscription_tier, wallet_balance_minor, prefsStr, patternsStr, fcm_token, is_available]);
    } else {
        db.run(`UPDATE memory_profiles SET name = ?, location = ?, country = ?, subscription_tier = ?, wallet_balance_minor = ?, preferences = ?, behavior_patterns = ?, fcm_token = ?, is_available = ?, updated_at = CURRENT_TIMESTAMP WHERE phone = ?`,
            [name, location, country, subscription_tier, wallet_balance_minor, prefsStr, patternsStr, fcm_token, is_available, phone]);
    }
    saveDb();
    return await getProfile(phone, serviceName);
}

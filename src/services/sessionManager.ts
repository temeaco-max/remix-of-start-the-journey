import { getDb, saveDb } from '../database.js';
import { sendFcmPush, generateWhatsAppDeepLink } from './pushNotifications.js';
import { recordKeepAliveEvent } from './analytics.js';

/**
 * Update the last conversation timestamp for a user and record session start if it's a new 24-hour window.
 */
export async function updateSessionInteraction(phone: string): Promise<void> {
    try {
        const db = await getDb();
        const stmt = db.prepare(`SELECT preferences, last_active_at FROM memory_profiles WHERE phone = ?`);
        stmt.bind([phone]);
        let profile = null;
        if (stmt.step()) {
            profile = stmt.getAsObject();
        }
        stmt.free();

        const now = new Date();
        const nowIso = now.toISOString();

        const prefs = profile && profile.preferences ? JSON.parse(profile.preferences) : {};
        const oldLastActive = profile?.last_active_at;

        let isNewSession = false;
        if (!oldLastActive) {
            isNewSession = true;
        } else {
            const lastActiveDate = new Date(oldLastActive);
            const diffHours = (now.getTime() - lastActiveDate.getTime()) / (1000 * 60 * 60);
            if (diffHours >= 24) {
                isNewSession = true;
            }
        }

        prefs.sim_hours_since_interaction = 0;
        prefs.last_keep_alive_reset_at = nowIso;
        prefs.whatsapp_session_state = 'active_free';
        // Clear the sent flag for the new 15-hour block
        prefs.keep_alive_fcm_sent = false; 

        db.run(
            `UPDATE memory_profiles SET last_active_at = ?, preferences = ? WHERE phone = ?`,
            [nowIso, JSON.stringify(prefs), phone]
        );
        saveDb();

        if (isNewSession) {
            // Record session start fee (standard Meta rate is 9.28 NGN)
            await recordKeepAliveEvent(phone, 'session_start', 9.28, { reason: 'New conversation window' });
        }
    } catch (err) {
        console.error('Error updating session interaction:', err);
    }
}

/**
 * Checks all active user profiles and triggers keep-alive FCM pushes if they've been idle for >= 15 hours.
 */
export async function checkAndTriggerKeepAlives(): Promise<void> {
    try {
        const db = await getDb();
        const stmt = db.prepare(`SELECT phone, preferences, last_active_at FROM memory_profiles`);
        const profilesToUpdate: any[] = [];

        while (stmt.step()) {
            profilesToUpdate.push(stmt.getAsObject());
        }
        stmt.free();

        const now = new Date();

        for (const p of profilesToUpdate) {
            if (!p.last_active_at) continue;

            const prefs = p.preferences ? JSON.parse(p.preferences) : {};
            const lastActive = new Date(p.last_active_at);
            const diffHours = (now.getTime() - lastActive.getTime()) / (1000 * 60 * 60);

            // If the user has been idle for >= 15 hours, and we haven't sent the FCM keep-alive yet for this session:
            if (diffHours >= 15 && diffHours < 24 && !prefs.keep_alive_fcm_sent) {
                const deepLink = generateWhatsAppDeepLink("Show nearby active providers");
                
                // Trigger actual FCM push notification log / flow
                const success = await sendFcmPush(
                    p.phone,
                    "Kurukoo Free Keep-Alive",
                    "Your nearby live radar feed is updating! Tap here to see who is active near you right now and keep your session 100% free.",
                    deepLink
                );

                if (success) {
                    prefs.keep_alive_fcm_sent = true;
                    prefs.keep_alive_fcm_sent_at = now.toISOString();
                    
                    db.run(
                        `UPDATE memory_profiles SET preferences = ? WHERE phone = ?`,
                        [JSON.stringify(prefs), p.phone]
                    );
                    
                    // Log the FCM push sent event in analytics
                    await recordKeepAliveEvent(p.phone, 'push_sent', 0, { hours_idle: diffHours });
                }
            } else if (diffHours >= 24 && prefs.whatsapp_session_state === 'active_free') {
                // Mark session as expired
                prefs.whatsapp_session_state = 'expired';
                db.run(
                    `UPDATE memory_profiles SET preferences = ? WHERE phone = ?`,
                    [JSON.stringify(prefs), p.phone]
                );
                
                // Log session expiration in analytics
                await recordKeepAliveEvent(p.phone, 'session_expired', 0, { hours_idle: diffHours });
            }
        }
        
        saveDb();
    } catch (err) {
        console.error('Error checking keep-alives in scheduler:', err);
    }
}

let intervalId: NodeJS.Timeout | null = null;

/**
 * Starts the automated Keep-Alive background polling task.
 */
export function startSessionManagerScheduler(intervalMs: number = 60000): void {
    if (intervalId) return;
    
    console.log('⏰ WhatsApp Session Keep-Alive Manager Scheduler initialized.');
    intervalId = setInterval(async () => {
        await checkAndTriggerKeepAlives();
    }, intervalMs);
}

/**
 * Stops the automated scheduler.
 */
export function stopSessionManagerScheduler(): void {
    if (intervalId) {
        clearInterval(intervalId);
        intervalId = null;
    }
}

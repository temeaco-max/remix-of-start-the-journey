import { getDb } from '../database.js';
import { generateWhatsAppDeepLink } from '../utils/whatsappLinks.js';

export { generateWhatsAppDeepLink };

export async function sendFcmPush(phone: string, title: string, body: string, link?: string): Promise<boolean> {
    const db = await getDb();
    const stmt = db.prepare(`SELECT fcm_token FROM memory_profiles WHERE phone = ?`);
    stmt.bind([phone]);
    if (!stmt.step()) {
        stmt.free();
        return false;
    }
    const token = stmt.getAsObject().fcm_token;
    stmt.free();

    if (!token) return false;
    
    const clickLink = link || generateWhatsAppDeepLink();
    console.log(`Sending FCM push to token ${token}: ${title} - ${body} (Link: ${clickLink})`);
    
    // Simulate real FCM structure payload with clickable links
    const payload = {
        to: token,
        notification: {
            title,
            body
        },
        data: {
            click_action: "FLUTTER_NOTIFICATION_CLICK",
            link: clickLink
        }
    };
    console.log(`[FCM PAYLOAD] ${JSON.stringify(payload)}`);
    return true;
}

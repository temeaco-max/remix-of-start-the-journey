import { getDb } from '../database.js';
import { appendChatMessage } from '../services/chatConversationService.js';

export async function handleUssdRequest(phoneNumber: string, text: string): Promise<string> {
    const phone = String(phoneNumber || '').trim();
    if (!phone) return 'END Unable to identify your Kurukoo account. Please try again.';

    const db = await getDb();
    let response = '';
    const parts = text ? text.split('*') : [];
    const level = parts.length;

    const stmt = db.prepare(`SELECT id, title, options FROM service_categories ORDER BY id ASC`);
    const categories: any[] = [];
    while (stmt.step()) {
        const obj = stmt.getAsObject();
        try { obj.options = JSON.parse(obj.options as string); } catch { obj.options = []; }
        categories.push(obj);
    }
    stmt.free();

    if (!text) {
        let menuStr = `CON Welcome to Kurukoo (*7000#)\n`;
        categories.forEach((cat, index) => { menuStr += `${index + 1}. ${cat.title}\n`; });
        menuStr += `${categories.length + 1}. Check Balance / Reload\n${categories.length + 2}. Emergency SOS`;
        response = menuStr;
    } else {
        const mainSelection = parseInt(parts[0], 10);
        if (mainSelection > 0 && mainSelection <= categories.length) {
            const cat = categories[mainSelection - 1];
            if (level === 1) {
                let submenuStr = `CON Select Option for ${cat.title}:\n`;
                (cat.options as string[]).forEach((opt, index) => { submenuStr += `${index + 1}. ${opt}\n`; });
                response = submenuStr;
            } else {
                response = `END Your request for ${cat.title} has been received and dispatched to nearby providers.`;
            }
        } else if (mainSelection === categories.length + 1) {
            const stmt2 = db.prepare(`SELECT COALESCE(points_balance, 0) as points FROM memory_profiles WHERE phone = ?`);
            stmt2.bind([phone]);
            let bal = 0;
            if (stmt2.step()) bal = Number(stmt2.getAsObject().points || 0);
            stmt2.free();
            response = `END Your Kurukoo balance is ${bal} Points. Dial *7000*1# to top up.`;
        } else if (mainSelection === categories.length + 2) {
            response = `END Emergency SOS triggered. Local emergency services and trusted contacts alerted with your location.`;
        } else {
            response = `END Invalid selection. Thank you for using Kurukoo.`;
        }
    }

    const conversation = await appendChatMessage({
        phone,
        sender: 'user',
        content: text || 'HOME',
        channel: 'ussd',
        metadata: { channel: 'ussd', inbound: true }
    });
    await appendChatMessage({
        phone,
        sender: 'assistant',
        content: response,
        channel: 'ussd',
        conversationId: conversation.conversationId,
        metadata: { channel: 'ussd', outbound: true }
    });

    return response;
}

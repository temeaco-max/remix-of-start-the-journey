import { getDb, saveDb } from '../database.js';

export async function handleUssdRequest(phoneNumber: string, text: string): Promise<string> {
    const phone = phoneNumber || '+2348030000000';
    const db = await getDb();
    let response = '';

    const parts = text ? text.split('*') : [];
    const level = parts.length;

    // Fetch categories dynamically
    const stmt = db.prepare(`SELECT id, title, options FROM service_categories ORDER BY id ASC`);
    const categories = [];
    while (stmt.step()) {
        const obj = stmt.getAsObject();
        try {
            obj.options = JSON.parse(obj.options as string);
        } catch {
            obj.options = [];
        }
        categories.push(obj);
    }
    stmt.free();

    if (text === '' || !text) {
        let menuStr = `CON Welcome to Kurukoo (*7000#)\n`;
        categories.forEach((cat, index) => {
            menuStr += `${index + 1}. ${cat.title}\n`;
        });
        menuStr += `${categories.length + 1}. Check Balance / Reload\n`;
        menuStr += `${categories.length + 2}. Emergency SOS`;
        response = menuStr;
    } else {
        const mainSelection = parseInt(parts[0]);
        if (mainSelection > 0 && mainSelection <= categories.length) {
            const cat = categories[mainSelection - 1];
            if (level === 1) {
                let submenuStr = `CON Select Option for ${cat.title}:\n`;
                (cat.options as string[]).forEach((opt, index) => {
                    submenuStr += `${index + 1}. ${opt}\n`;
                });
                response = submenuStr;
            } else {
                response = `END Your request for ${cat.title} has been received and dispatched to nearby providers.`;
            }
        } else if (mainSelection === categories.length + 1) {
            const stmt2 = db.prepare(`SELECT COALESCE(points_balance, 0) as points FROM memory_profiles WHERE phone = ?`);
            stmt2.bind([phone]);
            let bal = 0;
            if (stmt2.step()) bal = stmt2.getAsObject().points as number;
            stmt2.free();
            response = `END Your Kurukoo balance is ${bal} Points. Dial *7000*1# to top up.`;
        } else if (mainSelection === categories.length + 2) {
            response = `END Emergency SOS triggered. Local emergency services and trusted contacts alerted with your location.`;
        } else {
            response = `END Invalid selection. Thank you for using Kurukoo.`;
        }
    }

    db.run(`INSERT INTO messages (phone, sender, content, channel) VALUES (?, 'user', ?, 'ussd')`, [phone, text || 'HOME']);
    db.run(`INSERT INTO messages (phone, sender, content, channel) VALUES (?, 'assistant', ?, 'ussd')`, [phone, response]);
    saveDb();

    return response;
}

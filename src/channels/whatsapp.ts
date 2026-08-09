import { getDb, saveDb } from '../database.js';
import { routeIntent } from '../services/intentRouter.js';
import { updateSessionInteraction } from '../services/sessionManager.js';

async function sendWhatsAppTypingIndicator(phone: string, status: 'typing' | 'stopped', phoneNumberId?: string): Promise<void> {
    try {
        const token = process.env.WHATSAPP_TOKEN;
        const phoneId = phoneNumberId || process.env.WHATSAPP_PHONE_NUMBER_ID || '1000000000000';
        if (!token) {
            return;
        }
        const recipient = phone.replace(/^\+/, '');
        await fetch(`https://graph.facebook.com/v18.0/${phoneId}/messages`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                messaging_product: 'whatsapp',
                status: status,
                to: recipient
            })
        });
    } catch (err) {
        console.warn(`[WhatsApp Typing] Failed to send ${status} status:`, err);
    }
}

async function sendWhatsAppMessage(phone: string, text: string, phoneNumberId?: string): Promise<string | null> {
    try {
        const token = process.env.WHATSAPP_TOKEN;
        const phoneId = phoneNumberId || process.env.WHATSAPP_PHONE_NUMBER_ID || '1000000000000';
        if (!token) {
            return null;
        }
        const recipient = phone.replace(/^\+/, '');
        const res = await fetch(`https://graph.facebook.com/v18.0/${phoneId}/messages`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                messaging_product: 'whatsapp',
                recipient_type: 'individual',
                to: recipient,
                type: 'text',
                text: { body: text }
            })
        });
        const data = await res.json() as any;
        const wamid = data?.messages?.[0]?.id || null;
        return wamid;
    } catch (err) {
        console.warn(`[WhatsApp API] Failed to send message:`, err);
        return null;
    }
}

export async function handleWhatsAppWebhook(body: any, signature: string): Promise<{ status: string; [key: string]: any }> {
    try {
        const entry = body?.entry?.[0];
        const change = entry?.changes?.[0];
        const value = change?.value;
        const phoneNumberId = value?.metadata?.phone_number_id;

        // 1. Handle WhatsApp Status Updates (e.g. read receipts, delivered, sent)
        const statuses = value?.statuses;
        if (statuses && Array.isArray(statuses) && statuses.length > 0) {
            const db = await getDb();
            for (const st of statuses) {
                const wamid = st.id;
                const statusVal = st.status; // 'sent', 'delivered', 'read'
                const recipientId = st.recipient_id ? `+${st.recipient_id}` : (st.recipient ? `+${st.recipient}` : null);

                console.log(`[WhatsApp Webhook] Status update received: id=${wamid}, status=${statusVal}, recipient=${recipientId}`);

                if (wamid) {
                    db.run(`UPDATE messages SET status = ? WHERE whatsapp_msg_id = ?`, [statusVal, wamid]);
                }
                if (recipientId && statusVal === 'read') {
                    // Update unread assistant messages for this recipient to 'read'
                    db.run(`UPDATE messages SET status = 'read' WHERE phone = ? AND sender = 'assistant' AND status != 'read'`, [recipientId]);
                }
            }
            saveDb();
            return { status: 'success', processed: 'statuses' } as any;
        }

        // 2. Handle Incoming WhatsApp Messages
        const messages = value?.messages;
        if (!messages || messages.length === 0) {
            // Check if direct simulation payload (e.g. { phone, status, whatsapp_msg_id })
            if (body?.phone && (body?.status || body?.whatsapp_msg_id)) {
                const db = await getDb();
                const targetPhone = body.phone;
                const targetStatus = body.status || 'read';
                const targetMsgId = body.whatsapp_msg_id;

                if (targetMsgId) {
                    db.run(`UPDATE messages SET status = ? WHERE whatsapp_msg_id = ?`, [targetStatus, targetMsgId]);
                }
                if (targetPhone && targetStatus === 'read') {
                    db.run(`UPDATE messages SET status = 'read' WHERE phone = ? AND sender = 'assistant'`, [targetPhone]);
                }
                saveDb();
                return { status: 'success', processed: 'simulation' };
            }

            return { status: 'ignored' };
        }

        const msg = messages[0];
        const phone = msg.from ? `+${msg.from}` : '+2348030000000';
        const text = msg.text?.body || msg.button?.text || 'Hello';

        await sendWhatsAppTypingIndicator(phone, 'typing', phoneNumberId);

        const db = await getDb();
        db.run(`INSERT INTO messages (phone, sender, content, channel, status) VALUES (?, 'user', ?, 'whatsapp', 'read')`, [phone, text]);
        
        await updateSessionInteraction(phone);

        const routing = await routeIntent(text, phone);
        const reply = `${routing.reply}`;

        // Send reply via WhatsApp API and get message ID (wamid)
        const wamid = await sendWhatsAppMessage(phone, reply, phoneNumberId);

        db.run(`INSERT INTO messages (phone, sender, content, channel, card_data, status, whatsapp_msg_id) VALUES (?, 'assistant', ?, 'whatsapp', ?, 'sent', ?)`, [
            phone,
            reply,
            routing.cardData ? JSON.stringify(routing.cardData) : null,
            wamid
        ]);
        saveDb();

        await sendWhatsAppTypingIndicator(phone, 'stopped', phoneNumberId);

        return { status: 'success' };
    } catch (e) {
        console.error('WhatsApp webhook error:', e);
        return { status: 'error' };
    }
}

import crypto from 'crypto';
import { getDb, saveDb } from '../database.js';
import { routeIntent } from '../services/intentRouter.js';
import { appendChatMessage } from '../services/chatConversationService.js';
import { updateSessionInteraction } from '../services/sessionManager.js';

/** Verify Meta X-Hub-Signature-256 (security audit #8). */
export function verifyWhatsAppSignature(rawBody: string | Buffer, signatureHeader: string): boolean {
    const appSecret = process.env.WHATSAPP_APP_SECRET;
    if (!appSecret) {
        // Fail closed in production; allow local dev without secret
        if (process.env.NODE_ENV === 'production') return false;
        console.warn('[WhatsApp] WHATSAPP_APP_SECRET not set — signature check skipped (non-production)');
        return true;
    }
    if (!signatureHeader || !signatureHeader.startsWith('sha256=')) return false;
    const expected = signatureHeader.slice('sha256='.length);
    const digest = crypto.createHmac('sha256', appSecret).update(rawBody).digest('hex');
    try {
        return crypto.timingSafeEqual(Buffer.from(expected, 'hex'), Buffer.from(digest, 'hex'));
    } catch {
        return false;
    }
}

async function sendWhatsAppTypingIndicator(phone: string, status: 'typing' | 'stopped', phoneNumberId?: string): Promise<void> {
    try {
        const token = process.env.WHATSAPP_TOKEN;
        const phoneId = phoneNumberId || process.env.WHATSAPP_PHONE_NUMBER_ID;
        if (!token || !phoneId) return;
        const recipient = phone.replace(/^\+/, '');
        await fetch(`https://graph.facebook.com/v18.0/${phoneId}/messages`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({ messaging_product: 'whatsapp', status, to: recipient })
        });
    } catch (err) { console.warn(`[WhatsApp Typing] Failed to send ${status} status:`, err); }
}

async function sendWhatsAppMessage(phone: string, text: string, phoneNumberId?: string): Promise<string | null> {
    try {
        const token = process.env.WHATSAPP_TOKEN;
        const phoneId = phoneNumberId || process.env.WHATSAPP_PHONE_NUMBER_ID;
        if (!token || !phoneId) return null;
        const recipient = phone.replace(/^\+/, '');
        const res = await fetch(`https://graph.facebook.com/v18.0/${phoneId}/messages`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({ messaging_product: 'whatsapp', recipient_type: 'individual', to: recipient, type: 'text', text: { body: text } })
        });
        const data = await res.json() as any;
        return data?.messages?.[0]?.id || null;
    } catch (err) { console.warn('[WhatsApp API] Failed to send message:', err); return null; }
}

export async function handleWhatsAppWebhook(body: any, signature: string, rawBody?: string | Buffer): Promise<{ status: string; [key: string]: any }> {
    try {
        if (rawBody !== undefined) {
            const ok = verifyWhatsAppSignature(typeof rawBody === 'string' ? rawBody : rawBody.toString('utf8'), signature || '');
            if (!ok) return { status: 'error', error: 'invalid_signature' };
        } else if (process.env.NODE_ENV === 'production' && process.env.WHATSAPP_APP_SECRET) {
            // Without raw body we cannot verify — reject in production when secret is configured
            const ok = verifyWhatsAppSignature(JSON.stringify(body || {}), signature || '');
            if (!ok) return { status: 'error', error: 'invalid_signature' };
        }

        const entry = body?.entry?.[0];
        const change = entry?.changes?.[0];
        const value = change?.value;
        const phoneNumberId = value?.metadata?.phone_number_id;

        const statuses = value?.statuses;
        if (Array.isArray(statuses) && statuses.length) {
            const db = await getDb();
            for (const st of statuses) {
                const wamid = st.id;
                const statusVal = st.status;
                const recipientId = st.recipient_id ? `+${st.recipient_id}` : (st.recipient ? `+${st.recipient}` : null);
                if (wamid) db.run(`UPDATE messages SET status = ? WHERE whatsapp_msg_id = ?`, [statusVal, wamid]);
                if (recipientId && statusVal === 'read') db.run(`UPDATE messages SET status = 'read' WHERE phone = ? AND sender = 'assistant' AND status != 'read'`, [recipientId]);
            }
            saveDb();
            return { status: 'success', processed: 'statuses' };
        }

        const messages = value?.messages;
        if (!Array.isArray(messages) || !messages.length) {
            if (body?.phone && (body?.status || body?.whatsapp_msg_id)) {
                if (process.env.NODE_ENV === 'production') return { status: 'ignored' };
                const db = await getDb();
                const targetPhone = String(body.phone).trim();
                if (!targetPhone) return { status: 'ignored' };
                const targetStatus = body.status || 'read';
                const targetMsgId = body.whatsapp_msg_id;
                if (targetMsgId) db.run(`UPDATE messages SET status = ? WHERE whatsapp_msg_id = ?`, [targetStatus, targetMsgId]);
                if (targetStatus === 'read') db.run(`UPDATE messages SET status = 'read' WHERE phone = ? AND sender = 'assistant'`, [targetPhone]);
                saveDb();
                return { status: 'success', processed: 'simulation' };
            }
            return { status: 'ignored' };
        }

        const msg = messages[0];
        const phone = msg.from ? `+${msg.from}` : '';
        const text = msg.text?.body || msg.button?.text || '';
        if (!phone || !text.trim()) return { status: 'ignored' };

        await sendWhatsAppTypingIndicator(phone, 'typing', phoneNumberId);
        await updateSessionInteraction(phone);

        const userMessage = await appendChatMessage({
            phone,
            sender: 'user',
            content: text,
            channel: 'whatsapp',
            metadata: { channel: 'whatsapp', inbound: true, whatsapp_message_id: msg.id, signature }
        });

        const routing = await routeIntent(text, phone);
        const reply = `${routing.reply}`;
        const wamid = await sendWhatsAppMessage(phone, reply, phoneNumberId);

        await appendChatMessage({
            phone,
            sender: 'assistant',
            content: reply,
            channel: 'whatsapp',
            conversationId: userMessage.conversationId,
            cardData: routing.cardData,
            metadata: { channel: 'whatsapp', outbound: true, whatsapp_message_id: wamid }
        });

        if (wamid) {
            const db = await getDb();
            db.run(`UPDATE messages SET whatsapp_msg_id = ?, status = 'sent' WHERE id = (SELECT MAX(id) FROM messages WHERE phone = ? AND sender = 'assistant')`, [wamid, phone]);
            saveDb();
        }

        await sendWhatsAppTypingIndicator(phone, 'stopped', phoneNumberId);
        return { status: 'success', conversationId: userMessage.conversationId };
    } catch (e) {
        console.error('WhatsApp webhook error:', e);
        return { status: 'error' };
    }
}

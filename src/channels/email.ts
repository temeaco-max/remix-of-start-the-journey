import crypto from 'node:crypto';
import { routeIntent } from '../services/intentRouter.js';
import { getDb, saveDb } from '../database.js';
import { sendEmail } from '../services/emailService.js';

function emailAddress(value: unknown): string {
    const raw = String(value || '').trim().toLowerCase();
    const match = raw.match(/<([^>]+)>/);
    return (match?.[1] || raw).trim();
}

function eventId(body: any): string {
    return String(body?.data?.email_id || body?.email_id || body?.id || body?.data?.message_id || body?.message_id || crypto.createHash('sha256').update(JSON.stringify(body)).digest('hex'));
}

function messageId(body: any): string | undefined {
    return body?.data?.message_id || body?.message_id || body?.headers?.['message-id'] || body?.headers?.['Message-ID'];
}

function timingSafeEqualHexOrBase64(expected: string, actual: string): boolean {
    try {
        const a = Buffer.from(expected, /^[a-f0-9]+$/i.test(expected) ? 'hex' : 'base64');
        const b = Buffer.from(actual, /^[a-f0-9]+$/i.test(actual) ? 'hex' : 'base64');
        return a.length === b.length && crypto.timingSafeEqual(a, b);
    } catch { return false; }
}

function verifyWebhook(rawBody: string, headers: Record<string, any>): boolean {
    const secret = process.env.RESEND_WEBHOOK_SECRET || process.env.EMAIL_WEBHOOK_SECRET;
    if (!secret) return process.env.NODE_ENV !== 'production';

    const svixId = String(headers['svix-id'] || headers['Svix-Id'] || '').trim();
    const timestamp = String(headers['svix-timestamp'] || headers['Svix-Timestamp'] || '').trim();
    const signature = String(headers['svix-signature'] || headers['Svix-Signature'] || '').trim();
    if (svixId && timestamp && signature) {
        const ts = Number(timestamp);
        if (!Number.isFinite(ts) || Math.abs(Date.now() / 1000 - ts) > 300) return false;
        const signingSecret = secret.startsWith('whsec_') ? secret.slice(6) : secret;
        const key = Buffer.from(signingSecret, 'base64');
        const signed = crypto.createHmac('sha256', key).update(`${svixId}.${timestamp}.${rawBody}`).digest('base64');
        return signature.split(' ').some(part => {
            const [, value] = part.split(',', 2);
            return value ? timingSafeEqualHexOrBase64(signed, value) : false;
        });
    }

    const provided = String(headers['x-email-webhook-signature'] || headers['x-email-webhook-secret'] || '').trim();
    if (!provided) return false;
    const expected = crypto.createHmac('sha256', secret).update(rawBody).digest('hex');
    return timingSafeEqualHexOrBase64(expected, provided);
}

export async function handleEmailWebhook(body: any, headers: Record<string, any>, rawBody?: string) {
    const raw = rawBody || JSON.stringify(body);
    if (!verifyWebhook(raw, headers)) throw new Error('Invalid email webhook signature');

    const eventType = String(body?.type || 'email.received').toLowerCase();
    const data = body?.data || body;
    const id = eventId(body);
    const db = await getDb();
    db.run(`CREATE TABLE IF NOT EXISTS email_events (event_id TEXT PRIMARY KEY, event_type TEXT NOT NULL, message_id TEXT, sender TEXT, received_at TEXT DEFAULT CURRENT_TIMESTAMP)`);
    db.run(`CREATE TABLE IF NOT EXISTS email_delivery_events (event_id TEXT PRIMARY KEY, phone TEXT, provider TEXT, provider_id TEXT, status TEXT NOT NULL, error TEXT, created_at TEXT DEFAULT CURRENT_TIMESTAMP)`);

    const exists = db.prepare(`SELECT event_id FROM email_events WHERE event_id = ? LIMIT 1`);
    exists.bind([id]);
    if (exists.step()) { exists.free(); return { status: 'duplicate', eventId: id }; }
    exists.free();

    const from = emailAddress(data?.from || body?.from || body?.sender);
    const incomingMessageId = messageId(body);
    db.run(`INSERT INTO email_events (event_id, event_type, message_id, sender) VALUES (?, ?, ?, ?)`, [id, eventType, incomingMessageId || null, from || null]);

    // Provider lifecycle events are part of delivery state, not chat messages.
    if (['email.delivered', 'email.delivery_delayed', 'email.bounced', 'email.complained', 'email.failed'].includes(eventType)) {
        const providerStatus = eventType.replace('email.', '');
        const providerId = String(data?.email_id || data?.id || incomingMessageId || id);
        db.run(`INSERT OR REPLACE INTO email_delivery_events (event_id, phone, provider, provider_id, status, error) VALUES (?, NULL, 'resend', ?, ?, ?)`, [id, providerId, providerStatus, data?.reason || data?.message || null]);
        saveDb();
        return { status: 'recorded', eventId: id, deliveryStatus: providerStatus };
    }

    if (eventType !== 'email.received') {
        saveDb();
        return { status: 'ignored', reason: `unsupported_event:${eventType}` };
    }

    const subject = String(data?.subject || body?.subject || '').trim();
    const text = String(data?.text || data?.plain_text || body?.text || body?.body || '').trim();
    if (!from || !text) throw new Error('Email sender and body are required');

    const lookup = db.prepare(`SELECT phone FROM memory_profiles WHERE lower(email) = lower(?) LIMIT 1`);
    lookup.bind([from]);
    let phone: string | undefined;
    if (lookup.step()) phone = String(lookup.getAsObject().phone || '');
    lookup.free();
    if (!phone) {
        saveDb();
        return { status: 'ignored', reason: 'unlinked_email_identity' };
    }

    const inbound = subject ? `Subject: ${subject}\n\n${text}` : text;
    db.run(`INSERT INTO messages (phone, sender, content, channel) VALUES (?, 'user', ?, 'email')`, [phone, inbound]);

    const routing = await routeIntent(text, phone);
    const reply = routing.reply || 'I received your message and will continue here in Kurukoo.';
    const delivery = await sendEmail(from, /^re:/i.test(subject) ? subject : `Re: ${subject || 'Kurukoo'}`, reply, {
        inReplyTo: incomingMessageId,
        references: [incomingMessageId].filter(Boolean) as string[],
        tags: { channel: 'email', conversation: 'kurukoo' }
    });

    db.run(`INSERT OR REPLACE INTO email_delivery_events (event_id, phone, provider, provider_id, status, error) VALUES (?, ?, ?, ?, ?, ?)`, [id, phone, delivery.provider, delivery.id || null, delivery.ok ? 'accepted' : 'failed', delivery.error || null]);
    if (delivery.ok) db.run(`INSERT INTO messages (phone, sender, content, channel) VALUES (?, 'assistant', ?, 'email')`, [phone, reply]);
    saveDb();

    return {
        status: delivery.ok ? 'success' : 'accepted_for_retry',
        response: reply,
        delivery,
        conversation: { phone, channel: 'email' }
    };
}

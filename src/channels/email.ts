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

export async function handleEmailWebhook(body: any, headers: Record<string, any>) {
    const expected = process.env.EMAIL_WEBHOOK_SECRET;
    if (expected && headers['x-email-webhook-secret'] !== expected) throw new Error('Invalid email webhook signature');

    const eventType = String(body?.type || 'email.received');
    if (eventType !== 'email.received') return { status: 'ignored', reason: `unsupported_event:${eventType}` };

    const data = body?.data || body;
    const from = emailAddress(data?.from || body?.from || body?.sender);
    const subject = String(data?.subject || body?.subject || '').trim();
    const text = String(data?.text || body?.text || body?.body || '').trim();
    if (!from || !text) throw new Error('Email sender and body are required');

    const db = await getDb();
    db.run(`CREATE TABLE IF NOT EXISTS email_events (event_id TEXT PRIMARY KEY, message_id TEXT, sender TEXT NOT NULL, received_at TEXT DEFAULT CURRENT_TIMESTAMP)`);
    const id = eventId(body);
    const exists = db.prepare(`SELECT event_id FROM email_events WHERE event_id = ? LIMIT 1`);
    exists.bind([id]);
    if (exists.step()) { exists.free(); return { status: 'duplicate', eventId: id }; }
    exists.free();
    db.run(`INSERT INTO email_events (event_id, message_id, sender) VALUES (?, ?, ?)`, [id, messageId(body) || null, from]);

    const lookup = db.prepare(`SELECT phone FROM memory_profiles WHERE lower(email) = lower(?) LIMIT 1`);
    lookup.bind([from]);
    let phone: string | undefined;
    if (lookup.step()) phone = String(lookup.getAsObject().phone || '');
    lookup.free();
    if (!phone) { saveDb(); return { status: 'ignored', reason: 'unlinked_email_identity' }; }

    const inbound = subject ? `Subject: ${subject}\n\n${text}` : text;
    db.run(`INSERT INTO messages (phone, sender, content, channel) VALUES (?, 'user', ?, 'email')`, [phone, inbound]);

    const routing = await routeIntent(text, phone);
    const reply = routing.reply || 'I received your message and will continue here in Kurukoo.';
    const references = [messageId(body)].filter(Boolean) as string[];
    const delivery = await sendEmail(from, /^re:/i.test(subject) ? subject : `Re: ${subject || 'Kurukoo'}`, reply, {
        inReplyTo: messageId(body),
        references,
        tags: { channel: 'email', conversation: 'kurukoo' }
    });
    db.run(`INSERT INTO messages (phone, sender, content, channel) VALUES (?, 'assistant', ?, 'email')`, [phone, reply]);
    saveDb();

    return { status: delivery.ok ? 'success' : 'accepted', response: reply, delivery, conversation: { phone, channel: 'email' } };
}

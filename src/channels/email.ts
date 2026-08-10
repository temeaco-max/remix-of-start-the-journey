import { routeIntent } from '../services/intentRouter.js';
import { getDb, saveDb } from '../database.js';
import { sendEmail } from '../services/emailService.js';

export async function handleEmailWebhook(body: any, headers: Record<string, any>) {
    const expected = process.env.EMAIL_WEBHOOK_SECRET;
    if (expected && headers['x-email-webhook-secret'] !== expected) {
        throw new Error('Invalid email webhook signature');
    }

    const from = String(body?.from || body?.sender || '').trim().toLowerCase();
    const subject = String(body?.subject || '').trim();
    const text = String(body?.text || body?.body || '').trim();
    if (!from || !text) throw new Error('Email sender and body are required');

    const db = await getDb();
    const lookup = db.prepare(`SELECT phone FROM memory_profiles WHERE email = ? LIMIT 1`);
    lookup.bind([from]);
    let phone: string | undefined;
    if (lookup.step()) phone = String(lookup.getAsObject().phone || '');
    lookup.free();
    if (!phone) return { status: 'ignored', reason: 'unlinked_email_identity' };

    const message = subject ? `Subject: ${subject}\n\n${text}` : text;
    db.run(`INSERT INTO messages (phone, sender, content, channel) VALUES (?, 'user', ?, 'email')`, [phone, message]);
    saveDb();

    const routing = await routeIntent(text, phone, 'email');
    const reply = routing.reply || 'I received your message and will continue here in Kurukoo.';
    const delivery = await sendEmail(from, `Re: ${subject || 'Kurukoo'}`, reply);
    db.run(`INSERT INTO messages (phone, sender, content, channel) VALUES (?, 'assistant', ?, 'email')`, [phone, reply]);
    saveDb();

    return { status: delivery.ok ? 'success' : 'accepted', response: reply, delivery };
}

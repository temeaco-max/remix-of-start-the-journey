/* Copyright (c) 2026 temeaco-max. All rights reserved. Proprietary and confidential. */
import crypto from 'node:crypto';
import { processCanonicalChatTurn } from '../services/canonicalChatTurnService.js';
import { getDb, saveDb } from '../database.js';
import { sendEmail } from '../services/emailService.js';
import { recordChannelEvidence } from '../services/progressiveTrustService.js';

function emailAddress(value: unknown): string {
    const raw = String(value || '').trim().toLowerCase();
    const match = raw.match(/<([^>]+)>/);
    return (match?.[1] || raw).trim();
}

function eventId(body: any, headers: Record<string, any>): string {
    return String(headers['svix-id'] || headers['Svix-Id'] || body?.data?.email_id || body?.email_id || body?.id || body?.data?.message_id || body?.message_id || crypto.createHash('sha256').update(JSON.stringify(body)).digest('hex'));
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

async function retrieveReceivedEmail(emailId: string): Promise<any | null> {
    const apiKey = process.env.RESEND_API_KEY?.trim();
    if (!apiKey || !emailId) return null;
    const response = await fetch(`https://api.resend.com/emails/receiving/${encodeURIComponent(emailId)}`, {
        headers: { Authorization: `Bearer ${apiKey}` }
    });
    if (!response.ok) throw new Error(`Unable to retrieve received email (${response.status})`);
    return await response.json();
}

function headerValue(headers: any, name: string): string | undefined {
    if (!headers || typeof headers !== 'object') return undefined;
    const key = Object.keys(headers).find(k => k.toLowerCase() === name.toLowerCase());
    const value = key ? headers[key] : undefined;
    return Array.isArray(value) ? value.join(' ') : (value ? String(value) : undefined);
}

export async function handleEmailWebhook(body: any, headers: Record<string, any>, rawBody?: string) {
    const raw = rawBody || JSON.stringify(body);
    if (!verifyWebhook(raw, headers)) throw new Error('Invalid email webhook signature');

    const eventType = String(body?.type || 'email.received').toLowerCase();
    const data = body?.data || body;
    const id = eventId(body, headers);
    const db = await getDb();
    db.run(`CREATE TABLE IF NOT EXISTS email_events (event_id TEXT PRIMARY KEY, event_type TEXT NOT NULL, message_id TEXT, sender TEXT, received_at TEXT DEFAULT CURRENT_TIMESTAMP)`);
    db.run(`CREATE TABLE IF NOT EXISTS email_delivery_events (event_id TEXT PRIMARY KEY, phone TEXT, provider TEXT, provider_id TEXT, status TEXT NOT NULL, error TEXT, created_at TEXT DEFAULT CURRENT_TIMESTAMP)`);

    const exists = db.prepare(`SELECT event_id FROM email_events WHERE event_id = ? LIMIT 1`);
    exists.bind([id]);
    const alreadySeen = exists.step();
    exists.free();
    if (alreadySeen) {
        const deliveryState = db.prepare(`SELECT status FROM email_delivery_events WHERE event_id = ? LIMIT 1`);
        deliveryState.bind([id]);
        const deliveryStatus = deliveryState.step() ? String(deliveryState.getAsObject().status || '') : '';
        deliveryState.free();
        if (deliveryStatus === 'accepted' || deliveryStatus === 'recorded') return { status: 'duplicate', eventId: id };
        // A prior attempt failed before reaching the provider. Allow Resend's
        // retry to execute again, using the same event idempotency key.
    } else {
        const from = emailAddress(data?.from || body?.from || body?.sender);
        const incomingMessageId = messageId(body);
        db.run(`INSERT INTO email_events (event_id, event_type, message_id, sender) VALUES (?, ?, ?, ?)`, [id, eventType, incomingMessageId || null, from || null]);
    }

    const from = emailAddress(data?.from || body?.from || body?.sender);
    const incomingMessageId = messageId(body);

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

    const emailId = String(data?.email_id || data?.id || '');
    let received = data;
    if (emailId && (!data?.text && !data?.html)) received = await retrieveReceivedEmail(emailId) || data;

    const subject = String(received?.subject || data?.subject || '').trim();
    const text = String(received?.text || received?.plain_text || data?.text || data?.plain_text || '').trim();
    const html = String(received?.html || data?.html || '').trim();
    if (!from || (!text && !html)) throw new Error('Email sender and body are required');

    const headersFromProvider = received?.headers || data?.headers || {};
    const referencesHeader = headerValue(headersFromProvider, 'references');
    const inReplyToHeader = headerValue(headersFromProvider, 'in-reply-to');
    const threadReferences = [
        ...(referencesHeader ? referencesHeader.split(/\s+/) : []),
        ...(inReplyToHeader ? [inReplyToHeader] : []),
        ...(incomingMessageId ? [incomingMessageId] : [])
    ].filter(Boolean);

    const lookup = db.prepare(`SELECT phone FROM memory_profiles WHERE lower(email) = lower(?) LIMIT 1`);
    lookup.bind([from]);
    let phone: string | undefined;
    if (lookup.step()) phone = String(lookup.getAsObject().phone || '');
    lookup.free();
    if (!phone) {
        saveDb();
        return { status: 'ignored', reason: 'unlinked_email_identity' };
    }

    await recordChannelEvidence({
        phone,
        channel: 'email',
        evidenceType: 'verified_resend_webhook_inbound',
        externalSubject: from,
        sourceRef: incomingMessageId || id,
        consented: true,
    });

    const attachmentMeta = Array.isArray(received?.attachments || data?.attachments)
        ? (received?.attachments || data?.attachments).map((a: any) => ({ id: a.id, filename: a.filename, content_type: a.content_type, size: a.size }))
        : [];
    const bodyText = text || html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
    const inbound = subject ? `Subject: ${subject}\n\n${bodyText}` : bodyText;
    const turn = await processCanonicalChatTurn({
        phone,
        message: inbound,
        channel: 'email',
        attachment: attachmentMeta.length ? { type: 'email_attachments', attachments: attachmentMeta } : undefined,
    });
    const reply = turn.reply || 'I received your message and will continue here in Kurukoo.';
    const delivery = await sendEmail(from, /^re:/i.test(subject) ? subject : `Re: ${subject || 'Kurukoo'}`, reply, {
        inReplyTo: incomingMessageId,
        references: threadReferences,
        idempotencyKey: `email-reply:${id}`,
        tags: { channel: 'email', conversation: 'kurukoo' }
    });

    db.run(`INSERT OR REPLACE INTO email_delivery_events (event_id, phone, provider, provider_id, status, error) VALUES (?, ?, ?, ?, ?, ?)`, [id, phone, delivery.provider, delivery.id || null, delivery.ok ? 'accepted' : 'failed', delivery.error || null]);
    saveDb();

    return {
        status: delivery.ok ? 'success' : 'accepted_for_retry',
        response: reply,
        delivery,
        conversation: { phone, channel: 'email' },
        attachments: attachmentMeta
    };
}

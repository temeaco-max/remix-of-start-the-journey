import { getDb, saveDb } from '../database.js';

interface EmailResult {
    ok: boolean;
    provider: 'resend' | 'smtp-webhook' | 'disabled';
    id?: string;
    messageId?: string;
    error?: string;
}

interface SendEmailOptions {
    inReplyTo?: string;
    references?: string[];
    replyTo?: string;
    tags?: Record<string, string>;
}

function required(name: string): string | undefined {
    const value = process.env[name]?.trim();
    return value || undefined;
}

function normalizeMessageId(value?: string): string | undefined {
    const id = value?.trim();
    if (!id) return undefined;
    return id.startsWith('<') && id.endsWith('>') ? id : `<${id.replace(/^<|>$/g, '')}>`;
}

/**
 * Transactional email adapter for Kurukoo's secondary email channel.
 *
 * Email remains a transport into the same conversation ledger; it is not a
 * second identity system. Resend is the preferred low-ops transport. The
 * generic gateway remains available for deployments that already operate an
 * SMTP/mail relay.
 */
export async function sendEmail(
    to: string,
    subject: string,
    body: string,
    options: SendEmailOptions = {}
): Promise<EmailResult> {
    const recipient = to.trim();
    if (!recipient || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(recipient)) throw new Error('Invalid email recipient');
    if (!subject.trim() || !body.trim()) throw new Error('Email subject and body are required');

    const resendKey = required('RESEND_API_KEY');
    const from = required('EMAIL_FROM');
    const webhook = required('EMAIL_WEBHOOK_URL');
    const inReplyTo = normalizeMessageId(options.inReplyTo);
    const references = (options.references || []).map(normalizeMessageId).filter(Boolean) as string[];
    let result: EmailResult;

    try {
        if (resendKey && from) {
            const payload: Record<string, unknown> = {
                from,
                to: [recipient],
                subject,
                text: body
            };
            if (options.replyTo) payload.reply_to = options.replyTo;
            if (inReplyTo || references.length) {
                payload.headers = {
                    ...(inReplyTo ? { 'In-Reply-To': inReplyTo } : {}),
                    ...(references.length ? { References: references.join(' ') } : {})
                };
            }
            if (options.tags && Object.keys(options.tags).length) {
                payload.tags = Object.entries(options.tags).map(([name, value]) => ({ name, value }));
            }

            const response = await fetch('https://api.resend.com/emails', {
                method: 'POST',
                headers: { Authorization: `Bearer ${resendKey}`, 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            const data = await response.json().catch(() => ({})) as { id?: string; message?: string; message_id?: string };
            if (!response.ok) throw new Error(data.message || `Email provider returned ${response.status}`);
            result = { ok: true, provider: 'resend', id: data.id, messageId: normalizeMessageId(data.message_id) };
        } else if (webhook) {
            const response = await fetch(webhook, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    to: recipient,
                    subject,
                    text: body,
                    replyTo: options.replyTo,
                    headers: { ...(inReplyTo ? { 'In-Reply-To': inReplyTo } : {}), ...(references.length ? { References: references } : {}) },
                    tags: options.tags || {}
                })
            });
            if (!response.ok) throw new Error(`Email gateway returned ${response.status}`);
            result = { ok: true, provider: 'smtp-webhook' };
        } else {
            result = { ok: false, provider: 'disabled', error: 'No email transport configured' };
        }
    } catch (error) {
        result = {
            ok: false,
            provider: resendKey ? 'resend' : webhook ? 'smtp-webhook' : 'disabled',
            error: error instanceof Error ? error.message : 'Email delivery failed'
        };
    }

    const db = await getDb();
    db.run(`CREATE TABLE IF NOT EXISTS email_log (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        recipient TEXT NOT NULL,
        subject TEXT NOT NULL,
        body TEXT NOT NULL,
        status TEXT NOT NULL,
        provider_id TEXT,
        message_id TEXT,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP
    )`);
    db.run(
        `INSERT INTO email_log (recipient, subject, body, status, provider_id, message_id) VALUES (?, ?, ?, ?, ?, ?)`,
        [recipient, subject, body, result.ok ? `sent:${result.provider}` : `failed:${result.provider}`, result.id || null, result.messageId || null]
    );
    saveDb();
    return result;
}

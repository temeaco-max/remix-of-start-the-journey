import { getDb, saveDb } from '../database.js';

interface EmailResult {
    ok: boolean;
    provider: 'resend' | 'smtp-webhook' | 'disabled';
    id?: string;
    error?: string;
}

function required(name: string): string | undefined {
    const value = process.env[name]?.trim();
    return value || undefined;
}

/**
 * Unified outbound email adapter.
 * Resend is deliberately implemented through fetch so the core platform does
 * not acquire another heavyweight mail dependency. A generic webhook adapter
 * is available for deployments using an internal mail gateway.
 */
export async function sendEmail(to: string, subject: string, body: string): Promise<EmailResult> {
    const recipient = to.trim();
    if (!recipient || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(recipient)) {
        throw new Error('Invalid email recipient');
    }
    if (!subject.trim() || !body.trim()) throw new Error('Email subject and body are required');

    const resendKey = required('RESEND_API_KEY');
    const from = required('EMAIL_FROM');
    const webhook = required('EMAIL_WEBHOOK_URL');
    let result: EmailResult;

    try {
        if (resendKey && from) {
            const response = await fetch('https://api.resend.com/emails', {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${resendKey}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ from, to: [recipient], subject, text: body })
            });
            const payload = await response.json().catch(() => ({})) as { id?: string; message?: string };
            if (!response.ok) throw new Error(payload.message || `Email provider returned ${response.status}`);
            result = { ok: true, provider: 'resend', id: payload.id };
        } else if (webhook) {
            const response = await fetch(webhook, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ to: recipient, subject, text: body })
            });
            if (!response.ok) throw new Error(`Email gateway returned ${response.status}`);
            result = { ok: true, provider: 'smtp-webhook' };
        } else {
            result = { ok: false, provider: 'disabled', error: 'No email transport configured' };
        }
    } catch (error) {
        result = { ok: false, provider: resendKey ? 'resend' : 'smtp-webhook', error: error instanceof Error ? error.message : 'Email delivery failed' };
    }

    const db = await getDb();
    db.run(
        `INSERT INTO email_log (recipient, subject, body, status) VALUES (?, ?, ?, ?)`,
        [recipient, subject, body, result.ok ? `sent:${result.provider}` : `failed:${result.provider}`]
    );
    saveDb();

    return result;
}

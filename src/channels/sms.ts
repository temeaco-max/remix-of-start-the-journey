import { BaseChannelHandler } from './baseChannelService.js';

export interface SmsDeliveryResult {
    ok: boolean;
    provider: 'africastalking' | 'disabled' | 'failed';
    accepted?: boolean;
    reason?: string;
}

export async function sendSmsText(phone: string, message: string): Promise<SmsDeliveryResult> {
    const apiKey = process.env.AFRICASTALKING_API_KEY;
    const username = process.env.AFRICASTALKING_USERNAME;
    const sender = process.env.AFRICASTALKING_SENDER_ID;
    if (!apiKey || !username || apiKey.toLowerCase() === 'stub' || username.toLowerCase() === 'stub') {
        return { ok: false, provider: 'disabled', accepted: false, reason: 'sms_provider_not_configured' };
    }
    const body = new URLSearchParams({ username, to: phone, message: message.slice(0, 918), ...(sender ? { from: sender } : {}) });
    try {
        const response = await fetch('https://api.africastalking.com/version1/messaging', {
            method: 'POST', headers: { apiKey, 'Content-Type': 'application/x-www-form-urlencoded', Accept: 'application/json' }, body,
        });
        if (!response.ok) {
            const detail = await response.text().catch(() => '');
            return { ok: false, provider: 'failed', accepted: false, reason: `sms_provider_http_${response.status}:${detail.slice(0, 240)}` };
        }
        return { ok: true, provider: 'africastalking', accepted: true };
    } catch (error) {
        return { ok: false, provider: 'failed', accepted: false, reason: error instanceof Error ? error.message.slice(0, 240) : 'sms_provider_request_failed' };
    }
}

class SmsHandler extends BaseChannelHandler {
    get channelName(): string { return 'sms'; }

    protected parseMessage(body: any, _headers: Record<string, any>): { phone: string; text: string; meta?: any } | null {
        const rawPhone = body?.From || body?.from || body?.phoneNumber || '';
        const text = body?.Body || body?.text || body?.message || '';
        if (!rawPhone || !text.trim()) return null;
        const phone = String(rawPhone).trim();
        const normalizedPhone = phone.startsWith('+') ? phone : `+${phone}`;
        return {
            phone: normalizedPhone,
            text: String(text).trim(),
            meta: {
                externalSubject: normalizedPhone,
                messageId: String(body?.MessageId || body?.messageId || body?.id || '').slice(0, 256) || undefined,
            },
        };
    }

    protected async sendReply(phone: string, reply: string): Promise<void> {
        const result = await sendSmsText(phone, reply);
        if (!result.ok) console.warn(`[SMS] Outbound delivery unavailable: ${result.reason || 'unknown provider failure'}`);
    }
}

const smsHandlerInstance = new SmsHandler();

export async function handleSmsWebhook(body: any): Promise<{ status: string; response?: string; conversationId?: string }> {
    const res = await smsHandlerInstance.handleWebhook(body, {});
    return { status: res.status, response: res.response, conversationId: res.conversationId };
}

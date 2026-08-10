import { BaseChannelHandler } from './baseChannelService.js';

class SmsHandler extends BaseChannelHandler {
    get channelName(): string { return 'sms'; }

    protected parseMessage(body: any, _headers: Record<string, any>): { phone: string; text: string; meta?: any } | null {
        const rawPhone = body?.From || body?.from || body?.phoneNumber || '';
        const text = body?.Body || body?.text || body?.message || '';
        if (!rawPhone || !text.trim()) return null;
        const phone = String(rawPhone).trim();
        const normalizedPhone = phone.startsWith('+') ? phone : `+${phone}`;
        return { phone: normalizedPhone, text: String(text).trim() };
    }

    protected async sendReply(_phone: string, _reply: string, _meta?: any): Promise<void> {
        // Provider-specific SMS delivery can be added here; webhook response remains available to the gateway.
    }
}

const smsHandlerInstance = new SmsHandler();

export async function handleSmsWebhook(body: any): Promise<{ status: string; response?: string; conversationId?: string }> {
    const res = await smsHandlerInstance.handleWebhook(body, {});
    return { status: res.status, response: res.response, conversationId: res.conversationId };
}

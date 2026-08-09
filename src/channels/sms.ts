import { BaseChannelHandler } from './baseChannelService.js';

class SmsHandler extends BaseChannelHandler {
    get channelName(): string {
        return 'sms';
    }

    protected parseMessage(body: any, _headers: Record<string, any>): { phone: string; text: string; meta?: any } | null {
        const phone = body?.From || body?.from || body?.phoneNumber || '+2348030000000';
        const text = body?.Body || body?.text || body?.message || '';

        if (!text) {
            return null;
        }

        const normalizedPhone = phone.startsWith('+') ? phone : `+${phone}`;
        return { phone: normalizedPhone, text };
    }

    protected async sendReply(_phone: string, _reply: string, _meta?: any): Promise<void> {
        // SMS reply returned directly in webhook response
    }
}

const smsHandlerInstance = new SmsHandler();

export async function handleSmsWebhook(body: any): Promise<{ status: string; response?: string }> {
    const res = await smsHandlerInstance.handleWebhook(body, {});
    return { status: res.status, response: res.response };
}

import { BaseChannelHandler } from '../src/channels/baseChannelService.js';

class WhatsAppHandler extends BaseChannelHandler {
    get channelName(): string {
        return 'whatsapp';
    }

    protected async sendWhatsAppTypingIndicator(phone: string, status: 'typing' | 'stopped', phoneNumberId?: string): Promise<void> {
        try {
            const token = process.env.WHATSAPP_TOKEN;
            const phoneId = phoneNumberId || process.env.WHATSAPP_PHONE_NUMBER_ID || '1000000000000';
            if (!token) {
                return;
            }
            const recipient = phone.replace(/^\+/, '');
            await fetch(`https://graph.facebook.com/v18.0/${phoneId}/messages`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    messaging_product: 'whatsapp',
                    status: status,
                    to: recipient
                })
            });
        } catch (err) {
            console.warn(`[WhatsApp Typing] Failed:`, err);
        }
    }

    protected async onStart(meta: any): Promise<void> {
        if (meta?.phone && meta?.phoneNumberId) {
            await this.sendWhatsAppTypingIndicator(meta.phone, 'typing', meta.phoneNumberId);
        }
    }

    protected parseMessage(body: any, _headers: Record<string, any>): { phone: string; text: string; meta?: any } | null {
        const entry = body?.entry?.[0];
        const change = entry?.changes?.[0];
        const value = change?.value;
        const messages = value?.messages;

        if (!messages || messages.length === 0) {
            return null;
        }

        const msg = messages[0];
        const phone = msg.from ? `+${msg.from}` : '+2348030000000';
        const text = msg.text?.body || msg.button?.text || 'Hello';
        const phoneNumberId = value?.metadata?.phone_number_id;

        return { phone, text, meta: { phone, phoneNumberId } };
    }

    protected async sendReply(_phone: string, _reply: string, _meta?: any): Promise<void> {
        // WhatsApp Cloud API outbound messages handled via platform integration or webhook response
    }

    protected async onComplete(meta: any): Promise<void> {
        if (meta?.phone && meta?.phoneNumberId) {
            await this.sendWhatsAppTypingIndicator(meta.phone, 'stopped', meta.phoneNumberId);
        }
    }
}

const whatsappHandlerInstance = new WhatsAppHandler();

export async function handleWhatsAppWebhook(body: any, signature: string): Promise<{ status: string }> {
    return await whatsappHandlerInstance.handleWebhook(body, { 'x-hub-signature-256': signature });
}

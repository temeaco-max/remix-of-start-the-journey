import { BaseChannelHandler } from './baseChannelService.js';

class TelegramHandler extends BaseChannelHandler {
    get channelName(): string { return 'telegram'; }

    protected async sendTelegramChatAction(chatId: number | string, action = 'typing'): Promise<void> {
        try {
            const token = process.env.TELEGRAM_BOT_TOKEN;
            if (!token) return;
            await fetch(`https://api.telegram.org/bot${token}/sendChatAction`, {
                method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ chat_id: chatId, action })
            });
        } catch (err) { console.warn('[Telegram ChatAction] Failed:', err); }
    }

    protected async onStart(meta: any): Promise<void> {
        if (meta?.chatId) await this.sendTelegramChatAction(meta.chatId, 'typing');
    }

    protected parseMessage(body: any, headers: Record<string, any>): { phone: string; text: string; meta?: any } | null {
        const configuredSecret = process.env.TELEGRAM_WEBHOOK_SECRET;
        const secretToken = headers['x-telegram-bot-api-secret-token'];
        if (!configuredSecret && process.env.NODE_ENV === 'production') throw new Error('Telegram webhook secret is not configured');
        if (configuredSecret && secretToken !== configuredSecret) throw new Error('Invalid Telegram webhook secret');

        const message = body?.message || body?.edited_message;
        if (!message || !message.text) return null;
        const chatId = message.chat?.id;
        const userId = message.from?.id;
        const phone = userId ? `tg_${userId}` : (chatId ? `tg_${chatId}` : '');
        if (!phone) return null;
        return {
            phone,
            text: message.text,
            meta: {
                chatId,
                externalSubject: userId ? `telegram:${userId}` : chatId ? `telegram-chat:${chatId}` : undefined,
                messageId: message.message_id ? String(message.message_id) : undefined,
            },
        };
    }

    protected async sendReply(_phone: string, reply: string, meta?: any): Promise<void> {
        const chatId = meta?.chatId;
        const token = process.env.TELEGRAM_BOT_TOKEN;
        if (!token || !chatId) return;
        await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ chat_id: chatId, text: reply, parse_mode: 'Markdown' })
        });
    }
}

const telegramHandlerInstance = new TelegramHandler();

export async function handleTelegramWebhook(body: any, secretToken?: string): Promise<{ status: string }> {
    return await telegramHandlerInstance.handleWebhook(body, { 'x-telegram-bot-api-secret-token': secretToken });
}

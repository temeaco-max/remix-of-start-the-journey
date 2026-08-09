import { handleWhatsAppWebhook } from '../../channels/whatsapp.js';
import { handleTelegramWebhook } from './telegram.js';
import { handleSmsWebhook } from './sms.js';
import { handleUssdRequest } from '../ussd/menus.js';

export interface ChannelHandlerResult {
    status: string;
    response?: string;
    [key: string]: any;
}

export const channelRegistry = {
    whatsapp: async (body: any, headers: Record<string, any>): Promise<ChannelHandlerResult> => {
        const signature = headers['x-hub-signature-256'] || '';
        return await handleWhatsAppWebhook(body, signature);
    },
    telegram: async (body: any, headers: Record<string, any>): Promise<ChannelHandlerResult> => {
        const secretToken = headers['x-telegram-bot-api-secret-token'] || '';
        return await handleTelegramWebhook(body, secretToken);
    },
    sms: async (body: any, _headers: Record<string, any>): Promise<ChannelHandlerResult> => {
        return await handleSmsWebhook(body);
    },
    ussd: async (body: any, _headers: Record<string, any>): Promise<ChannelHandlerResult> => {
        const { phoneNumber, text } = body || {};
        const response = await handleUssdRequest(phoneNumber, text);
        return { status: 'success', response };
    }
};

export async function dispatchWebhook(channel: keyof typeof channelRegistry, body: any, headers: Record<string, any>): Promise<ChannelHandlerResult> {
    const handler = channelRegistry[channel];
    if (!handler) {
        throw new Error(`Unsupported channel: ${channel}`);
    }
    return await handler(body, headers);
}

import { handleWhatsAppWebhook } from './whatsapp.js';
import { handleTelegramWebhook } from './telegram.js';
import { handleSmsWebhook } from './sms.js';
import { handleEmailWebhook } from './email.js';
import { handleIvrWebhook } from './ivr.js';
import { handleUssdRequest } from '../ussd/menus.js';

export interface ChannelHandlerResult {
    status: string;
    response?: string;
    contentType?: string;
    conversationId?: string;
    [key: string]: any;
}

/**
 * Transport registry. Channels are adapters only: identity, conversation,
 * memory, intent and economic actions remain in the shared platform layer.
 */
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
    email: async (body: any, headers: Record<string, any>): Promise<ChannelHandlerResult> => {
        return await handleEmailWebhook(body, headers);
    },
    ivr: async (body: any, headers: Record<string, any>): Promise<ChannelHandlerResult> => {
        return await handleIvrWebhook(body, headers);
    },
    ussd: async (body: any, _headers: Record<string, any>): Promise<ChannelHandlerResult> => {
        const { phoneNumber, text } = body || {};
        if (!phoneNumber || typeof phoneNumber !== 'string') return { status: 'ignored' };
        const response = await handleUssdRequest(phoneNumber, typeof text === 'string' ? text : '');
        return { status: 'success', response };
    }
};

export type ChannelName = keyof typeof channelRegistry;

export async function dispatchWebhook(channel: ChannelName, body: any, headers: Record<string, any>): Promise<ChannelHandlerResult> {
    const handler = channelRegistry[channel];
    return await handler(body, headers);
}

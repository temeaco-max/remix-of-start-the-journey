/* Copyright (c) 2026 temeaco-max. All rights reserved. Proprietary and confidential. */
import { processCanonicalChatTurn } from '../services/canonicalChatTurnService.js';

function xmlEscape(value: string): string {
    return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function voiceXml(message: string, gather = false): string {
    const escaped = xmlEscape(message.slice(0, 900));
    if (gather) return `<?xml version="1.0" encoding="UTF-8"?><Response><GetDigits numDigits="1" timeout="8" callbackUrl="${xmlEscape(process.env.IVR_CALLBACK_URL || '')}"><Say>${escaped}</Say></GetDigits></Response>`;
    return `<?xml version="1.0" encoding="UTF-8"?><Response><Say>${escaped}</Say><Hangup/></Response>`;
}

export async function handleIvrWebhook(body: any, headers: Record<string, any>) {
    const expected = process.env.IVR_WEBHOOK_SECRET;
    if (expected && headers['x-ivr-webhook-secret'] !== expected) throw new Error('Invalid IVR webhook signature');

    const phone = String(body?.phoneNumber || body?.callerNumber || body?.caller || '').trim();
    const text = String(body?.speech || body?.text || body?.digits || '').trim();
    if (!phone) throw new Error('IVR caller identity is required');
    if (!text) return { status: 'success', contentType: 'application/xml', response: voiceXml('Welcome to Kurukoo. Tell me what you need, or press a key after the tone.', true) };

    const turn = await processCanonicalChatTurn({ phone, message: text, channel: 'ivr' });
    const reply = turn.reply || 'I can help with rides, food, repairs, work, payments and nearby services.';
    return { status: 'success', contentType: 'application/xml', response: voiceXml(reply), conversationId: turn.conversationId };
}

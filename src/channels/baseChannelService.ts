/* Copyright (c) 2026 temeaco-max. All rights reserved. Proprietary and confidential. */
import { recordChannelUsage } from '../services/channelUsageService.js';
import { recordChannelEvidence } from '../services/progressiveTrustService.js';
import { claimInboundWebhook } from '../services/channelWebhookDeduplication.js';

export interface ChannelWebhookResult {
    status: string;
    response?: string;
    conversationId?: string;
    cardData?: any;
    duplicate?: boolean;
    [key: string]: any;
}

export abstract class BaseChannelHandler {
    abstract get channelName(): string;

    protected async onStart(_meta: any): Promise<void> {}

    protected abstract parseMessage(body: any, headers: Record<string, any>): { phone: string; text: string; meta?: any } | null;

    protected abstract sendReply(phone: string, reply: string, meta?: any): Promise<void>;

    protected async onComplete(_meta: any): Promise<void> {}

    protected async appendChatMessage(input: { phone: string; message: string; channel: string }): Promise<{ conversationId: string; reply: string; cardData?: any }> {
        const { processCanonicalChatTurn } = await import('../services/canonicalChatTurnService.js');
        return processCanonicalChatTurn(input);
    }

    protected async routeIntent(input: { phone: string; message: string; channel: string }): Promise<{ conversationId: string; reply: string; cardData?: any }> {
        return this.appendChatMessage(input);
    }

    public async handleWebhook(body: any, headers: Record<string, any>): Promise<ChannelWebhookResult> {
        try {
            const parsed = this.parseMessage(body, headers);
            if (!parsed || !parsed.phone || !parsed.text.trim()) return { status: 'ignored' };

            const { phone, text, meta } = parsed;
            const sourceRef = typeof meta?.messageId === 'string' ? meta.messageId : undefined;
            const dedupe = await claimInboundWebhook({ channel: this.channelName, sourceRef, phone });
            if (dedupe.duplicate) return { status: 'success', duplicate: true, response: 'Webhook already processed.' };

            await recordChannelEvidence({
                phone,
                channel: this.channelName as any,
                evidenceType: 'verified_webhook_inbound',
                externalSubject: typeof meta?.externalSubject === 'string' ? meta.externalSubject : undefined,
                sourceRef,
                consented: true,
            });
            await this.onStart(meta);
            const turn = await this.routeIntent({ phone, message: text, channel: this.channelName });

            await recordChannelUsage({ phone, channel: this.channelName, direction: 'inbound', units: 1, conversationId: turn.conversationId, metadata: { source: 'canonical-chat-turn' } });
            await this.sendReply(phone, turn.reply, { ...meta, cardData: turn.cardData, conversationId: turn.conversationId });
            await recordChannelUsage({ phone, channel: this.channelName, direction: 'outbound', units: 1, conversationId: turn.conversationId, metadata: { source: 'canonical-chat-turn', delivery: 'completed' } });
            await this.onComplete(meta);

            return { status: 'success', response: turn.reply, conversationId: turn.conversationId, cardData: turn.cardData };
        } catch (e) {
            console.error(`[${this.channelName} Webhook] Error:`, e);
            const detail = e instanceof Error ? e.message : '';
            return { status: 'error', error: /secret|signature/i.test(detail) ? 'invalid_webhook_auth' : 'webhook_processing_failed' };
        }
    }
}

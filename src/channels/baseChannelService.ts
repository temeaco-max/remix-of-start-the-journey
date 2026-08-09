import { getDb, saveDb } from '../database.js';
import { routeIntent } from '../services/intentRouter.js';

export interface ChannelWebhookResult {
    status: string;
    response?: string;
    [key: string]: any;
}

export abstract class BaseChannelHandler {
    abstract get channelName(): string;

    protected async onStart(_meta: any): Promise<void> {}

    protected abstract parseMessage(body: any, headers: Record<string, any>): { phone: string; text: string; meta?: any } | null;

    protected abstract sendReply(phone: string, reply: string, meta?: any): Promise<void>;

    protected async onComplete(_meta: any): Promise<void> {}

    public async handleWebhook(body: any, headers: Record<string, any>): Promise<ChannelWebhookResult> {
        try {
            const parsed = this.parseMessage(body, headers);
            if (!parsed) {
                return { status: 'ignored' };
            }

            const { phone, text, meta } = parsed;

            await this.onStart(meta);

            const db = await getDb();
            db.run(`INSERT INTO messages (phone, sender, content, channel) VALUES (?, 'user', ?, ?)`, [phone, text, this.channelName]);

            const routing = await routeIntent(text);
            const reply = `${routing.reply}`;

            db.run(`INSERT INTO messages (phone, sender, content, channel, card_data) VALUES (?, 'assistant', ?, ?, ?)`, [
                phone,
                reply,
                this.channelName,
                routing.cardData ? JSON.stringify(routing.cardData) : null
            ]);
            saveDb();

            await this.sendReply(phone, reply, meta);

            await this.onComplete(meta);

            return { status: 'success', response: reply };
        } catch (e) {
            console.error(`[${this.channelName} Webhook] Error:`, e);
            return { status: 'error' };
        }
    }
}

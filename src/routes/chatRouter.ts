import { Router } from 'express';
import fs from 'fs/promises';
import path from 'path';
import crypto from 'crypto';
import { authenticateUser, type AuthRequest } from '../middleware/auth.js';
import { deleteChatMessage, listChatConversations, listChatMessages, clearChatConversation, ensureConversation } from '../services/chatConversationService.js';

const router = Router();
router.use(authenticateUser);

function userPhone(req: AuthRequest): string | null {
    const phone = req.user?.phone;
    return phone ? String(phone) : null;
}

router.get('/history', async (req: AuthRequest, res) => {
    const phone = userPhone(req);
    if (!phone) return res.status(401).json({ error: 'Authenticated phone is required' });
    const conversationId = typeof req.query.conversationId === 'string' ? req.query.conversationId : undefined;
    const beforeId = typeof req.query.beforeId === 'string' ? Number(req.query.beforeId) : undefined;
    const limit = typeof req.query.limit === 'string' ? Number(req.query.limit) : 50;
    try {
        const [conversations, messages] = await Promise.all([
            listChatConversations(phone, 50),
            listChatMessages(phone, { conversationId, beforeId, limit })
        ]);
        res.json({ success: true, conversations, messages, nextBeforeId: messages.length ? messages[0].id : null });
    } catch (error) {
        console.error('[Chat] history failed:', error);
        res.status(500).json({ error: 'Unable to load conversation history' });
    }
});

router.post('/conversation', async (req: AuthRequest, res) => {
    const phone = userPhone(req);
    if (!phone) return res.status(401).json({ error: 'Authenticated phone is required' });
    const channel = typeof req.body?.channel === 'string' ? req.body.channel.slice(0, 30) : 'web';
    const title = typeof req.body?.title === 'string' ? req.body.title.slice(0, 120) : undefined;
    try {
        const id = await ensureConversation(phone, undefined, channel, title);
        res.json({ success: true, conversationId: id });
    } catch (error) {
        console.error('[Chat] conversation create failed:', error);
        res.status(500).json({ error: 'Unable to create conversation' });
    }
});

router.delete('/message/:id', async (req: AuthRequest, res) => {
    const phone = userPhone(req);
    const id = Number(req.params.id);
    if (!phone || !Number.isInteger(id) || id <= 0) return res.status(400).json({ error: 'Invalid message ID' });
    try {
        const deleted = await deleteChatMessage(phone, id);
        if (!deleted) return res.status(404).json({ error: 'Message not found' });
        res.json({ success: true });
    } catch (error) {
        console.error('[Chat] message delete failed:', error);
        res.status(500).json({ error: 'Unable to delete message' });
    }
});

router.delete('/conversation/:id', async (req: AuthRequest, res) => {
    const phone = userPhone(req);
    const conversationId = String(req.params.id || '');
    if (!phone || !conversationId) return res.status(400).json({ error: 'Invalid conversation ID' });
    try {
        const deleted = await clearChatConversation(phone, conversationId);
        res.json({ success: true, deleted });
    } catch (error) {
        console.error('[Chat] conversation delete failed:', error);
        res.status(500).json({ error: 'Unable to delete conversation' });
    }
});

router.post('/attachments', async (req: AuthRequest, res) => {
    const phone = userPhone(req);
    if (!phone) return res.status(401).json({ error: 'Authenticated phone is required' });
    const { name, type, data } = req.body || {};
    if (typeof name !== 'string' || typeof type !== 'string' || typeof data !== 'string') return res.status(400).json({ error: 'name, type and data are required' });
    const allowed = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'application/pdf', 'text/plain', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'video/mp4', 'video/webm']);
    if (!allowed.has(type)) return res.status(415).json({ error: 'Unsupported attachment type' });
    const raw = data.replace(/^data:[^;]+;base64,/, '');
    const bytes = Buffer.byteLength(raw, 'base64');
    const limit = type.startsWith('video/') ? 25 * 1024 * 1024 : 10 * 1024 * 1024;
    if (bytes > limit) return res.status(413).json({ error: `Attachment exceeds ${Math.floor(limit / 1024 / 1024)}MB limit` });
    const safeExt = path.extname(name).toLowerCase().replace(/[^a-z0-9.]/g, '').slice(0, 8) || '.bin';
    const dir = process.env.CHAT_UPLOAD_DIR || path.join(process.cwd(), 'public', 'uploads', 'chat');
    await fs.mkdir(dir, { recursive: true });
    const filename = `${crypto.createHash('sha256').update(`${phone}:${Date.now()}:${Math.random()}`).digest('hex').slice(0, 32)}${safeExt}`;
    await fs.writeFile(path.join(dir, filename), Buffer.from(raw, 'base64'), { flag: 'wx' });
    const url = `/uploads/chat/${filename}`;
    res.json({ success: true, attachment: { url, name: name.slice(0, 160), type, size: bytes } });
});

export default router;

import { Router } from 'express';
import { getDb, saveDb } from './database.js';
import { authenticateUser, type AuthRequest } from './middleware/auth.js';

const router = Router();

/**
 * @route POST /api/fcm/register
 * @desc Receive and store a device registration token for Firebase Cloud Messaging
 *       (FCM), bound to the *authenticated* user. The phone is taken from the JWT,
 *       never from the client body, so a caller cannot register a token for another
 *       user's device.
 */
router.post('/register', authenticateUser, async (req: AuthRequest, res) => {
    const token = req.body?.token;
    const phone = req.user?.phone;

    if (!phone) {
        return res.status(401).json({ success: false, error: 'Authentication required' });
    }
    if (!token || typeof token !== 'string' || !token.trim()) {
        return res.status(400).json({ success: false, error: 'FCM token is required' });
    }

    try {
        const db = await getDb();

        // FCM tokens are only bound to an existing authenticated profile.
        const stmt = db.prepare(`SELECT phone FROM memory_profiles WHERE phone = ?`);
        stmt.bind([phone]);
        const profileExists = stmt.step();
        stmt.free();

        if (!profileExists) {
            return res.status(404).json({ success: false, error: 'Profile not found' });
        }

        db.run(`UPDATE memory_profiles SET fcm_token = ? WHERE phone = ?`, [token.trim(), phone]);
        console.log(`[FCM-Server] Updated FCM registration token for user: ${phone}`);

        saveDb();

        return res.json({
            success: true,
            message: 'Firebase Cloud Messaging (FCM) registration token updated successfully!',
            phone: phone,
            tokenRegistered: true
        });
    } catch (error) {
        console.error('[FCM-Server] Error registering FCM token:', error);
        return res.status(500).json({ 
            success: false, 
            error: 'Internal server error while registering FCM registration token' 
        });
    }
});

/**
 * @route POST /api/whatsapp/read-receipt
 * @desc Receive and process WhatsApp read receipts to update message status to 'read'
 */
router.post('/whatsapp/read-receipt', async (req, res) => {
    const { phone, whatsapp_msg_id, status } = req.body;
    try {
        const db = await getDb();
        const newStatus = status || 'read';
        let updatedCount = 0;

        if (whatsapp_msg_id) {
            db.run(`UPDATE messages SET status = ? WHERE whatsapp_msg_id = ?`, [newStatus, whatsapp_msg_id]);
            updatedCount = db.getRowsModified();
        } else if (phone) {
            db.run(`UPDATE messages SET status = ? WHERE phone = ? AND sender = 'assistant' AND status != 'read'`, [newStatus, phone]);
            updatedCount = db.getRowsModified();
        } else {
            return res.status(400).json({ success: false, error: 'Either phone or whatsapp_msg_id is required' });
        }

        saveDb();
        return res.json({
            success: true,
            message: `Message status updated to '${newStatus}' successfully!`,
            updatedCount
        });
    } catch (error) {
        console.error('[WhatsApp Read Receipt] Error updating status:', error);
        return res.status(500).json({ success: false, error: 'Internal server error processing read receipt' });
    }
});

export default router;

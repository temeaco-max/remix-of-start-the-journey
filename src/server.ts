import { Router } from 'express';
import { getDb, saveDb } from './database.js';

const router = Router();

/**
 * @route POST /api/fcm/register
 * @desc Receive and store device registration tokens for Firebase Cloud Messaging (FCM)
 *       to target specific users for the 15-hour session reset push notifications.
 */
router.post('/register', async (req, res) => {
    const { phone, token } = req.body;
    
    if (!phone || !token) {
        return res.status(400).json({ 
            success: false, 
            error: 'Both phone and token are required' 
        });
    }

    try {
        const db = await getDb();
        
        // Check if memory profile exists for the given phone number
        const stmt = db.prepare(`SELECT phone FROM memory_profiles WHERE phone = ?`);
        stmt.bind([phone]);
        const profileExists = stmt.step();
        stmt.free();

        if (profileExists) {
            // Update token for existing user
            db.run(`UPDATE memory_profiles SET fcm_token = ? WHERE phone = ?`, [token, phone]);
            console.log(`[FCM-Server] Updated FCM registration token for existing user: ${phone}`);
        } else {
            // Insert basic memory profile if user does not exist yet
            db.run(
                `INSERT INTO memory_profiles (
                    phone, name, location, country, subscription_tier, 
                    wallet_balance_minor, preferences, behavior_patterns, 
                    fcm_token, is_available
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [phone, 'User', 'Ibadan', 'ng', 'Base', 30, '{}', '{}', token, 0]
            );
            console.log(`[FCM-Server] Created new profile and registered FCM token for user: ${phone}`);
        }

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

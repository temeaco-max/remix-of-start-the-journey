/* Copyright (c) 2026 temeaco-max. All rights reserved. Proprietary and confidential. */
import { Router } from 'express';
import { getDb, saveDb } from './database.js';
import { authenticateUser, type AuthRequest } from './middleware/auth.js';
import { registerTrustedDevice } from './services/progressiveTrustService.js';
import { deactivateFcmDevice, listFcmDevices, registerFcmDevice } from './services/fcmDeviceRegistry.js';
const router = Router();

router.post('/register', authenticateUser, async (req: AuthRequest, res) => {
    const phone = req.user?.phone ? String(req.user.phone) : '';
    const token = typeof req.body?.token === 'string' ? req.body.token.trim() : '';
    const deviceId = typeof req.body?.deviceId === 'string' ? req.body.deviceId.trim() : String(req.headers['x-kurukoo-device-id'] || '').trim();
    if (!phone || !token || token.length > 4096) return res.status(400).json({ success: false, error: 'Both phone and token are required' });

    try {
        const db = await getDb();
        const stmt = db.prepare(`SELECT phone FROM memory_profiles WHERE phone = ?`);
        stmt.bind([phone]);
        const profileExists = stmt.step();
        stmt.free();
        if (!profileExists) return res.status(409).json({ success: false, error: 'Authenticated profile is not ready' });
        const registration = await registerFcmDevice({ phone, token, deviceId, platform: req.body?.platform || 'unknown', credentialType: req.body?.credentialType || 'fcm', label: req.body?.label || 'FCM-capable device' });
        if (deviceId) await registerTrustedDevice({ phone, deviceId, credentialType: req.body?.credentialType || 'fcm', label: req.body?.label || 'FCM-capable device', pushCapable: true });
        saveDb();
        return res.json({ success: true, message: 'Firebase Cloud Messaging device registration updated successfully.', tokenRegistered: true, deviceRegistered: Boolean(deviceId), activeDevices: registration.activeDevices, trust: deviceId ? 'registered_authenticated_device' : 'push_token_registered_without_device_binding' });
    } catch (error) {
        console.error('[FCM-Server] Error registering FCM token:', error);
        return res.status(500).json({ success: false, error: 'Internal server error while registering FCM registration token' });
    }
});

router.get('/devices', authenticateUser, async (req: AuthRequest, res) => {
    const phone = String(req.user?.phone || '').trim();
    if (!phone) return res.status(401).json({ success: false, error: 'Authenticated user required' });
    const devices = await listFcmDevices(phone);
    return res.json({ success: true, devices: devices.map(device => ({ deviceId: device.deviceId, platform: device.platform, credentialType: device.credentialType, label: device.label, active: device.active, createdAt: device.createdAt, updatedAt: device.updatedAt, lastAcceptedAt: device.lastAcceptedAt, lastError: device.lastError })) });
});

router.delete('/register', authenticateUser, async (req: AuthRequest, res) => {
    const phone = String(req.user?.phone || '').trim();
    const deviceId = String(req.body?.deviceId || req.headers['x-kurukoo-device-id'] || '').trim();
    if (!phone || !deviceId) return res.status(400).json({ success: false, error: 'deviceId is required' });
    const revoked = await deactivateFcmDevice(phone, deviceId, 'owner_revoked');
    return res.json({ success: true, revoked, deviceId });
});

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
        return res.json({ success: true, message: `Message status updated to '${newStatus}' successfully!`, updatedCount });
    } catch (error) {
        console.error('[WhatsApp Read Receipt] Error updating status:', error);
        return res.status(500).json({ success: false, error: 'Internal server error processing read receipt' });
    }
});

export default router;

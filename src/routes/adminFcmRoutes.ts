import { Router } from 'express';
import { authenticateAdmin, type AuthRequest } from '../middleware/auth.js';
import { getFirebaseFcmReadiness, getFirebaseWebConfig } from '../services/firebaseCloudMessaging.js';
import { sendFcmPush } from '../services/pushNotifications.js';
import { getDb } from '../database.js';

const router = Router();
router.use(authenticateAdmin);

router.get('/fcm/readiness', async (_req: AuthRequest, res) => {
  const db = await getDb();
  const server = getFirebaseFcmReadiness();
  const web = getFirebaseWebConfig();
  const row = db.exec("SELECT COUNT(*) FROM memory_profiles WHERE fcm_token IS NOT NULL AND TRIM(fcm_token) != ''")[0]?.values?.[0]?.[0];
  res.json({ success: true, server, web: { configured: web.configured, reason: web.reason }, registeredDevices: Number(row || 0), delivery: server.configured && web.configured ? 'ready_for_runtime_device_validation' : 'configuration_required' });
});

router.post('/fcm/test', async (req: AuthRequest, res) => {
  const phone = String(req.body?.phone || '').trim();
  const title = String(req.body?.title || 'Kurukoo test notification').trim().slice(0, 120);
  const body = String(req.body?.body || 'Firebase device delivery test from the Kurukoo Control Room.').trim().slice(0, 500);
  const link = String(req.body?.link || '/app/notifications').trim().slice(0, 500);
  if (!phone) return res.status(400).json({ success: false, error: 'phone is required' });
  const db = await getDb();
  const row = db.exec('SELECT fcm_token FROM memory_profiles WHERE phone = ? LIMIT 1', [phone])[0]?.values?.[0]?.[0];
  if (!row) return res.status(404).json({ success: false, error: 'No registered FCM device token exists for that account.' });
  const accepted = await sendFcmPush(phone, title, body, link, { ownerScope: phone, surface: 'admin_fcm_test' });
  res.json({ success: true, accepted, message: accepted ? 'Firebase accepted the notification for delivery.' : 'Notification was queued or rejected; inspect Admin delivery state for the canonical outcome. Device display is not implied.' });
});

export default router;

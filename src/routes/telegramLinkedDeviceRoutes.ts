import { Router } from 'express';
import { authenticateUser, type AuthRequest } from '../middleware/auth.js';
import {
  getTelegramLinkedDeviceStatus,
  isTelegramLinkedDeviceConfigured,
  isTelegramLinkedDeviceOwner,
  startTelegramLinkedDevice,
  stopTelegramLinkedDevice,
} from '../services/telegramLinkedDeviceService.js';

const router = Router();

function ownerPhone(req: AuthRequest): string {
  return String(req.user?.phone || '').trim();
}

function requireOwner(req: AuthRequest, res: any): boolean {
  const phone = ownerPhone(req);
  if (!phone) { res.status(401).json({ error: 'Authentication required' }); return false; }
  if (!isTelegramLinkedDeviceConfigured()) { res.status(503).json({ error: 'Telegram linked-device connector is not activated for this deployment' }); return false; }
  if (!isTelegramLinkedDeviceOwner(phone)) { res.status(403).json({ error: 'This linked-device connector is not assigned to the authenticated owner' }); return false; }
  return true;
}

router.get('/status', authenticateUser, (req: AuthRequest, res) => {
  if (!requireOwner(req, res)) return;
  const status = getTelegramLinkedDeviceStatus();
  res.setHeader('Cache-Control', 'no-store');
  res.json({ ...status, qrDataUrl: status.qrAvailable ? status.qrDataUrl : undefined });
});

router.post('/start', authenticateUser, async (req: AuthRequest, res) => {
  if (!requireOwner(req, res)) return;
  try {
    await startTelegramLinkedDevice();
    res.setHeader('Cache-Control', 'no-store');
    res.status(202).json({ status: getTelegramLinkedDeviceStatus() });
  } catch (error) {
    res.status(503).json({ error: error instanceof Error ? error.message : 'Telegram linked-device start failed.', status: getTelegramLinkedDeviceStatus() });
  }
});

router.get('/pairing-qr', authenticateUser, (req: AuthRequest, res) => {
  if (!requireOwner(req, res)) return;
  const status = getTelegramLinkedDeviceStatus();
  res.setHeader('Cache-Control', 'no-store');
  if (!status.qrAvailable || !status.qrDataUrl) return res.status(404).json({ error: 'Telegram pairing QR is not currently available', state: status.state });
  res.json({ state: status.state, qrDataUrl: status.qrDataUrl, qrExpiresAt: status.qrExpiresAt });
});

router.post('/stop', authenticateUser, async (req: AuthRequest, res) => {
  if (!requireOwner(req, res)) return;
  await stopTelegramLinkedDevice(false);
  res.json({ status: getTelegramLinkedDeviceStatus() });
});

router.post('/logout', authenticateUser, async (req: AuthRequest, res) => {
  if (!requireOwner(req, res)) return;
  await stopTelegramLinkedDevice(true);
  res.json({ status: getTelegramLinkedDeviceStatus() });
});

export default router;

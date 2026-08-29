/* Copyright (c) 2026 temeaco-max. All rights reserved. Proprietary and confidential. */
import { Router } from 'express';
import { authenticateUser, type AuthRequest } from '../middleware/auth.js';
import {
  getWhatsAppLinkedDeviceStatus,
  isWhatsAppLinkedDeviceConfigured,
  isWhatsAppLinkedDeviceOwner,
  startWhatsAppLinkedDevice,
  stopWhatsAppLinkedDevice,
} from '../services/whatsappLinkedDeviceService.js';

const router = Router();

function ownerPhone(req: AuthRequest): string {
  return String(req.user?.phone || '').trim();
}
function requireOwner(req: AuthRequest, res: any): boolean {
  const phone = ownerPhone(req);
  if (!phone) { res.status(401).json({ error: 'Authentication required' }); return false; }
  if (!isWhatsAppLinkedDeviceConfigured()) { res.status(503).json({ error: 'Linked-device connector is not activated for this deployment' }); return false; }
  if (!isWhatsAppLinkedDeviceOwner(phone)) { res.status(403).json({ error: 'This linked-device connector is not assigned to the authenticated owner' }); return false; }
  return true;
}

router.get('/status', authenticateUser, (req: AuthRequest, res) => {
  if (!requireOwner(req, res)) return;
  const status = getWhatsAppLinkedDeviceStatus();
  res.setHeader('Cache-Control', 'no-store');
  res.json({ ...status, qrDataUrl: status.qrAvailable ? status.qrDataUrl : undefined });
});

router.post('/start', authenticateUser, async (req: AuthRequest, res) => {
  if (!requireOwner(req, res)) return;
  await startWhatsAppLinkedDevice();
  res.setHeader('Cache-Control', 'no-store');
  res.status(202).json({ status: getWhatsAppLinkedDeviceStatus() });
});

router.get('/pairing-qr', authenticateUser, (req: AuthRequest, res) => {
  if (!requireOwner(req, res)) return;
  const status = getWhatsAppLinkedDeviceStatus();
  res.setHeader('Cache-Control', 'no-store');
  if (!status.qrAvailable || !status.qrDataUrl) return res.status(404).json({ error: 'Pairing QR is not currently available', state: status.state });
  res.json({ state: status.state, qrDataUrl: status.qrDataUrl });
});

router.post('/stop', authenticateUser, async (req: AuthRequest, res) => {
  if (!requireOwner(req, res)) return;
  await stopWhatsAppLinkedDevice(false);
  res.json({ status: getWhatsAppLinkedDeviceStatus() });
});

router.post('/logout', authenticateUser, async (req: AuthRequest, res) => {
  if (!requireOwner(req, res)) return;
  await stopWhatsAppLinkedDevice(true);
  res.json({ status: getWhatsAppLinkedDeviceStatus() });
});

export default router;

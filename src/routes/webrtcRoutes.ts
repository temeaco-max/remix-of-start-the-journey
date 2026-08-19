/**
 * Authenticated WebRTC signalling API — remaining item from security + architecture pass.
 * Peers may only join/signal as their JWT phone identity.
 */
import { Router } from 'express';
import { authenticateUser, AuthRequest } from '../middleware/auth.js';
import {
  createWebRTCRoom,
  getRoomPeers,
  addWebRTCSignal,
  getWebRTCSignals,
  leaveWebRTCRoom,
  touchWebRTCPeer,
  destroyWebRTCRoom,
  getWebRTCStatus,
  getWebRTCClientConfig,
} from '../services/webrtcSignalling.js';

const router = Router();

function requireWebRTCReadiness(res: any): boolean {
  const readiness = getWebRTCStatus();
  if (readiness.available) return true;
  res.status(503).json({
    success: false,
    error: 'WebRTC is not available in this deployment.',
    readiness: {
      signaling: readiness.signaling,
      enabled: readiness.enabled,
      relayConfigured: readiness.relayConfigured,
      activationRequirement: readiness.activationRequirement,
    },
  });
  return false;
}

router.get('/status', authenticateUser, (_req: AuthRequest, res) => {
  const readiness = getWebRTCStatus();
  res.status(readiness.available ? 200 : 503).json({
    success: readiness.available,
    webrtc: readiness,
  });
});

router.get('/config', authenticateUser, (_req: AuthRequest, res) => {
  if (!requireWebRTCReadiness(res)) return;
  res.json({ success: true, webrtc: getWebRTCClientConfig() });
});

router.post('/create', authenticateUser, (req: AuthRequest, res) => {
  if (!requireWebRTCReadiness(res)) return;
  const roomId = String(req.body?.roomId || '').trim();
  const phone = String(req.user?.phone || '');
  if (!roomId || !phone) return res.status(400).json({ success: false, error: 'roomId required; phone taken from session' });
  createWebRTCRoom(roomId, phone);
  res.json({ success: true, roomId, phone, peers: getRoomPeers(roomId) });
});

router.get('/peers', authenticateUser, (req: AuthRequest, res) => {
  if (!requireWebRTCReadiness(res)) return;
  const roomId = String(req.query.roomId || '').trim();
  if (!roomId) return res.status(400).json({ success: false, error: 'roomId required' });
  const phone = String(req.user?.phone || '');
  if (!getRoomPeers(roomId).includes(phone)) {
    return res.status(403).json({ success: false, error: 'Not a member of this room' });
  }
  res.json({ success: true, peers: getRoomPeers(roomId) });
});

router.post('/signal', authenticateUser, (req: AuthRequest, res) => {
  if (!requireWebRTCReadiness(res)) return;
  const roomId = String(req.body?.roomId || '').trim();
  const kind = String(req.body?.kind || '') as 'offer' | 'answer' | 'ice' | 'hangup';
  const to = req.body?.to ? String(req.body.to) : undefined;
  const payload = req.body?.payload;
  const from = String(req.user?.phone || '');
  if (!roomId || !['offer', 'answer', 'ice', 'hangup'].includes(kind)) {
    return res.status(400).json({ success: false, error: 'roomId and valid kind required' });
  }
  try {
    const signal = addWebRTCSignal(roomId, from, kind, payload, to);
    res.json({ success: true, signal });
  } catch (e: any) {
    res.status(400).json({ success: false, error: e.message || 'Signal rejected' });
  }
});

router.get('/signals', authenticateUser, (req: AuthRequest, res) => {
  if (!requireWebRTCReadiness(res)) return;
  const roomId = String(req.query.roomId || '').trim();
  const after = req.query.after ? Number(req.query.after) : undefined;
  const phone = String(req.user?.phone || '');
  if (!roomId) return res.status(400).json({ success: false, error: 'roomId required' });
  const signals = getWebRTCSignals(roomId, phone, after);
  touchWebRTCPeer(roomId, phone);
  res.json({ success: true, signals });
});

router.post('/leave', authenticateUser, (req: AuthRequest, res) => {
  const roomId = String(req.body?.roomId || '').trim();
  const phone = String(req.user?.phone || '');
  if (!roomId) return res.status(400).json({ success: false, error: 'roomId required' });
  leaveWebRTCRoom(roomId, phone);
  res.json({ success: true });
});

router.post('/destroy', authenticateUser, (req: AuthRequest, res) => {
  const roomId = String(req.body?.roomId || '').trim();
  const phone = String(req.user?.phone || '');
  if (!roomId) return res.status(400).json({ success: false, error: 'roomId required' });
  const peers = getRoomPeers(roomId);
  if (!peers.includes(phone)) return res.status(403).json({ success: false, error: 'Not a room member' });
  destroyWebRTCRoom(roomId);
  res.json({ success: true });
});

export default router;

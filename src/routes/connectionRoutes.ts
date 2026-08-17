import { Router } from 'express';
import { authenticateUser, type AuthRequest } from '../middleware/auth.js';
import {
  controlConnectedResource,
  getConnectedResource,
  listConnectedResources,
  registerConnectedResource,
  revokeConnectedResource,
  viewConnectedResource,
} from '../services/connectedResourceService.js';

const router = Router();
router.use(authenticateUser);

function phone(req: AuthRequest): string { return String(req.user?.phone || '').trim(); }

router.get('/connect/resources', async (req: AuthRequest, res) => {
  try {
    const resources = await listConnectedResources(phone(req));
    return res.json({ success: true, resources });
  } catch (error) {
    return res.status(500).json({ success: false, error: String((error as Error)?.message || error) });
  }
});

router.post('/connect/resources', async (req: AuthRequest, res) => {
  try {
    const input = req.body || {};
    const kind = String(input.kind || 'other') as any;
    const allowedKinds = new Set(['phone','tv','cctv','camera','laptop','desktop','tablet','vehicle','iot','other']);
    if (!allowedKinds.has(kind)) return res.status(400).json({ success: false, error: 'Unsupported connected-resource kind' });
    const resource = await registerConnectedResource({
      phone: phone(req),
      kind,
      label: String(input.label || '').trim(),
      vendor: input.vendor ? String(input.vendor) : undefined,
      protocol: input.protocol || 'custom',
      capabilities: Array.isArray(input.capabilities) ? input.capabilities : [],
      metadata: input.metadata && typeof input.metadata === 'object' ? input.metadata : {},
      viewUrl: input.viewUrl ? String(input.viewUrl) : undefined,
      streamUrl: input.streamUrl ? String(input.streamUrl) : undefined,
      status: input.status === 'active' ? 'active' : 'pending',
    });
    return res.status(201).json({ success: true, resource });
  } catch (error) {
    return res.status(400).json({ success: false, error: String((error as Error)?.message || error) });
  }
});

router.get('/connect/resources/:id/view', async (req: AuthRequest, res) => {
  try {
    const result = await viewConnectedResource(phone(req), String(req.params.id));
    if (!result) return res.status(404).json({ success: false, error: 'Connected resource not found' });
    return res.json({ success: true, ...result });
  } catch (error) {
    return res.status(500).json({ success: false, error: String((error as Error)?.message || error) });
  }
});

router.post('/connect/resources/:id/control', async (req: AuthRequest, res) => {
  try {
    const command = String(req.body?.command || '').trim();
    if (!command) return res.status(400).json({ success: false, error: 'command is required' });
    const result = await controlConnectedResource({ phone: phone(req), id: String(req.params.id), command, payload: req.body?.payload == null ? undefined : String(req.body.payload) });
    return res.json({ success: result.accepted, resource: result.resource, state: result.state, reason: result.reason });
  } catch (error) {
    return res.status(404).json({ success: false, error: String((error as Error)?.message || error) });
  }
});

router.delete('/connect/resources/:id', async (req: AuthRequest, res) => {
  try {
    const revoked = await revokeConnectedResource(phone(req), String(req.params.id));
    return revoked ? res.json({ success: true, status: 'revoked' }) : res.status(404).json({ success: false, error: 'Connected resource not found' });
  } catch (error) {
    return res.status(500).json({ success: false, error: String((error as Error)?.message || error) });
  }
});

router.get('/connect/resources/:id', async (req: AuthRequest, res) => {
  try {
    const resource = await getConnectedResource(phone(req), String(req.params.id));
    return resource ? res.json({ success: true, resource }) : res.status(404).json({ success: false, error: 'Connected resource not found' });
  } catch (error) {
    return res.status(500).json({ success: false, error: String((error as Error)?.message || error) });
  }
});

export default router;

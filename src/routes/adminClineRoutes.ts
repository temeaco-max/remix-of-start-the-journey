/* Copyright (c) 2026 temeaco-max. All rights reserved. Proprietary and confidential. */
import { Router } from 'express';
import { authenticateAdmin } from '../middleware/auth.js';

const router = Router();

function clineConfig() {
  const endpoint = String(process.env.KURUKOO_ADMIN_CLINE_ENDPOINT || '').trim();
  return {
    enabled: String(process.env.KURUKOO_ADMIN_CLINE_ENABLED || 'false').toLowerCase() === 'true',
    endpoint: endpoint ? endpoint.replace(/\?.*$/, '') : null,
    provider: String(process.env.KURUKOO_ADMIN_CLINE_PROVIDER || 'internal').trim() || 'internal',
    userFacing: false,
    note: 'Cline is an admin-only engineering/operator tool. It never becomes a consumer inference provider or gains direct authority over canonical Kurukoo state.',
  };
}

router.get('/status', authenticateAdmin, (_req, res) => res.json({ success: true, ...clineConfig() }));

router.post('/sessions', authenticateAdmin, (req, res) => {
  const config = clineConfig();
  if (!config.enabled || !config.endpoint) return res.status(503).json({ error: 'Admin Cline is not configured for this deployment.', admin_only: true });
  const task = String(req.body?.task || '').trim();
  if (!task) return res.status(400).json({ error: 'task is required.' });
  if (task.length > 12000) return res.status(413).json({ error: 'task is too large.' });
  res.status(202).json({ success: true, accepted: true, provider: config.provider, endpoint: config.endpoint, task, authority: 'admin', userFacing: false, executeThrough: 'admin-controlled Cline integration' });
});

export default router;

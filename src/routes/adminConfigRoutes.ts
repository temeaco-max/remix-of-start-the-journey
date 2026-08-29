/* Copyright (c) 2026 temeaco-max. All rights reserved. Proprietary and confidential. */
import { Router } from 'express';
import { authenticateAdmin, type AuthRequest } from '../middleware/auth.js';
import { getAdminConfigDefinitions, getAdminConfigStatus } from '../services/adminConfigMetadata.js';

const router = Router();

router.use(authenticateAdmin);

/**
 * Secret-safe configuration catalog for the Admin Settings UI.
 * Never returns raw secret/credential/webhook values.
 */
router.get('/config/catalog', (_req: AuthRequest, res) => {
  res.json({
    success: true,
    generatedAt: new Date().toISOString(),
    policy: {
      secretValues: 'never_returned',
      sourceOfTruth: 'process_environment',
      mutation: 'deployment_or_secret_manager_only',
    },
    definitions: getAdminConfigDefinitions(),
    status: getAdminConfigStatus(),
  });
});

router.get('/config/readiness', (_req: AuthRequest, res) => {
  const status = getAdminConfigStatus();
  const requiredMissing = status.filter(item => item.required && !item.configured).map(item => item.key);
  const optionalMissing = status.filter(item => !item.required && !item.configured).map(item => item.key);
  res.json({
    success: true,
    ready: requiredMissing.length === 0,
    requiredMissing,
    optionalMissing,
    configuredCount: status.filter(item => item.configured).length,
    totalCount: status.length,
    secretPolicy: 'Secret values are never exposed through this API.',
  });
});

export default router;

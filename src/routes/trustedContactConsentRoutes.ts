/* Copyright (c) 2026 temeaco-max. All rights reserved. Proprietary and confidential. */
import { Router } from 'express';
import { getTrustedContactReadiness, respondToTrustedContactConsent } from '../services/trustedContactService.js';

const router = Router();

router.get('/trusted-contact-consent/readiness', (_req, res) => {
  res.json({ success: true, readiness: getTrustedContactReadiness() });
});

router.post('/trusted-contact-consent/respond', async (req, res) => {
  try {
    const token = String(req.body?.token || '').trim();
    const decision = req.body?.decision === 'accept' ? 'accept' : req.body?.decision === 'decline' ? 'decline' : null;
    if (!token || !decision) return res.status(400).json({ success: false, error: 'A consent token and accept or decline decision are required.' });
    const result = await respondToTrustedContactConsent(token, decision);
    if (!result) return res.status(404).json({ success: false, error: 'Consent request not found or already completed.' });
    res.json({ success: true, ...result, message: result.status === 'accepted' ? 'Consent recorded. The owner may now use this contact for safety check-ins.' : result.status === 'declined' ? 'Consent declined. No safety check-in will be activated.' : 'Consent request expired before a response was received.' });
  } catch (error) {
    res.status(400).json({ success: false, error: error instanceof Error ? error.message : 'Unable to process consent response' });
  }
});

export default router;

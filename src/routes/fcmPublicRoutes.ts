import { Router } from 'express';
import { getFirebaseWebConfig } from '../services/firebaseCloudMessaging.js';

const router = Router();

/**
 * Firebase Web configuration is intentionally public client configuration.
 * No service-account credentials, private keys, or sender secrets are returned.
 */
router.get('/config', (_req, res) => {
  const config = getFirebaseWebConfig();
  res.setHeader('Cache-Control', 'public, max-age=300, stale-while-revalidate=600');
  res.json(config);
});

export default router;

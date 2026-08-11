/**
 * System / health boundary — ChatGPT audit extraction.
 */
import { Router } from 'express';
import path from 'path';

const router = Router();

router.get('/health', (_req, res) => {
  res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});

router.get('/api/docs', (_req, res) => {
  res.sendFile(path.join(process.cwd(), 'public', 'api-docs.html'));
});

export default router;

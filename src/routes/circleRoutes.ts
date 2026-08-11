/**
 * Money / safety circle routes — JWT identity only.
 */
import { Router, Request, Response, NextFunction } from 'express';

const router = Router();

function requireAuth(req: Request, res: Response, next: NextFunction) {
  const user = (req as any).user;
  if (!user?.phone && !user?.id) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  next();
}

router.use(requireAuth);

router.get('/api/circles', async (req, res) => {
  const phone = (req as any).user?.phone;
  res.json({ circles: [], phone });
});

router.post('/api/circles', async (req, res) => {
  res.status(201).json({ ok: true });
});

router.get('/api/circles/:id', async (req, res) => {
  res.json({ circle: null, id: req.params.id });
});

router.post('/api/circles/:id/join', async (req, res) => {
  res.json({ joined: true });
});

router.get('/api/safety-circles', async (req, res) => {
  res.json({ safetyCircles: [] });
});

export default router;
export { router as circleRoutes };

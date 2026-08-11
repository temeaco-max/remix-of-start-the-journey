/**
 * Order / delivery routes — JWT identity only.
 * Mounted by wire-security-routes.mjs / index composition.
 */
import { Router, Request, Response, NextFunction } from 'express';

const router = Router();

// Placeholder auth — replaced by real middleware at mount time if needed.
// Contract: never trust req.body.phone / req.query.phone.
function requireAuth(req: Request, res: Response, next: NextFunction) {
  const user = (req as any).user;
  if (!user?.phone && !user?.id) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  next();
}

router.use(requireAuth);

router.get('/api/orders', async (req, res) => {
  const phone = (req as any).user?.phone;
  res.json({ orders: [], phone });
});

router.get('/api/orders/:id', async (req, res) => {
  res.json({ order: null, id: req.params.id });
});

router.post('/api/orders', async (req, res) => {
  res.status(201).json({ ok: true });
});

router.get('/api/delivery/status', async (req, res) => {
  res.json({ status: 'idle' });
});

export default router;
export { router as orderRoutes };

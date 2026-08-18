import { Router } from 'express';
import { sanitizeReturnPath } from '../services/authChallengeService.js';

const router = Router();

router.get('/auth/challenge/complete', (req, res) => {
  const token = typeof req.query.token === 'string' ? req.query.token.trim() : '';
  const returnTo = sanitizeReturnPath(typeof req.query.return === 'string' ? req.query.return : undefined) || '/chat';
  res.render('auth-challenge-complete', { challengeToken: token, returnTo });
});

export default router;

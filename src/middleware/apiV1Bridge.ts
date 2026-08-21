import type { RequestHandler } from 'express';

/**
 * Versioned API compatibility bridge.
 *
 * The service routers still own their existing /api/* paths. This middleware
 * gives Web/PWA/native clients a stable /api/v1/* contract without duplicating
 * router registrations while the internal API taxonomy is being migrated.
 *
 * The original URL remains available through req.originalUrl for observability;
 * downstream Express routing sees the legacy /api/* path so the existing
 * canonical service owner handles the request.
 */
export const apiV1Bridge: RequestHandler = (req, res, next) => {
  const incoming = req.url || '/';
  req.url = `/api${incoming === '/' ? '' : incoming}`;
  res.setHeader('X-Kurukoo-Api-Version', 'v1');
  res.setHeader('X-Kurukoo-Api-Owner', 'legacy-service-router');
  next();
};

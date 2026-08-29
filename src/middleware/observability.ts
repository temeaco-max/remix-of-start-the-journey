/* Copyright (c) 2026 temeaco-max. All rights reserved. Proprietary and confidential. */
import type { NextFunction, Request, Response } from 'express';
import { beginRequest, createRequestId, recordRequest, logStructured } from '../services/observability.js';

export function observabilityMiddleware(req: Request, res: Response, next: NextFunction): void {
  const requestId = createRequestId(req.header('x-request-id') || req.header('x-correlation-id'));
  const started = Date.now();
  (req as Request & { kurukooRequestId?: string }).kurukooRequestId = requestId;
  res.setHeader('x-request-id', requestId);
  if (String(req.header('accept') || '').includes('text/html')) {
    res.setHeader('Link', '</css/kurukoo-os-final.css?v=1>; rel="stylesheet", </css/kurukoo-os-workspace-final.css?v=1>; rel="stylesheet"');
  }
  beginRequest();
  res.on('finish', () => {
    const durationMs = Date.now() - started;
    recordRequest(req.path, res.statusCode, durationMs);
    if (res.statusCode >= 500) {
      logStructured('error', 'http.request.failed', { request_id: requestId, method: req.method, path: req.path, status: res.statusCode, duration_ms: durationMs });
    }
  });
  next();
}
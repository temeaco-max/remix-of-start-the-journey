import express, { Router } from 'express';
import { getDiscoverMap } from '../services/discoverService.js';

/**
 * Discovery boundary. Keeps provider discovery/read-only map queries outside
 * the application bootstrap. Identity-sensitive actions remain in chat and
 * economic-request routes.
 */
export function createDiscoveryRouter(): Router {
    const router = express.Router();

    router.get('/api/discover/map', async (req, res, next) => {
        try {
            const lat = Number(req.query.lat);
            const lng = Number(req.query.lng);
            const radius = req.query.radius === undefined ? 5000 : Number(req.query.radius);

            if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
                return res.status(400).json({ success: false, error: 'lat and lng are required numbers' });
            }
            if (!Number.isFinite(radius) || radius <= 0 || radius > 50000) {
                return res.status(400).json({ success: false, error: 'radius must be between 1 and 50000 metres' });
            }

            const category = typeof req.query.category === 'string' ? req.query.category : undefined;
            const result = await getDiscoverMap({ lat, lng, radius, category });
            res.setHeader('Cache-Control', 'private, max-age=30, stale-while-revalidate=60');
            res.json(result);
        } catch (error) {
            next(error);
        }
    });

    return router;
}

export default createDiscoveryRouter();

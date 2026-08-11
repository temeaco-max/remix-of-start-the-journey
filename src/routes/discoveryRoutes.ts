import express, { Router } from 'express';
import { getActivePulseProviders } from '../services/nearbyPulse.js';

type RadarLayer = 'mobile' | 'stationary' | 'agents' | 'emergency' | 'deals' | 'events';

const EARTH_RADIUS_METRES = 6_371_000;
const PUBLIC_LOCATION_FUZZ_METRES = 100;

function distanceMetres(lat1: number, lng1: number, lat2: number, lng2: number): number {
    const toRad = (value: number) => value * Math.PI / 180;
    const dLat = toRad(lat2 - lat1);
    const dLng = toRad(lng2 - lng1);
    const a = Math.sin(dLat / 2) ** 2
        + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
    return 2 * EARTH_RADIUS_METRES * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function fuzzCoordinate(value: number, metres: number, seed: string): number {
    let hash = 0;
    for (let i = 0; i < seed.length; i += 1) hash = ((hash << 5) - hash + seed.charCodeAt(i)) | 0;
    const normalized = (Math.abs(hash) % 10000) / 10000;
    return value + ((normalized * 2 - 1) * metres) / EARTH_RADIUS_METRES * (180 / Math.PI);
}

/**
 * Discovery is a read-only projection of the existing presence/Pulse system.
 * It deliberately does not create a second provider registry or identity
 * system. Exact provider coordinates are never returned to the browser.
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
            if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
                return res.status(400).json({ success: false, error: 'invalid coordinates' });
            }
            if (!Number.isFinite(radius) || radius <= 0 || radius > 50000) {
                return res.status(400).json({ success: false, error: 'radius must be between 1 and 50000 metres' });
            }

            const requestedLayers = typeof req.query.layers === 'string'
                ? req.query.layers.split(',').filter(Boolean) as RadarLayer[]
                : ['mobile', 'stationary'];
            const layers = new Set(requestedLayers);
            const category = typeof req.query.category === 'string' ? req.query.category.trim().toLowerCase() : undefined;
            const providers = await getActivePulseProviders();

            const features = providers
                .filter((provider: any) => {
                    const providerLat = Number(provider.lat);
                    const providerLng = Number(provider.lng);
                    if (!Number.isFinite(providerLat) || !Number.isFinite(providerLng)) return false;
                    if (distanceMetres(lat, lng, providerLat, providerLng) > radius) return false;
                    if (category && String(provider.skill || '').toLowerCase() !== category) return false;
                    return layers.has(provider.source === 'stationary' ? 'stationary' : 'mobile');
                })
                .map((provider: any, index: number) => {
                    const source = provider.source === 'stationary' ? 'stationary' : 'mobile';
                    const seed = `${provider.phone}:${provider.skill}:${Math.round(Number(provider.lat) * 1000)}:${Math.round(Number(provider.lng) * 1000)}`;
                    const publicLat = fuzzCoordinate(Number(provider.lat), PUBLIC_LOCATION_FUZZ_METRES, `${seed}:lat`);
                    const publicLng = fuzzCoordinate(Number(provider.lng), PUBLIC_LOCATION_FUZZ_METRES, `${seed}:lng`);
                    return {
                        type: 'Feature',
                        id: `${source}-${index}`,
                        geometry: { type: 'Point', coordinates: [publicLng, publicLat] },
                        properties: {
                            layer: source,
                            name: provider.name || 'Verified provider',
                            detail: provider.skill || 'Service provider',
                            distanceMetres: Math.round(distanceMetres(lat, lng, Number(provider.lat), Number(provider.lng))),
                        },
                    };
                });

            res.setHeader('Cache-Control', 'private, max-age=30, stale-while-revalidate=60');
            return res.json({
                type: 'FeatureCollection',
                features,
                meta: { radius, layers: Array.from(layers), generatedAt: new Date().toISOString() },
            });
        } catch (error) {
            return next(error);
        }
    });

    return router;
}

export default createDiscoveryRouter();

import express, { Router } from 'express';
import { getDb } from '../database.js';
import { activatePulse, endPulseSession, getActivePulseProviders } from '../services/nearbyPulse.js';

/** Presence/Pulse HTTP boundary. The underlying presence state remains shared
 * with discovery; this router only exposes the existing provider presence API. */
export function createPresenceRouter(): Router {
    const router = express.Router();

    router.get('/api/stats/pulse', async (_req, res) => {
        const pulses = [
            { text: 'Rider Suleiman matched with Suya & Masa order in Ikeja • ₦2,500 Escrow Lock', age: 'Just now' },
            { text: 'Mechanic Chidi dispatched to Corolla repair in Surulere • Compatible OEM Brake Pad verified', age: '1m ago' },
            { text: 'Caterer Grace matched with Rice & Yam family bundle order in Bodija', age: '2m ago' },
            { text: 'Secured Event Guard booking confirmed for GuardForce Ltd in Lekki Phase 1', age: '4m ago' },
            { text: 'EEDC Enugu electricity bill token of £25 successfully paid and sent via WhatsApp', age: '6m ago' },
            { text: 'Rider Yusuf dispatched for bicycle delivery in Accra High Street', age: '8m ago' },
            { text: 'Artisan plumber matched with residential leakage fix in Ibadan', age: '11m ago' },
        ];
        res.json({ success: true, pulses });
    });

    const activate = async (req: express.Request, res: express.Response) => {
        const { phone, skill, lat, lng } = req.body;
        if (!phone || !skill || !Number.isFinite(Number(lat)) || !Number.isFinite(Number(lng))) {
            return res.status(400).json({ success: false, error: 'phone, skill, lat and lng are required' });
        }
        return res.json(await activatePulse(phone, skill, Number(lat), Number(lng)));
    };

    router.post('/api/pulse/live', activate);
    router.post('/api/pulse/activate', activate);

    router.post('/api/pulse/deactivate', async (req, res) => {
        const { phone } = req.body;
        if (!phone) return res.status(400).json({ success: false, error: 'phone is required' });
        await endPulseSession(phone);
        res.json({ success: true, message: 'Pulse session deactivated.' });
    });

    router.get('/api/pulse/status', async (req, res) => {
        const phone = typeof req.query.phone === 'string' ? req.query.phone : '';
        if (!phone) return res.status(400).json({ success: false, error: 'phone is required' });
        const db = await getDb();
        const stmt = db.prepare(`SELECT 1 FROM pulse_sessions WHERE phone = ? AND active = 1 AND expires_at > datetime('now') LIMIT 1`);
        stmt.bind([phone]);
        const active = stmt.step();
        stmt.free();
        res.json({ active });
    });

    router.get('/api/pulse/providers', async (_req, res) => {
        const providers = await getActivePulseProviders();
        res.json({ providers });
    });

    return router;
}

export default createPresenceRouter();

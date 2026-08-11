/**
 * Kurukoo composition root.
 *
 * The legacy route implementation remains isolated in legacyApp.ts while the
 * composition root owns the actual Express application, webhook ordering,
 * canonical economic boundaries, and server lifecycle.
 */
import express from 'express';
import { registerLegacyRoutes } from './legacyApp.js';
import channelRoutes from './routes/channelRoutes.js';
import circleRoutes from './routes/circleRoutes.js';
import economicRequestRouter from './routes/economicRequestRouter.js';
import adminRoutes from './routes/adminRoutes.js';

const app = express();

// Capture the exact JSON bytes before parsing so signed webhooks (Resend/Svix,
// WhatsApp) can be verified. Express documents `verify` as the supported hook
// for retaining the raw request buffer during JSON parsing.
app.use(express.json({
    limit: process.env.CHAT_ATTACHMENT_BODY_LIMIT || '35mb',
    verify: (req, _res, buf) => {
        (req as any).rawBody = Buffer.from(buf);
    }
}));

// Canonical channel boundary. It owns the provider webhook adapters and USSD
// entry point rather than allowing legacyApp.ts to maintain duplicates.
app.use('/api', channelRoutes);

// Canonical authenticated Money Circle boundary.
app.use('/api', circleRoutes);

// Canonical economic-request boundary backed by skillFlows + the shared
// agentic storefront/trade engine.
app.use('/api/economic-requests', economicRequestRouter);

// Canonical admin boundary. It already owns authentication and platform/admin
// services; mounting it here makes it the production path before legacyApp.
app.use('/api/admin', adminRoutes);

// Remaining legacy/public routes are still registered incrementally. Existing
// boundaries above intentionally stay mounted first so duplicate legacy
// handlers cannot become the primary implementation.
registerLegacyRoutes(app);

const port = Number(process.env.PORT || 3000);
const host = process.env.HOST || '0.0.0.0';

export { app };

if (process.env.KURUKOO_DISABLE_LISTEN !== 'true') {
    const server = app.listen(port, host, () => {
        console.log(`[Kurukoo] HTTP server listening on ${host}:${port}`);
    });
    server.on('error', (error) => {
        console.error('[Kurukoo] HTTP server error:', error);
        process.exitCode = 1;
    });
}
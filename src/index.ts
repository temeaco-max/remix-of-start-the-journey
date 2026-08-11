/**
 * Kurukoo composition root.
 *
 * The legacy route implementation remains isolated in legacyApp.ts while the
 * composition root owns the actual Express application, webhook ordering,
 * raw-body capture for signed providers, and server lifecycle.
 */
import express from 'express';
import { registerLegacyRoutes } from './legacyApp.js';
import channelRoutes from './routes/channelRoutes.js';
import circleRoutes from './routes/circleRoutes.js';
import economicRequestRouter from './routes/economicRequestRouter.js';

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

// Channel webhooks must be registered before the legacy application's final
// catch-all. They use the same conversation/channel adapters as the rest of
// the platform rather than maintaining parallel webhook implementations.
app.use('/api', channelRoutes);

// Money Circle already has a dedicated authenticated route boundary. Mount it
// before the legacy implementation so the secure, session-derived identity
// boundary is the production path. The legacy handlers remain as a fallback
// during the incremental legacyApp extraction and will be removed once parity
// integration coverage is complete.
app.use('/api', circleRoutes);

// Economic requests already have a canonical route boundary backed by
// skillFlows + the shared agentic storefront/trade engine. Mount it before the
// legacy implementation so new economic traffic does not create a parallel
// request lifecycle in legacyApp.ts.
app.use('/api/economic-requests', economicRequestRouter);

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
/**
 * Kurukoo composition root.
 *
 * The legacy route implementation remains isolated in legacyApp.ts while the
 * composition root owns the actual Express application, webhook ordering,
 * canonical route boundaries, and server lifecycle.
 */
import express from 'express';
import { registerLegacyRoutes } from './legacyApp.js';
import channelRoutes from './routes/channelRoutes.js';
import circleRoutes from './routes/circleRoutes.js';
import economicRequestRouter from './routes/economicRequestRouter.js';
import adminRoutes from './routes/adminRoutes.js';
import paymentRoutes from './routes/paymentRoutes.js';
import userRoutes from './routes/userRoutes.js';
import authRoutes from './routes/authRoutes.js';
import chatRouter from './routes/chatRouter.js';
import orderRoutes from './routes/orderRoutes.js';
import presenceRoutes from './routes/presenceRoutes.js';
import discoveryRoutes from './routes/discoveryRoutes.js';
import contentRoutes from './routes/contentRoutes.js';
import publicRoutes from './routes/publicRoutes.js';
import pricingRoutes from './routes/pricingRoutes.js';
import subscriptionRoutes from './routes/subscriptionRoutes.js';

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

// Canonical channel boundary. It owns provider webhook adapters and USSD entry
// points instead of maintaining parallel implementations in legacyApp.ts.
app.use('/api', channelRoutes);

// Canonical authenticated Money Circle boundary.
app.use('/api', circleRoutes);

// Canonical economic-request boundary backed by skillFlows + the shared
// agentic storefront/trade engine.
app.use('/api/economic-requests', economicRequestRouter);

// Canonical authenticated platform/admin boundary.
app.use('/api/admin', adminRoutes);

// Canonical payment/points boundary. It intentionally keeps production
// top-ups disabled until a verified PSP confirmation path exists.
app.use('/api', paymentRoutes);

// Canonical user/profile/privacy/referral/rating boundary. Identity is derived
// from the authenticated session rather than client-supplied ownership fields.
app.use('/api', userRoutes);

// Canonical OTP/authentication boundary.
app.use('/api/auth', authRoutes);

// Canonical chat boundary: history, streaming, attachments and conversations.
// Mount before legacy chat handlers so the legacy implementation is no longer
// the primary path.
app.use('/api/chat', chatRouter);

// Canonical orders/delivery boundary.
app.use('/api', orderRoutes);

// Canonical presence/Pulse and nearby discovery projections.
app.use('/', presenceRoutes);
app.use('/', discoveryRoutes);

// Canonical public content API and public page routes.
app.use('/', contentRoutes);
app.use('/', publicRoutes);

// Canonical pricing catalogue. Admin pricing endpoints remain under the
// existing admin boundary; this router owns the public /api/pricing/:country
// contract.
app.use('/api/pricing', pricingRoutes);

// Canonical subscription entitlement/payment boundary.
app.use('/api', subscriptionRoutes);

// Remaining legacy/public routes are still registered incrementally. Existing
// boundaries above intentionally stay mounted first so duplicate legacy
// handlers cannot become the primary implementation. Routes not covered by an
// existing canonical module remain owned by legacyApp until parity is proven.
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
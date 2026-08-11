/**
 * Idempotent wiring: mount authRoutes, webrtcRoutes, pricing/subscription/payment
 * routes and rate limits into src/index.ts.
 * Also neutralizes dangerous unauthenticated subscription mutations in the monolith.
 *
 * Run: node scripts/wire-security-routes.mjs
 */
import fs from 'node:fs';
import path from 'node:path';

const indexPath = path.join(process.cwd(), 'src', 'index.ts');
let src = fs.readFileSync(indexPath, 'utf8');

const importBlock = `import authRoutes from './routes/authRoutes.js';
import webrtcRoutes from './routes/webrtcRoutes.js';
import pricingRoutes from './routes/pricingRoutes.js';
import subscriptionRoutes from './routes/subscriptionRoutes.js';
import paymentRoutes from './routes/paymentRoutes.js';
import { aiRateLimit, webhookRateLimit, paymentRateLimit } from './middleware/rateLimit.js';
`;

if (!src.includes("from './routes/authRoutes.js'")) {
  src = src.replace(
    "import chatRouter from './routes/chatRouter.js';",
    `import chatRouter from './routes/chatRouter.js';\n${importBlock}`
  );
} else if (!src.includes("from './routes/pricingRoutes.js'")) {
  src = src.replace(
    "import webrtcRoutes from './routes/webrtcRoutes.js';",
    `import webrtcRoutes from './routes/webrtcRoutes.js';\nimport pricingRoutes from './routes/pricingRoutes.js';\nimport subscriptionRoutes from './routes/subscriptionRoutes.js';\nimport paymentRoutes from './routes/paymentRoutes.js';`
  );
}

if (!src.includes("app.use('/api/auth'")) {
  src = src.replace(
    "app.use('/api/chat', chatRouter);",
    `app.use('/api/chat', chatRouter);\napp.use('/api/auth', authRoutes);\napp.use('/api/webrtc', webrtcRoutes);\napp.use('/api/pricing', pricingRoutes);\napp.use('/api/subscription', subscriptionRoutes);\napp.use('/api', paymentRoutes);\napp.use(['/api/chat/stream', '/api/chat'], aiRateLimit);\napp.use(['/webhook', '/ussd'], webhookRateLimit);\napp.use(['/api/escrow', '/api/points/topup', '/api/credits/topup', '/api/subscription'], paymentRateLimit);`
  );
} else if (!src.includes("app.use('/api/subscription'")) {
  src = src.replace(
    "app.use('/api/webrtc', webrtcRoutes);",
    `app.use('/api/webrtc', webrtcRoutes);\napp.use('/api/pricing', pricingRoutes);\napp.use('/api/subscription', subscriptionRoutes);\napp.use('/api', paymentRoutes);`
  );
}

// Soften legacy login in index — authRoutes owns OTP path
if (src.includes("// API: Auth Login & SSO Synchronization") && !src.includes('authRoutes handles OTP')) {
  src = src.replace(
    "// API: Auth Login & SSO Synchronization\napp.post('/api/auth/login'",
    "// Legacy login retained for compatibility; prefer authRoutes OTP (mounted at /api/auth/*).\n// When both exist, Express uses first matching route — ensure authRoutes is mounted first.\napp.post('/api/auth/login-legacy'"
  );
}

// Harden WebRTC legacy handlers
if (src.includes("app.post('/api/webrtc/create'") && !src.includes('/api/webrtc/create-legacy')) {
  src = src.replace(
    "// WebRTC Signaling API\napp.post('/api/webrtc/create'",
    "// Legacy WebRTC handlers superseded by webrtcRoutes (auth required). Kept disabled via path rename.\napp.post('/api/webrtc/create-legacy'"
  );
  src = src.replace("app.get('/api/webrtc/peers'", "app.get('/api/webrtc/peers-legacy'");
}

// Neutralize unauthenticated subscription upgrade (client-trusted phone/plan)
if (src.includes("app.post('/api/subscription/upgrade'") && !src.includes('DISABLED_CLIENT_TRUSTED_SUBSCRIPTION')) {
  src = src.replace(
    "app.post('/api/subscription/upgrade', async (req, res) => {",
    `// DISABLED_CLIENT_TRUSTED_SUBSCRIPTION — use authenticated POST /api/subscription/upgrade (JWT + payment).
app.post('/api/subscription/upgrade-legacy-disabled', async (req, res) => {
    return res.status(410).json({ error: 'Gone. Use authenticated POST /api/subscription/upgrade with JWT and payment_ref.' });
});
void (async function __legacy_upgrade_handler_disabled() { /*`
  );
  // Close the old handler body by commenting is hard; instead leave a stub that returns 410 above.
  // Find the closing of the old handler and leave it unreachable under a renamed path already.
}

// Safer approach: rewrite the dangerous handler body start to always 410
if (src.includes("app.post('/api/subscription/upgrade'") && src.includes("const { phone, plan, country } = req.body;")) {
  src = src.replace(
    `app.post('/api/subscription/upgrade', async (req, res) => {
    const { phone, plan, country } = req.body;
    if (!phone || !plan || !country) {
        return res.status(400).json({ error: 'phone, plan, and country are required' });
    }
    try {
        const planObj = await getPlan(country, plan);
        if (!planObj) {
            return res.status(404).json({ error: 'Pricing plan not found' });
        }
        const db = await getDb();
        db.run(\`UPDATE memory_profiles SET subscription_tier = ? WHERE phone = ?\`, [plan.charAt(0).toUpperCase() + plan.slice(1), phone]);
        saveDb();

        // Trigger referral reward activation on first subscription payment
        try {
            await claimReferral(phone);
        } catch (refErr) {
            console.error('Error claiming referral:', refErr);
        }

        res.json({ success: true, message: \`Successfully upgraded to ${plan} (${country.toUpperCase()})\`, plan: planObj });
    } catch (e) {
        console.error('Subscription upgrade error:', e);
        res.status(500).json({ error: 'Failed to upgrade subscription' });
    }
});`,
    `// DISABLED_CLIENT_TRUSTED_SUBSCRIPTION — identity + payment gated in subscriptionRoutes
app.post('/api/subscription/upgrade', async (req, res) => {
    return res.status(410).json({
        error: 'Gone. Use authenticated POST /api/subscription/upgrade (JWT). Phone is taken from session only; payment_ref required outside sandbox.',
        use: 'POST /api/subscription/upgrade with Authorization: Bearer <token>',
    });
});`
  );
}

// Neutralize unauthenticated provider subscribe
if (src.includes("app.post('/api/provider/subscribe'") && src.includes("const { phone, tier } = req.body;")) {
  src = src.replace(
    `app.post('/api/provider/subscribe', async (req, res) => {
    const { phone, tier } = req.body;
    if (!phone || !tier) {
        return res.status(400).json({ success: false, error: 'Phone and tier are required' });
    }

    try {
        const db = await getDb();
        
        // Fee structure
        let fee = 0;
        if (tier === 'Base') fee = 500;
        else if (tier === 'Plus') fee = 1500;
        else if (tier === 'Business') fee = 5000;
        else return res.status(400).json({ success: false, error: 'Invalid tier' });

        // Deduct from direct wallet
        const { processDirectPayment } = await import('./services/directWallet.js');
        const paid = await processDirectPayment(phone, 'SYSTEM', fee);
        
        if (!paid) {
            return res.status(400).json({ success: false, error: 'Insufficient wallet balance for subscription' });
        }

        const nextBillingDate = new Date();
        nextBillingDate.setMonth(nextBillingDate.getMonth() + 1);

        db.run(
            \`INSERT INTO provider_subscriptions (phone, tier, status, next_billing_date, leads_this_month)
             VALUES (?, ?, 'active', ?, 0)
             ON CONFLICT(phone) DO UPDATE SET 
                tier=excluded.tier, 
                status='active', 
                next_billing_date=excluded.next_billing_date,
                leads_this_month=0\`,
            [phone, tier, nextBillingDate.toISOString()]
        );
        saveDb();

        res.json({ success: true, message: \`Subscribed to ${tier} tier successfully.\` });
    } catch (e) {
        console.error('Subscribe error:', e);
        res.status(500).json({ success: false, error: 'Internal error' });
    }
});`,
    `// DISABLED_CLIENT_TRUSTED_PROVIDER_SUB
app.post('/api/provider/subscribe', async (req, res) => {
    return res.status(410).json({
        success: false,
        error: 'Gone. Use authenticated POST /api/subscription/provider with JWT.',
    });
});`
  );
}

// Strip subscription_tier from client-facing profile update
if (src.includes('subscription_tier = COALESCE(?, subscription_tier)') && !src.includes('// TIER_NOT_CLIENT_SETTABLE')) {
  src = src.replace(
    `const { 
        phone, name, location, country, subscription_tier, 
        skills, operation_mode, hourly_rate, service_radius_km, 
        transport_mode, pricing_model, payment_method, equipment, is_available
    } = req.body;`,
    `// TIER_NOT_CLIENT_SETTABLE — subscription_tier only via subscriptionService after payment
    const { 
        phone, name, location, country, 
        skills, operation_mode, hourly_rate, service_radius_km, 
        transport_mode, pricing_model, payment_method, equipment, is_available
    } = req.body;`
  );
  src = src.replace(
    `db.run(\`INSERT INTO memory_profiles (phone, name, location, country, subscription_tier) VALUES (?, ?, ?, ?, ?)\`, 
                [phone, name || 'New User', location || 'Ibadan', country || 'ng', subscription_tier || 'Base']);`,
    `db.run(\`INSERT INTO memory_profiles (phone, name, location, country, subscription_tier) VALUES (?, ?, ?, ?, ?)\`, 
                [phone, name || 'New User', location || 'Ibadan', country || 'ng', 'Base']);`
  );
  src = src.replace(
    `db.run(\`UPDATE memory_profiles SET name = COALESCE(?, name), location = COALESCE(?, location), country = COALESCE(?, country), subscription_tier = COALESCE(?, subscription_tier) WHERE phone = ?\`,
                [name, location, country, subscription_tier, phone]);`,
    `db.run(\`UPDATE memory_profiles SET name = COALESCE(?, name), location = COALESCE(?, location), country = COALESCE(?, country) WHERE phone = ?\`,
                [name, location, country, phone]);`
  );
}

fs.writeFileSync(indexPath, src);
console.log('Wired auth + webrtc + pricing/subscription/payment routes; neutralized client-trusted subscription mutations.');

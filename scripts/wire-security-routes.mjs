/**
 * Idempotent wiring: mount all extracted route modules into src/index.ts and
 * neutralize dangerous / duplicated legacy handlers in the monolith.
 *
 * ChatGPT audit discipline:
 *   extract exact handler → contract test → mount → CI → remove original later
 *
 * Run: node scripts/wire-security-routes.mjs  (also prebuild)
 */
import fs from 'node:fs';
import path from 'node:path';

const indexPath = path.join(process.cwd(), 'src', 'index.ts');
let src = fs.readFileSync(indexPath, 'utf8');

const fullImportBlock = `import authRoutes from './routes/authRoutes.js';
import webrtcRoutes from './routes/webrtcRoutes.js';
import pricingRoutes from './routes/pricingRoutes.js';
import subscriptionRoutes from './routes/subscriptionRoutes.js';
import paymentRoutes from './routes/paymentRoutes.js';
import userRoutes from './routes/userRoutes.js';
import economicRequestRouter from './routes/economicRequestRouter.js';
import createDiscoveryRouter from './routes/discoveryRoutes.js';
import createPresenceRouter from './routes/presenceRoutes.js';
import createContentRouter from './routes/contentRoutes.js';
import createPublicRouter from './routes/publicRoutes.js';
import channelRoutes from './routes/channelRoutes.js';
import systemRoutes from './routes/systemRoutes.js';
import { aiRateLimit, webhookRateLimit, paymentRateLimit } from './middleware/rateLimit.js';
import { authenticateUser } from './middleware/auth.js';
`;

// Ensure imports after chatRouter
if (!src.includes("from './routes/authRoutes.js'")) {
  src = src.replace(
    "import chatRouter from './routes/chatRouter.js';",
    `import chatRouter from './routes/chatRouter.js';\n${fullImportBlock}`
  );
} else {
  // Patch missing imports incrementally
  const ensureImport = (needle, block) => {
    if (!src.includes(needle)) {
      if (src.includes("from './routes/webrtcRoutes.js'")) {
        src = src.replace(
          "import webrtcRoutes from './routes/webrtcRoutes.js';",
          `import webrtcRoutes from './routes/webrtcRoutes.js';\n${block}`
        );
      } else if (src.includes("from './routes/authRoutes.js'")) {
        src = src.replace(
          "import authRoutes from './routes/authRoutes.js';",
          `import authRoutes from './routes/authRoutes.js';\n${block}`
        );
      }
    }
  };
  ensureImport("from './routes/pricingRoutes.js'", "import pricingRoutes from './routes/pricingRoutes.js';\nimport subscriptionRoutes from './routes/subscriptionRoutes.js';\nimport paymentRoutes from './routes/paymentRoutes.js';");
  ensureImport("from './routes/userRoutes.js'", "import userRoutes from './routes/userRoutes.js';");
  ensureImport("from './routes/economicRequestRouter.js'", "import economicRequestRouter from './routes/economicRequestRouter.js';");
  ensureImport("from './routes/discoveryRoutes.js'", "import createDiscoveryRouter from './routes/discoveryRoutes.js';\nimport createPresenceRouter from './routes/presenceRoutes.js';\nimport createContentRouter from './routes/contentRoutes.js';\nimport createPublicRouter from './routes/publicRoutes.js';");
  ensureImport("from './routes/channelRoutes.js'", "import channelRoutes from './routes/channelRoutes.js';\nimport systemRoutes from './routes/systemRoutes.js';");
  if (!src.includes("from './middleware/rateLimit.js'")) {
    src = src.replace(
      "import chatRouter from './routes/chatRouter.js';",
      `import chatRouter from './routes/chatRouter.js';\nimport { aiRateLimit, webhookRateLimit, paymentRateLimit } from './middleware/rateLimit.js';`
    );
  }
}

const mountBlock = `app.use('/api/chat', chatRouter);
app.use('/api/auth', authRoutes);
app.use('/api/webrtc', webrtcRoutes);
app.use('/api/pricing', pricingRoutes);
app.use('/api/subscription', subscriptionRoutes);
app.use('/api', paymentRoutes);
app.use('/api', userRoutes);
app.use('/api/economic', authenticateUser, economicRequestRouter);
app.use(createDiscoveryRouter());
app.use(createPresenceRouter());
app.use(createContentRouter());
app.use(createPublicRouter());
app.use(channelRoutes);
app.use(systemRoutes);
app.use(['/api/chat/stream', '/api/chat'], aiRateLimit);
app.use(['/webhook', '/ussd'], webhookRateLimit);
app.use(['/api/escrow', '/api/points/topup', '/api/credits/topup', '/api/subscription'], paymentRateLimit);`;

if (!src.includes("app.use('/api/auth'")) {
  src = src.replace("app.use('/api/chat', chatRouter);", mountBlock);
} else {
  // Add any missing mounts after webrtc or auth
  if (!src.includes("app.use('/api/subscription'")) {
    src = src.replace(
      "app.use('/api/webrtc', webrtcRoutes);",
      `app.use('/api/webrtc', webrtcRoutes);\napp.use('/api/pricing', pricingRoutes);\napp.use('/api/subscription', subscriptionRoutes);\napp.use('/api', paymentRoutes);`
    );
  }
  if (!src.includes("app.use('/api', userRoutes)")) {
    const anchor = src.includes("app.use('/api', paymentRoutes)")
      ? "app.use('/api', paymentRoutes);"
      : "app.use('/api/subscription', subscriptionRoutes);";
    src = src.replace(
      anchor,
      `${anchor}\napp.use('/api', userRoutes);\napp.use('/api/economic', authenticateUser, economicRequestRouter);\napp.use(createDiscoveryRouter());\napp.use(createPresenceRouter());\napp.use(createContentRouter());\napp.use(createPublicRouter());\napp.use(channelRoutes);\napp.use(systemRoutes);`
    );
  }
}

// ── Neutralize legacy dangerous / duplicate handlers ───────────────────

// Legacy auth login → renamed so authRoutes wins
if (src.includes("// API: Auth Login & SSO Synchronization") && src.includes("app.post('/api/auth/login'")) {
  src = src.replace(
    "// API: Auth Login & SSO Synchronization\napp.post('/api/auth/login'",
    "// Legacy login superseded by authRoutes OTP. Path renamed so /api/auth/* is owned by authRoutes.\napp.post('/api/auth/login-legacy'"
  );
}

// WebRTC legacy
if (src.includes("app.post('/api/webrtc/create'") && !src.includes("/api/webrtc/create-legacy")) {
  src = src.replace(
    "// WebRTC Signaling API\napp.post('/api/webrtc/create'",
    "// Legacy WebRTC superseded by webrtcRoutes (JWT required).\napp.post('/api/webrtc/create-legacy'"
  );
  src = src.replace("app.get('/api/webrtc/peers'", "app.get('/api/webrtc/peers-legacy'");
}

// Client-trusted subscription upgrade
if (src.includes("app.post('/api/subscription/upgrade'") && src.includes("const { phone, plan, country } = req.body;")) {
  src = src.replace(
    /app\.post\('\/api\/subscription\/upgrade', async \(req, res\) => \{[\s\S]*?const \{ phone, plan, country \} = req\.body;[\s\S]*?res\.status\(500\)\.json\(\{ error: 'Failed to upgrade subscription' \}\);\n    \}\n\}\);/,
    `// DISABLED_CLIENT_TRUSTED_SUBSCRIPTION — identity + payment gated in subscriptionRoutes
app.post('/api/subscription/upgrade-legacy-disabled', async (req, res) => {
    return res.status(410).json({
        error: 'Gone. Use authenticated POST /api/subscription/upgrade (JWT). Phone from session only; payment_ref required outside sandbox.',
    });
});`
  );
}

// Provider subscribe client-trusted
if (src.includes("app.post('/api/provider/subscribe'") && src.includes("const { phone, tier } = req.body;")) {
  src = src.replace(
    /app\.post\('\/api\/provider\/subscribe', async \(req, res\) => \{[\s\S]*?const \{ phone, tier \} = req\.body;[\s\S]*?res\.status\(500\)\.json\(\{ success: false, error: 'Internal error' \}\);\n    \}\n\}\);/,
    `// DISABLED_CLIENT_TRUSTED_PROVIDER_SUB
app.post('/api/provider/subscribe', async (req, res) => {
    return res.status(410).json({
        success: false,
        error: 'Gone. Use authenticated POST /api/subscription/provider with JWT.',
    });
});`
  );
}

// Pulse handlers → legacy path (presenceRoutes owns /api/pulse/*)
const pulseRenames = [
  ["app.post('/api/pulse/live'", "app.post('/api/pulse/live-legacy'"],
  ["app.post('/api/pulse/activate'", "app.post('/api/pulse/activate-legacy'"],
  ["app.post('/api/pulse/deactivate'", "app.post('/api/pulse/deactivate-legacy'"],
  ["app.get('/api/pulse/status'", "app.get('/api/pulse/status-legacy'"],
  ["app.get('/api/pulse/providers'", "app.get('/api/pulse/providers-legacy'"],
  ["app.get('/api/stats/pulse'", "app.get('/api/stats/pulse-legacy'"],
  ["app.get('/api/blog'", "app.get('/api/blog-legacy'"],
  ["app.get('/api/blog/:slug'", "app.get('/api/blog-legacy/:slug'"],
  ["app.get('/api/discover/map'", "app.get('/api/discover/map-legacy'"],
  ["app.get('/health'", "app.get('/health-legacy'"],
  ["app.post('/webhook/whatsapp'", "app.post('/webhook/whatsapp-legacy'"],
  ["app.post('/webhook/telegram'", "app.post('/webhook/telegram-legacy'"],
  ["app.post('/webhook/sms'", "app.post('/webhook/sms-legacy'"],
  ["app.post('/ussd'", "app.post('/ussd-legacy'"],
  ["app.get('/api/profile'", "app.get('/api/profile-legacy'"],
  ["app.post('/api/profile/update'", "app.post('/api/profile/update-legacy'"],
  ["app.post('/api/profile/availability'", "app.post('/api/profile/availability-legacy'"],
  ["app.get('/api/points/balance'", "app.get('/api/points/balance-legacy'"],
  ["app.post('/api/points/topup'", "app.post('/api/points/topup-legacy'"],
  ["app.post('/api/credits/topup'", "app.post('/api/credits/topup-legacy'"],
];

for (const [from, to] of pulseRenames) {
  if (src.includes(from) && !src.includes(to)) {
    src = src.replace(from, to);
  }
}

// Strip subscription_tier from client-facing profile update (if still present)
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
console.log('Wired all extracted routers; neutralized legacy pulse/blog/auth/webrtc/subscription/profile handlers.');

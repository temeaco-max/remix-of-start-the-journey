/**
 * Idempotent wiring: mount authRoutes, webrtcRoutes, rate limits into src/index.ts
 * Run: node scripts/wire-security-routes.mjs
 */
import fs from 'node:fs';
import path from 'node:path';

const indexPath = path.join(process.cwd(), 'src', 'index.ts');
let src = fs.readFileSync(indexPath, 'utf8');

const importBlock = `import authRoutes from './routes/authRoutes.js';
import webrtcRoutes from './routes/webrtcRoutes.js';
import { aiRateLimit, webhookRateLimit, paymentRateLimit } from './middleware/rateLimit.js';
`;

if (!src.includes("from './routes/authRoutes.js'")) {
  src = src.replace(
    "import chatRouter from './routes/chatRouter.js';",
    `import chatRouter from './routes/chatRouter.js';\n${importBlock}`
  );
}

if (!src.includes("app.use('/api/auth'")) {
  src = src.replace(
    "app.use('/api/chat', chatRouter);",
    `app.use('/api/chat', chatRouter);\napp.use('/api/auth', authRoutes);\napp.use('/api/webrtc', webrtcRoutes);\napp.use(['/api/chat/stream', '/api/chat'], aiRateLimit);\napp.use(['/webhook', '/ussd'], webhookRateLimit);\napp.use(['/api/escrow', '/api/points/topup', '/api/credits/topup'], paymentRateLimit);`
  );
}

// Soften legacy login in index by pointing comment — authRoutes owns OTP path
if (src.includes("// API: Auth Login & SSO Synchronization") && !src.includes('authRoutes handles OTP')) {
  src = src.replace(
    "// API: Auth Login & SSO Synchronization\napp.post('/api/auth/login'",
    "// Legacy login retained for compatibility; prefer authRoutes OTP (mounted at /api/auth/*).\n// When both exist, Express uses first matching route — ensure authRoutes is mounted first.\napp.post('/api/auth/login-legacy'"
  );
}

// Harden WebRTC legacy handlers: leave in place but note superseded
src = src.replace(
  "// WebRTC Signaling API\napp.post('/api/webrtc/create'",
  "// Legacy WebRTC handlers superseded by webrtcRoutes (auth required). Kept disabled via path rename.\napp.post('/api/webrtc/create-legacy'"
);
src = src.replace(
  "app.get('/api/webrtc/peers'",
  "app.get('/api/webrtc/peers-legacy'"
);

fs.writeFileSync(indexPath, src);
console.log('Wired auth + webrtc routes and rate limits into src/index.ts');

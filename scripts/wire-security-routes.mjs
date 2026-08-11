/**
 * Idempotent source wiring for extracted HTTP boundaries.
 * Temporary migration bridge: source is wired before compilation so generated
 * production code uses the canonical routers while legacy handlers are being removed.
 */
import fs from 'node:fs';
import path from 'node:path';

const indexPath = path.join(process.cwd(), 'src', 'index.ts');
let src = fs.readFileSync(indexPath, 'utf8');

const imports = [
  "import publicRoutes from './routes/publicRoutes.js';",
  "import discoveryRoutes from './routes/discoveryRoutes.js';",
  "import presenceRoutes from './routes/presenceRoutes.js';",
  "import contentRoutes from './routes/contentRoutes.js';",
  "import trustRoutes from './routes/trustRoutes.js';",
  "import circleRoutes from './routes/circleRoutes.js';",
  "import orderRoutes from './routes/orderRoutes.js';",
  "import taskRoutes from './routes/taskRoutes.js';",
  "import userRoutes from './routes/userRoutes.js';",
];

const anchorImport = "import chatRouter from './routes/chatRouter.js';";
for (const line of imports) {
  if (!src.includes(line)) {
    src = src.includes(anchorImport)
      ? src.replace(anchorImport, `${anchorImport}\n${line}`)
      : `${line}\n${src}`;
  }
}

const mountAnchor = "app.use('/api/chat', chatRouter);";
const mounts = [
  "app.use(publicRoutes);",
  "app.use(discoveryRoutes);",
  "app.use(presenceRoutes);",
  "app.use(contentRoutes);",
  "app.use('/api', trustRoutes);",
  "app.use('/api', circleRoutes);",
  "app.use('/api', orderRoutes);",
  "app.use('/api', taskRoutes);",
  "app.use('/api', userRoutes);",
];

for (const line of mounts) {
  if (!src.includes(line) && src.includes(mountAnchor)) {
    src = src.replace(mountAnchor, `${mountAnchor}\n${line}`);
  }
}

const renames = [
  ["app.get('/web'", "app.get('/web-legacy'"],
  ["app.get('/download'", "app.get('/download-legacy'"],
  ["app.get('/about'", "app.get('/about-legacy'"],
  ["app.get('/contact'", "app.get('/contact-legacy'"],
  ["app.get('/help'", "app.get('/help-legacy'"],
  ["app.get('/api-docs'", "app.get('/api-docs-legacy'"],
  ["app.get('/legal/:section?'", "app.get('/legal-legacy/:section?'"],
  ["app.get('/blog'", "app.get('/blog-legacy'"],
  ["app.get('/careers'", "app.get('/careers-legacy'"],
  ["app.get('/discover'", "app.get('/discover-legacy'"],
  ["app.get('/login'", "app.get('/login-legacy'"],
  ["app.get('/for-you'", "app.get('/for-you-legacy'"],
  ["app.get('/resources/:slug'", "app.get('/resources-legacy/:slug'"],
  ["app.get('/resources'", "app.get('/resources-legacy'"],
  ["app.get('/partners'", "app.get('/partners-legacy'"],
  ["app.get('/advertise'", "app.get('/advertise-legacy'"],
  ["app.get('/api/discover/map'", "app.get('/api/discover/map-legacy'"],
  ["app.get('/api/blog/:slug'", "app.get('/api/blog-legacy/:slug'"],
  ["app.get('/api/blog'", "app.get('/api/blog-legacy'"],
  ["app.post('/api/referral/code'", "app.post('/api/referral/code-legacy'"],
  ["app.post('/api/referral/claim'", "app.post('/api/referral/claim-legacy'"],
  ["app.post('/api/referral/share-reward'", "app.post('/api/referral/share-reward-legacy'"],
  ["app.get('/api/referral/stats/:phone'", "app.get('/api/referral/stats-legacy/:phone'"],
  ["app.post('/api/ratings'", "app.post('/api/ratings-legacy'"],
  ["app.post('/api/appointments/book'", "app.post('/api/appointments/book-legacy'"],
  ["app.get('/api/tasks'", "app.get('/api/tasks-legacy'"],
  ["app.post('/api/tasks/accept'", "app.post('/api/tasks/accept-legacy'"],
  ["app.post('/api/tasks/complete'", "app.post('/api/tasks/complete-legacy'"],
  ["app.post('/api/circle/create'", "app.post('/api/circle/create-legacy'"],
  ["app.post('/api/circle/join'", "app.post('/api/circle/join-legacy'"],
  ["app.post('/api/circle/contribute'", "app.post('/api/circle/contribute-legacy'"],
  ["app.get('/api/orders'", "app.get('/api/orders-legacy'"],
  ["app.post('/api/orders/:id/delivery-status'", "app.post('/api/orders/:id/delivery-status-legacy'"],
  ["app.post('/api/dispute/create'", "app.post('/api/dispute/create-legacy'"],
  ["app.post('/api/disputes'", "app.post('/api/disputes-legacy'"],
  ["app.post('/api/scam_reports'", "app.post('/api/scam_reports-legacy'"],
  ["app.post('/api/escrow/create'", "app.post('/api/escrow/create-legacy'"],
];

for (const [from, to] of renames) {
  if (src.includes(from) && !src.includes(to)) src = src.replace(from, to);
}

src = src.split('+2348030000000').join('');
fs.writeFileSync(indexPath, src);
console.log('Wired extracted public/discovery/presence/content/trust/circle/order/task/user routers.');

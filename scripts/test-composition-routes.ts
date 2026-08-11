/**
 * Composition-root contract test.
 * Verifies the existing canonical route modules are mounted before the legacy
 * compatibility container. This is intentionally static: it does not require
 * a live database, PSP, or external channel provider.
 */
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';

const indexSource = await fs.readFile(new URL('../src/index.ts', import.meta.url), 'utf8');
const legacySource = await fs.readFile(new URL('../src/legacyApp.ts', import.meta.url), 'utf8');

const canonicalImports = [
  'authRoutes',
  'chatRouter',
  'orderRoutes',
  'presenceRoutes',
  'discoveryRoutes',
  'contentRoutes',
  'publicRoutes',
  'pricingRoutes',
  'subscriptionRoutes',
  'channelRoutes',
  'circleRoutes',
  'economicRequestRouter',
  'adminRoutes',
  'paymentRoutes',
  'userRoutes',
];

for (const name of canonicalImports) {
  assert.match(indexSource, new RegExp(`from './routes/${name}\\.js'`), `index.ts must import existing ${name}`);
}

const requiredMounts = [
  "app.use('/api/auth', authRoutes)",
  "app.use('/api/chat', chatRouter)",
  "app.use('/api', orderRoutes)",
  "app.use('/', presenceRoutes)",
  "app.use('/', discoveryRoutes)",
  "app.use('/', contentRoutes)",
  "app.use('/', publicRoutes)",
  "app.use('/api/pricing', pricingRoutes)",
  "app.use('/api', subscriptionRoutes)",
  'registerLegacyRoutes(app)',
];

for (const mount of requiredMounts) {
  assert.ok(indexSource.includes(mount), `missing composition boundary: ${mount}`);
}

const legacyRegistration = indexSource.indexOf('registerLegacyRoutes(app)');
for (const mount of requiredMounts.filter((item) => item !== 'registerLegacyRoutes(app)')) {
  assert.ok(indexSource.indexOf(mount) < legacyRegistration, `${mount} must be mounted before legacy routes`);
}

// These are deliberately checked as remaining compatibility implementations,
// not canonical ownership. The next removal pass must delete them only after
// parity coverage proves that the canonical route is sufficient.
assert.match(legacySource, /app\.get\('\/health'/, 'health remains a unique legacy/public route');
assert.match(legacySource, /app\.get\('\/'/, 'homepage remains a unique legacy/public route');
assert.match(legacySource, /app\.get\('\/explore'/, 'explore remains a unique legacy/public route');
assert.match(legacySource, /app\.get\('\/p\/:providerSlug'/, 'provider SEO profile remains a unique legacy/public route');

console.log('test-composition-routes: PASS');

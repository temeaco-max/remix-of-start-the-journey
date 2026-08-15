/**
 * Contract test: admin routes require authenticateAdmin (JWT admin claim).
 * Pricing is a separate route boundary and is tested independently.
 */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const paths = [
  '/api/admin/tickets',
  '/api/admin/disputes',
  '/api/admin/users',
  '/api/admin/ai-agents',
  '/api/admin/analytics',
  '/api/admin/content',
  '/api/admin/stats',
  '/api/admin/pilot-readiness',
  '/api/admin/ads',
  '/api/admin/operator/state',
  '/api/admin/operator/chat',
  '/api/admin/operator/actors',
  '/api/admin/operator/actors/:actorId/chat',
  '/api/admin/operator/actors/:actorId/reset',
];

async function main() {
  const mod = await import('../src/routes/adminRoutes.ts');
  assert.ok(mod.default || mod.adminRoutes, 'adminRoutes export missing');
  const src = await import('node:fs').then((fs) =>
    fs.promises.readFile(new URL('../src/routes/adminRoutes.ts', import.meta.url), 'utf8')
  );
  const publicRoutes = await fs.promises.readFile(path.join(process.cwd(), 'src', 'routes', 'publicRoutes.ts'), 'utf8');
  assert.match(publicRoutes, /router\.get\('\/admin'/, 'the canonical /admin entry route must exist');
  for (const file of ['login.html', 'dashboard.html', 'ads.html', 'analytics.html', 'ai-agents.html', 'content.html', 'seo.html', 'users.html', 'pricing.html', 'revenue.html']) {
    assert.ok(fs.existsSync(path.join(process.cwd(), 'public', 'admin', file)), `admin page ${file} must exist`);
  }
  const dashboard = await fs.promises.readFile(path.join(process.cwd(), 'public', 'admin', 'dashboard.html'), 'utf8');
  assert.match(dashboard, /fetch\('\/api\/admin\/ads'/, 'admin dashboard campaigns must use the protected admin ads owner');
  assert.match(dashboard, /fetch\('\/api\/admin\/content'/, 'admin dashboard CMS must use the protected admin content owner');
  assert.doesNotMatch(dashboard, /fetch\('\/api\/ads'/, 'admin dashboard must not use the public ads path');
  assert.doesNotMatch(dashboard, /fetch\('\/api\/content'/, 'admin dashboard must not use the public content path');
  assert.match(src, /router\.get\('\/celebrity',\s*authenticateAdmin/, 'celebrity demand must have a protected admin endpoint');
  const celebrity = await fs.promises.readFile(path.join(process.cwd(), 'public', 'admin', 'celebrity.html'), 'utf8');
  assert.match(celebrity, /fetch\('\/api\/admin\/celebrity'/, 'celebrity demand page must use its protected admin endpoint');
  assert.match(celebrity, /x-admin-token.*localStorage\.getItem\('kurukoo_admin'\)/, 'celebrity demand page must forward the shared admin token');
  const future = await fs.promises.readFile(path.join(process.cwd(), 'public', 'admin', 'future.html'), 'utf8');
  assert.match(future, /fetch\('\/api\/admin\/future_plans'/, 'future roadmap page must use its protected admin endpoint');
  assert.match(future, /x-admin-token.*localStorage\.getItem\('kurukoo_admin'\)/, 'future roadmap page must forward the shared admin token');
  assert.match(src, /authenticateAdmin/, 'adminRoutes must use authenticateAdmin');
  assert.match(src, /operatorSession: true/, 'operator Chat must issue an explicit operator session claim');
  assert.match(src, /testActor: true/, 'Test As must issue an explicit actor claim');
  assert.match(src, /isolated_actor_context/, 'Test As must disclose the isolated actor boundary');
  assert.doesNotMatch(src, /\\+2348030000000/, 'no demo phone in admin routes');
  for (const p of paths) {
    assert.ok(src.includes(p.replace('/api/admin', '')) || src.includes(p), `path reference for ${p}`);
  }
  console.log('test-admin-routes: PASS: protected API registry, canonical /admin entry, and core static admin revamp pages are present');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

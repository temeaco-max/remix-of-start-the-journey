/**
 * Contract test: adminRoutes exposes expected operational admin paths.
 */
import adminRoutes from '../src/routes/adminRoutes.js';

const expected = [
  '/auth',
  '/tickets',
  '/tickets/reply',
  '/disputes/resolve',
  '/disputes/escalate',
  '/stats',
  '/keep-alive-analytics',
  '/analytics/trends',
  '/analytics/sales',
  '/users',
  '/users/bulk-update',
  '/verify_provider',
  '/skill-flows',
  '/skill-flows/:skill',
  '/pulse-sessions',
  '/artists',
  '/artists/verify',
  '/referrals',
  '/revenue',
  '/marketing',
  '/social',
  '/partnerships',
  '/scam_reports',
  '/content',
  '/content/:slug',
  '/content/generate',
  '/future_plans',
  '/settings',
  '/ai-agents',
  '/ai-agents/:id',
  '/ai-agents/:id/clone',
  '/ai-agents/:id/execute',
  '/commissions',
  '/commissions/:id',
  '/github/status',
  '/github/list',
  '/github/diff',
  '/github/pull',
  '/github/push',
];

const stack = (adminRoutes as any).stack || [];
const routes: string[] = stack.filter((layer: any) => layer.route).map((layer: any) => layer.route.path);

const missing = expected.filter((path) => !routes.includes(path));
if (missing.length) {
  throw new Error(`Admin route module is missing: ${missing.join(', ')}`);
}

console.log(`Admin route module contract passed: ${routes.length} registered paths (checked ${expected.length} required).`);

/**
 * Contract test: adminRoutes — every sensitive path uses authenticateAdmin
 * except POST /auth (login).
 */
import { readFileSync } from 'node:fs';
import path from 'node:path';

const routeSrc = readFileSync(path.join(process.cwd(), 'src/routes/adminRoutes.ts'), 'utf8');

const checks: Array<{ name: string; ok: boolean }> = [];
function check(name: string, ok: boolean) {
  checks.push({ name, ok });
}

check('exports default router', /export default router/.test(routeSrc));
check('POST /auth login present', /router\.post\('\/auth'/.test(routeSrc));
check('tickets list admin', /router\.get\('\/tickets',\s*authenticateAdmin/.test(routeSrc));
check('tickets reply admin (was unguarded)', /router\.post\('\/tickets\/reply',\s*authenticateAdmin/.test(routeSrc));
check('disputes resolve admin (was unguarded)', /router\.post\('\/disputes\/resolve',\s*authenticateAdmin/.test(routeSrc));
check('disputes escalate admin', /router\.post\('\/disputes\/escalate',\s*authenticateAdmin/.test(routeSrc));
check('stats admin', /router\.get\('\/stats',\s*authenticateAdmin/.test(routeSrc));
check('users admin', /router\.get\('\/users',\s*authenticateAdmin/.test(routeSrc));
check('artists admin', /router\.get\('\/artists',\s*authenticateAdmin/.test(routeSrc));
check('scam_reports admin', /router\.get\('\/scam_reports',\s*authenticateAdmin/.test(routeSrc));
check('verify_provider admin', /router\.post\('\/verify_provider',\s*authenticateAdmin/.test(routeSrc));
check('github status under admin', /router\.get\('\/github\/status',\s*authenticateAdmin/.test(routeSrc));
check('github push under admin', /router\.post\('\/github\/push',\s*authenticateAdmin/.test(routeSrc));
check('keep-alive admin', /router\.get\('\/keep-alive-analytics',\s*authenticateAdmin/.test(routeSrc));
check('ai-agents list admin', /router\.get\('\/ai-agents',\s*authenticateAdmin/.test(routeSrc));
check('pricing admin', /router\.get\('\/pricing',\s*authenticateAdmin/.test(routeSrc));
check('uses releaseEscrow/refundEscrow services', /releaseEscrow/.test(routeSrc) && /refundEscrow/.test(routeSrc));

// No unauthenticated router.post except /auth
const postLines = routeSrc.split('\n').filter((l) => /router\.post\(/.test(l));
const unguarded = postLines.filter((l) => !/authenticateAdmin/.test(l) && !/\/auth'/.test(l));
check('no unauthenticated POSTs except /auth', unguarded.length === 0);

const failed = checks.filter((c) => !c.ok);
for (const c of checks) console.log(`${c.ok ? 'PASS' : 'FAIL'}: ${c.name}`);
if (failed.length) {
  console.error(`\n${failed.length} failed`);
  process.exit(1);
}
console.log(`\nAll ${checks.length} adminRoutes contract checks passed`);

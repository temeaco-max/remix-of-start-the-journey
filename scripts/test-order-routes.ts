/**
 * Contract test: orderRoutes — JWT only, no demo phone default.
 */
import { readFileSync } from 'node:fs';
import path from 'node:path';

const routeSrc = readFileSync(path.join(process.cwd(), 'src/routes/orderRoutes.ts'), 'utf8');

const checks: Array<{ name: string; ok: boolean }> = [];
function check(name: string, ok: boolean) {
  checks.push({ name, ok });
}

check('exports default router', /export default router/.test(routeSrc));
check('GET /orders JWT', /router\.get\('\/orders',\s*authenticateUser/.test(routeSrc));
check('POST delivery-status JWT', /router\.post\('\/orders\/:id\/delivery-status',\s*authenticateUser/.test(routeSrc));
check('sessionPhone helper', /function sessionPhone/.test(routeSrc));
check('no demo phone default', !/\+2348030000000/.test(routeSrc));
check('phone must match session on list', /phone must match session/.test(routeSrc));
check('order party ownership check', /not a party on this order/.test(routeSrc));
check('uses updateDeliveryStatus service', /updateDeliveryStatus/.test(routeSrc));

const failed = checks.filter((c) => !c.ok);
for (const c of checks) console.log(`${c.ok ? 'PASS' : 'FAIL'}: ${c.name}`);
if (failed.length) {
  console.error(`\n${failed.length} failed`);
  process.exit(1);
}
console.log(`\nAll ${checks.length} orderRoutes contract checks passed`);

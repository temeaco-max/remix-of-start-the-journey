/**
 * Contract test: circleRoutes — JWT identity for create/join/contribute/alert.
 */
import { readFileSync } from 'node:fs';
import path from 'node:path';

const routeSrc = readFileSync(path.join(process.cwd(), 'src/routes/circleRoutes.ts'), 'utf8');

const checks: Array<{ name: string; ok: boolean }> = [];
function check(name: string, ok: boolean) {
  checks.push({ name, ok });
}

check('exports default router', /export default router/.test(routeSrc));
check('POST /circle/create JWT', /router\.post\('\/circle\/create',\s*authenticateUser/.test(routeSrc));
check('POST /circle/join JWT', /router\.post\('\/circle\/join',\s*authenticateUser/.test(routeSrc));
check('POST /circle/contribute JWT', /router\.post\('\/circle\/contribute',\s*authenticateUser/.test(routeSrc));
check('GET /circle/:id JWT', /router\.get\('\/circle\/:id',\s*authenticateUser/.test(routeSrc));
check('POST buying-discount JWT', /router\.post\('\/circle\/:id\/buying-discount',\s*authenticateUser/.test(routeSrc));
check('POST safety-alert JWT', /router\.post\('\/circle\/:id\/safety-alert',\s*authenticateUser/.test(routeSrc));
check('sessionPhone helper', /function sessionPhone/.test(routeSrc));
check('creator_phone must match session', /creator_phone must match session/.test(routeSrc));
check('phone must match session', /phone must match session/.test(routeSrc));
check('create uses session phone not body creator', /createMoneyCircle\(\s*String\(name\),\s*phone/.test(routeSrc));
check('join uses session phone', /joinMoneyCircle\(parseInt\(String\(circle_id\), 10\), phone\)/.test(routeSrc));
check('contribute uses session phone', /recordContribution\(parseInt\(String\(circle_id\), 10\), phone,/.test(routeSrc));

const failed = checks.filter((c) => !c.ok);
for (const c of checks) console.log(`${c.ok ? 'PASS' : 'FAIL'}: ${c.name}`);
if (failed.length) {
  console.error(`\n${failed.length} failed`);
  process.exit(1);
}
console.log(`\nAll ${checks.length} circleRoutes contract checks passed`);

/**
 * Contract test: trustRoutes (disputes, scam, escrow).
 * Asserts JWT identity boundary — no client-trusted phone for ownership.
 */
import { readFileSync } from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const routeSrc = readFileSync(path.join(root, 'src/routes/trustRoutes.ts'), 'utf8');
const indexSrc = readFileSync(path.join(root, 'src/index.ts'), 'utf8');

const checks: Array<{ name: string; ok: boolean; detail?: string }> = [];

function check(name: string, ok: boolean, detail?: string) {
  checks.push({ name, ok, detail });
}

// Module exports default router
check('trustRoutes exports default router', /export default router/.test(routeSrc));

// All mutating dispute/escrow paths use authenticateUser or authenticateAdmin
const authGuards = [
  ["POST /dispute/create", /router\.post\('\/dispute\/create',\s*authenticateUser/],
  ["POST /disputes", /router\.post\('\/disputes',\s*authenticateUser/],
  ["POST /scam_reports", /router\.post\('\/scam_reports',\s*authenticateUser/],
  ["GET /dispute/:id", /router\.get\('\/dispute\/:id',\s*authenticateUser/],
  ["POST /dispute/:id/resolve", /router\.post\('\/dispute\/:id\/resolve',\s*authenticateAdmin/],
  ["POST /dispute/:id/escalate", /router\.post\('\/dispute\/:id\/escalate',\s*authenticateUser/],
  ["POST /escrow/create", /router\.post\('\/escrow\/create',\s*authenticateUser/],
  ["POST /escrow/release", /router\.post\('\/escrow\/release',\s*authenticateUser/],
  ["POST /escrow/refund", /router\.post\('\/escrow\/refund',\s*authenticateUser/],
];
for (const [name, re] of authGuards) {
  check(`auth guard: ${name}`, re.test(routeSrc));
}

// sessionPhone used; client phone mismatch → 403
check('sessionPhone helper present', /function sessionPhone/.test(routeSrc));
check('buyer_phone must match session', /buyer_phone must match session/.test(routeSrc));
check('phone must match session on dispute', /phone must match session/.test(routeSrc));
check('reporter_phone must match session', /reporter_phone must match session/.test(routeSrc));

// index should not still own live (non-legacy) dispute/escrow creates without rename after wire
// We only assert module exists and has identity rules here; wire mounts separately.
check('no client-trusted createDispute(phone from body alone) in trustRoutes', !/createDispute\(\s*req\.body/.test(routeSrc));
check('escrow create uses session buyer', /createEscrow\(\s*String\(order_id\),\s*buyer/.test(routeSrc));

const failed = checks.filter((c) => !c.ok);
for (const c of checks) {
  console.log(`${c.ok ? 'PASS' : 'FAIL'}: ${c.name}${c.detail ? ' — ' + c.detail : ''}`);
}
if (failed.length) {
  console.error(`\n${failed.length} contract check(s) failed`);
  process.exit(1);
}
console.log(`\nAll ${checks.length} trustRoutes contract checks passed`);

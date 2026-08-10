import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const targets = [
  'src/middleware/auth.ts',
  'src/index.ts',
  'src/routes/chatRouter.ts',
  'public/js/kurukoo-primary-chat.js'
];
const forbidden = [
  { value: "req.query.token", reason: 'JWTs must not be accepted from URLs' },
  { value: "req.query.admin_token", reason: 'Admin tokens must not be accepted from URLs' },
  { value: '+2348030000000', reason: 'Demo/default phone identities must not ship in production paths' },
  { value: "localStorage.setItem('kurukoo_auth", reason: 'Browser auth must remain in HttpOnly cookies' }
];

const failures = [];
for (const relative of targets) {
  const file = path.join(root, relative);
  if (!fs.existsSync(file)) continue;
  const source = fs.readFileSync(file, 'utf8');
  for (const rule of forbidden) if (source.includes(rule.value)) failures.push(`${relative}: ${rule.reason} (${rule.value})`);
}

if (failures.length) {
  console.error('Security boundary audit failed:');
  failures.forEach(f => console.error(`- ${f}`));
  process.exit(1);
}
console.log('Security boundary audit passed.');

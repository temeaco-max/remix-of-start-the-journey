import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const read = (file: string) => fs.readFileSync(path.join(root, file), 'utf8');
const failures: string[] = [];

const app = read('views/app.ejs');
const shell = read('public/js/kurukoo-app-shell.js');
const routes = read('src/routes/appSurfaceRoutes.ts');

const canonicalSections = [
  'agent','discover','topics','requests','reminders','saved','cart','tasks','connect','agents','capabilities','opportunities',
  'wallet','points','top-up','subscriptions','checkout','confirmations','memory','artifacts','prayer','call','notifications','safety'
];
for (const section of canonicalSections) {
  if (!routes.includes(`['${section}'`)) failures.push(`Canonical route missing /app/${section}`);
  if (!app.includes(`/app/${section}`)) failures.push(`Web App shell has no navigation/reference to /app/${section}`);
}

const primary = ['/app/agent','/app/discover','/app/requests','/app/tasks','/app/connect'];
for (const route of primary) if (!app.includes(`href="${route}"`)) failures.push(`Primary navigation missing ${route}`);

for (const route of ['/app/agent','/app/discover','/app/requests','/app/tasks','/app/connect']) {
  if (!shell.includes(`href:'${route}'`)) failures.push(`Mobile navigation runtime missing ${route}`);
}

const legacyMap = [
  ['/discover','/app/discover'], ['/requests','/app/requests'], ['/tasks','/app/tasks'], ['/connect','/app/connect'],
  ['/cart','/app/cart'], ['/checkout','/app/checkout'], ['/confirmation','/app/confirmations'], ['/memory','/app/memory'],
  ['/safety','/app/safety'], ['/call','/app/call'], ['/points','/app/points'], ['/top-up','/app/top-up'],
  ['/subscription','/app/subscriptions'], ['/daily-picks','/app/discover'], ['/topics','/app/topics'],
] as const;
for (const [legacy, canonical] of legacyMap) {
  if (!shell.includes(`['${legacy}','${canonical}']`)) failures.push(`Legacy app handoff ${legacy} → ${canonical} missing`);
}

if (!shell.includes('normalizeAppLinks')) failures.push('Web App link-normalization flow is not mounted');
if (!app.includes('href="/chat"')) failures.push('Web App has no direct Chat recovery path');
if (!app.includes('href="/app/agent"')) failures.push('Web App has no Agent recovery path');
if (!app.includes('class="k-mobile-tabbar"')) failures.push('Mobile Web App tab bar is missing');

if (failures.length) {
  console.error('Web App screen-flow contract failed:');
  failures.forEach((failure) => console.error(`- ${failure}`));
  process.exit(1);
}
console.log(`Web App screen-flow contract passed: ${canonicalSections.length} canonical surfaces, five primary mobile/desktop destinations, legacy handoff normalization and Chat/Agent recovery paths present.`);

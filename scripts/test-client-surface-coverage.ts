import fs from 'node:fs';
import path from 'node:path';
import { CLIENT_SURFACES, MOBILE_PRIMARY_NAVIGATION } from '../src/services/clientSurfaceRegistry.js';
import { CLIENT_FEATURE_ENTRYPOINTS } from '../src/services/clientFeatureEntryPoints.js';

const root = process.cwd();
const exists = (relativePath: string) => fs.existsSync(path.join(root, relativePath));
const read = (relativePath: string) => fs.readFileSync(path.join(root, relativePath), 'utf8');
const failures: string[] = [];
const requireFile = (relativePath: string, reason: string) => { if (!exists(relativePath)) failures.push(`${reason}: missing ${relativePath}`); };

for (const [file, reason] of [
  ['public/css/kurukoo-client-foundation.css', 'Web/PWA visual authority'],
  ['public/css/kurukoo-screen-set-convergence.css', 'Visual screen-set authority'],
  ['public/css/kurukoo-visual-completion.css', 'Final visual completion authority'],
  ['public/css/kurukoo-platform-state-visual.css', 'Platform lifecycle visual authority'],
  ['public/css/kurukoo-chat-visual-completion.css', 'Chat visual completion authority'],
  ['public/css/kurukoo-workspace-visual-completion.css', 'Workspace visual completion authority'],
  ['public/css/kurukoo-api-docs.css', 'API docs visual authority'],
  ['public/css/kurukoo-visual-system.css', 'Shared visual system layer'],
  ['mobile/kurukoo-mobile/lib/visual-contract.ts', 'Native visual authority'],
  ['mobile/kurukoo-mobile/components/kurukoo-ui.tsx', 'Native shared visual primitives'],
  ['mobile/kurukoo-mobile/components/work-surface-detail.tsx', 'Native work surface visual convergence'],
  ['mobile/kurukoo-mobile/app/(tabs)/_layout.tsx', 'Native primary navigation'],
  ['public/js/kurukoo-app-shell.js', 'Web App runtime visual loader'],
  ['public/js/kurukoo-pwa.js', 'PWA lifecycle/runtime owner'],
  ['public/offline.html', 'Offline platform-state surface'],
  ['views/app.ejs', 'Canonical authenticated Web App shell'],
  ['src/routes/appSurfaceRoutes.ts', 'Canonical authenticated Web App router'],
  ['src/routes/contentRoutes.ts', 'Canonical public content/resource router'],
  ['views/resources/index.ejs', 'Resources hub frontend'],
  ['views/resources/article.ejs', 'Resource article frontend'],
  ['public/js/kurukoo-resources.js', 'Resources frontend behavior module'],
  ['src/routes/topicRoutes.ts', 'Topics route authority'],
  ['views/topics/index.ejs', 'Topics list frontend'],
  ['views/topics/detail.ejs', 'Topic detail frontend'],
  ['public/admin/index.html', 'Admin control room shell'],
  ['public/admin/ai-agents.html', 'Admin AI agents screen'],
  ['public/js/kurukoo-admin.js', 'Admin control room behavior'],
  ['public/css/admin-console.css', 'Admin agent visual authority'],
  ['docs/architecture/CLIENT_APPLICATION_CONVERGENCE.md', 'Client architecture contract'],
  ['docs/architecture/CLIENT_FEATURE_COVERAGE.md', 'Feature coverage contract'],
] as const) requireFile(file, reason);

requireFile('public/api-docs.html', 'API docs frontend');

if (CLIENT_FEATURE_ENTRYPOINTS.length < 30) failures.push(`Historical feature inventory is incomplete: expected at least 30 entrypoints, found ${CLIENT_FEATURE_ENTRYPOINTS.length}`);
const featureIds = new Set(CLIENT_FEATURE_ENTRYPOINTS.map((feature) => feature.id));
for (const required of ['food','groceries','errands','logistics','parcels','fuel','mobility','home-services','repairs','solar','automotive','health','money-circle','emergency','security','neighborhood-safety','gigs','classifieds','advertising','contributors','sports','circles','price-alerts','government','exam-results','airtime-data','universal-remote','events','hawkers','prayer']) if (!featureIds.has(required)) failures.push(`Historical capability entrypoint missing ${required}`);

const publicRoutes = read('src/routes/publicRoutes.ts');
const topicRoutes = read('src/routes/topicRoutes.ts');
const contentRoutes = read('src/routes/contentRoutes.ts');
const publicRouteExpectations = ['/chat', '/requests', '/tasks', '/connect', '/discover', '/points', '/top-up', '/subscription', '/call', '/how-it-works', '/explore', '/network', '/channels', '/help', '/partners', '/advertise', '/about', '/contact', '/pricing', '/blog', '/careers', '/api-docs'];
for (const route of publicRouteExpectations) if (!publicRoutes.includes(`router.get('${route}'`)) failures.push(`Public/compatibility Web route missing ${route}`);
if (!contentRoutes.includes("router.get('/resources'")) failures.push('Resources public route missing');
if (!contentRoutes.includes("router.get('/resources/:slug'")) failures.push('Resource detail route missing');
if (!contentRoutes.includes("router.get('/api/resources'")) failures.push('Resources API list route missing');
if (!contentRoutes.includes("router.get('/api/resources/:slug'")) failures.push('Resources API detail route missing');
if (!topicRoutes.includes("router.get('/topics'")) failures.push('Topics public/API route missing');
if (!topicRoutes.includes("router.get('/topics/:slug'")) failures.push('Topic detail route missing');

const appRouter = read('src/routes/appSurfaceRoutes.ts');
if (!appRouter.includes("router.get('/app', optionalAuthenticateUser")) failures.push('Canonical Web App root route missing');
if (!appRouter.includes('for (const section of surfaceMap.keys())')) failures.push('Canonical Web App dynamic section routing is missing');
for (const route of CLIENT_SURFACES.filter(s => s.family === 'web' && s.route.startsWith('/app/')).map(s => s.route.replace('/app/', ''))) if (!appRouter.includes(`['${route}'`)) failures.push(`Canonical Web App surface ${route} missing from surface map`);

const app = read('views/app.ejs');
if (!app.includes('href="/app/topics"')) failures.push('Authenticated Web App navigation is missing Topics');
if (!app.includes("section === 'topics'")) failures.push('Authenticated Web App has no Topics representation');
if (!app.includes('href="/topics"')) failures.push('Authenticated Web App Topics surface does not connect to canonical Topics frontend');
for (const route of ['/app/reminders', '/app/saved', '/app/cart']) if (!appRouter.includes(`['${route.replace('/app/', '')}'`)) failures.push(`Authenticated Web App surface map missing ${route}`);

const head = read('views/_partials/head.ejs');
for (const required of ['/css/kurukoo-screen-set-convergence.css', '/css/kurukoo-visual-completion.css', '/css/kurukoo-visual-system.css']) if (!head.includes(required)) failures.push(`Shared visual stylesheet is not loaded: ${required}`);
if (!head.includes('k-route-${routeSlug}')) failures.push('Route-level screen-set hook is missing');
if (!head.includes('k-screen-set-${screenSet}')) failures.push('Screen-set classification hook is missing');

const apiDocs = read('public/api-docs.html');
for (const marker of ['api-docs-shell', 'api-docs-hero', 'api-doc-card', 'api-doc-sidebar']) if (!apiDocs.includes(marker)) failures.push(`API docs visual composition missing ${marker}`);

const chat = read('public/chat/index.html');
if (!chat.includes('/js/kurukoo-pwa.js')) failures.push('Chat/PWA runtime owner missing');
if (!chat.includes('/css/kurukoo-chat.css')) failures.push('Chat base visual authority missing');
const pwa = read('public/js/kurukoo-pwa.js');
for (const marker of ['kurukoo-platform-state-visual.css', 'kurukoo-chat-visual-completion.css']) if (!pwa.includes(marker)) failures.push(`PWA runtime does not mount ${marker}`);
const workspace = read('views/workspace.ejs');
if (!workspace.includes('/css/kurukoo-workspace.css')) failures.push('Workspace base visual authority missing');
const appShell = read('public/js/kurukoo-app-shell.js');
for (const marker of ['kurukoo-visual-completion.css', 'kurukoo-platform-state-visual.css', 'kurukoo-os-final.css', 'kurukoo-os-workspace-final.css']) if (!appShell.includes(marker)) failures.push(`Web App runtime does not mount ${marker}`);

for (const [file, markers] of [
  ['views/how-it-works.ejs', ['k-screen-header', 'how-it-works-grid']],
  ['views/network.ejs', ['k-context-band', 'network-grid']],
  ['views/resources/index.ejs', ['k-screen-card', 'latest-guides-section']],
  ['views/contact.ejs', ['k-screen-set', 'contact-grid']],
  ['views/legal.ejs', ['k-legal-layout', 'k-legal-content']],
  ['views/provider-profile.ejs', ['k-screen-set', 'k-context-band', 'k-evidence-grid']],
] as const) {
  const source = read(file); for (const marker of markers) if (!source.includes(marker)) failures.push(`${file} is missing visual screen-set marker ${marker}`);
}
const completionCss = read('public/css/kurukoo-visual-completion.css');
for (const marker of ['k-route-contact', 'k-route-pricing', 'k-route-explore', 'k-screen-set-content', 'k-app-page']) if (!completionCss.includes(marker)) failures.push(`Final visual completion layer is missing ${marker}`);
const platformCss = read('public/css/kurukoo-platform-state-visual.css');
for (const marker of ['k-platform-status', 'offline-page', 'chat-runtime-banner']) if (!platformCss.includes(marker)) failures.push(`Platform lifecycle visual authority is missing ${marker}`);
const chatCompletionCss = read('public/css/kurukoo-chat-visual-completion.css');
for (const marker of ['chat-content', 'composer', 'chat-inspector']) if (!chatCompletionCss.includes(marker)) failures.push(`Chat visual completion authority is missing ${marker}`);
const workspaceCompletionCss = read('public/css/kurukoo-workspace-visual-completion.css');
for (const marker of ['chat-template-shell', 'workspace-hero-card', 'workspace-panel']) if (!workspaceCompletionCss.includes(marker)) failures.push(`Workspace visual completion authority is missing ${marker}`);

const nativeUi = read('mobile/kurukoo-mobile/components/kurukoo-ui.tsx');
for (const marker of ['PlatformStateBanner', 'EvidenceRow', 'ContinuityBand', 'StatusPill']) if (!nativeUi.includes(`function ${marker}`)) failures.push(`Native shared visual primitive missing ${marker}`);
const workSurface = read('mobile/kurukoo-mobile/components/work-surface-detail.tsx');
for (const marker of ['PlatformStateBanner', 'EvidenceRow']) if (!workSurface.includes(marker)) failures.push(`Native work surface is not consuming ${marker}`);

const admin = read('public/admin/index.html');
for (const section of ['providers', 'compliance', 'settings']) if (!admin.includes(`/admin/?section=${section}`)) failures.push(`Admin navigation missing ${section} section`);
const adminJs = read('public/js/kurukoo-admin.js');
for (const section of ['providers', 'compliance', 'settings']) if (!adminJs.includes(`section === '${section}'`)) failures.push(`Admin implementation missing ${section} panel`);
const agentAdminCss = read('public/css/admin-console.css');
for (const marker of ['runtime-readiness-card', 'agent-actions', 'test-agent-card']) if (!agentAdminCss.includes(marker)) failures.push(`Agent operational visual layer is missing ${marker}`);

for (const file of ['index.tsx', 'discover.tsx', 'requests.tsx', 'tasks.tsx', 'connect.tsx']) requireFile(`mobile/kurukoo-mobile/app/(tabs)/${file}`, 'Native surface');

const mobileTabs = read('mobile/kurukoo-mobile/app/(tabs)/_layout.tsx');
const tabExpectations: Record<string, string> = { agent: 'name="index" options={{ title: "Agent" }}', discover: 'name="discover" options={{ title: "Discover" }}', requests: 'name="requests" options={{ title: "Requests" }}', tasks: 'name="tasks" options={{ title: "Tasks" }}', connect: 'name="connect" options={{ title: "Connect" }}' };
for (const domain of MOBILE_PRIMARY_NAVIGATION) { const expected = tabExpectations[domain]; if (!expected || !mobileTabs.includes(expected)) failures.push(`Native primary navigation missing ${domain}`); }

const registryFamilies = new Set(CLIENT_SURFACES.map(surface => surface.family));
for (const family of ['web', 'pwa', 'native', 'admin']) if (!registryFamilies.has(family as never)) failures.push(`Client surface registry has no ${family} family`);

const index = read('src/index.ts');
if (!index.includes("import appSurfaceRoutes from './routes/appSurfaceRoutes.js'")) failures.push('Canonical Web App router is not imported by src/index.ts');
if (!index.includes("app.use('/',appSurfaceRoutes)")) failures.push('Canonical Web App router is not mounted by src/index.ts');
if (!index.includes("contentRoutes")) failures.push('Content/resource router is not mounted by src/index.ts');

const mobilePackage = read('mobile/kurukoo-mobile/package.json');
if (!mobilePackage.includes('expo-router')) failures.push('Native client is not an Expo Router application');
if (!mobilePackage.includes('expo-camera')) failures.push('Native client is missing camera capability required for linking/QR');
if (!mobilePackage.includes('expo-notifications')) failures.push('Native client is missing push/notification capability');

const surfaceIds = new Set(CLIENT_SURFACES.map(surface => surface.id));
for (const required of ['web-marketing', 'web-how-it-works', 'web-explore', 'web-discover-public', 'web-topics-public', 'web-network', 'web-channels', 'web-resources', 'web-help', 'web-partners', 'web-advertise', 'web-chat', 'web-topics', 'web-requests', 'web-reminders', 'web-saved', 'web-cart', 'web-tasks', 'web-connect', 'web-agents', 'web-capabilities', 'web-opportunities', 'web-wallet', 'web-points', 'web-top-up', 'web-subscriptions', 'web-checkout', 'web-confirmations', 'web-memory', 'web-notifications', 'web-artifacts', 'web-prayer', 'web-call', 'web-safety', 'pwa-shell', 'native-ios', 'native-android', 'admin-control-room', 'admin-providers', 'admin-compliance', 'admin-settings']) if (!surfaceIds.has(required)) failures.push(`Client surface registry missing ${required}`);

if (failures.length) { console.error('Kurukoo client-surface coverage failed:'); failures.forEach(failure => console.error(`- ${failure}`)); process.exit(1); }
console.log(`Kurukoo client-surface coverage passed: ${CLIENT_SURFACES.length} declared client surfaces and ${CLIENT_FEATURE_ENTRYPOINTS.length} historical capability entrypoints; public teaching, API docs, final visual completion, lifecycle states, Chat/Workspace authorities, Resources, Topics/community, Provider network, Admin/Agents, PWA/native authorities and five-domain mobile navigation present.`);
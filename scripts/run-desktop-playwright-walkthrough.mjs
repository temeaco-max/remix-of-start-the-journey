import fs from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import { chromium } from 'playwright';

const baseUrl = String(process.env.KURUKOO_E2E_BASE_URL || '').replace(/\/$/, '');
if (!baseUrl) throw new Error('KURUKOO_E2E_BASE_URL is required');

const width = Number(process.env.KURUKOO_E2E_WIDTH || 1440);
const height = Number(process.env.KURUKOO_E2E_HEIGHT || 900);
const headed = process.env.KURUKOO_E2E_HEADED === 'true';
const authCookie = String(process.env.KURUKOO_E2E_AUTH_COOKIE || '').trim();
const adminToken = String(process.env.KURUKOO_E2E_ADMIN_TOKEN || '').trim();
const outputDir = path.resolve(process.env.KURUKOO_E2E_OUTPUT || 'artifacts/desktop-walkthrough');
const failOnConsole = process.env.KURUKOO_E2E_FAIL_CONSOLE !== 'false';

const publicRoutes = [
  '/', '/explore', '/discover', '/network', '/topics', '/channels', '/about', '/help',
  '/how-it-works', '/resources', '/pricing', '/contact', '/partners', '/advertise',
  '/blog', '/careers', '/legal', '/api-docs', '/chat',
];

const appRoutes = [
  '/app', '/app/agent', '/app/discover', '/app/topics', '/app/requests', '/app/reminders',
  '/app/saved', '/app/cart', '/app/tasks', '/app/connect', '/app/agents', '/app/capabilities',
  '/app/opportunities', '/app/wallet', '/app/points', '/app/top-up', '/app/subscriptions',
  '/app/checkout', '/app/confirmations', '/app/memory', '/app/artifacts', '/app/prayer',
  '/app/call', '/app/notifications', '/app/safety',
];

const adminRoutes = [
  '/admin/', '/admin/?section=conversations', '/admin/?section=providers', '/admin/?section=economic',
  '/admin/?section=moderation', '/admin/?section=compliance', '/admin/?section=notifications',
  '/admin/?section=connectors', '/admin/?section=settings', '/admin/?section=seo',
  '/admin/ai-agents.html', '/admin/users.html', '/admin/pricing.html', '/admin/referrals.html',
  '/admin/commissions.html', '/admin/partnerships.html', '/admin/scam.html', '/admin/social.html',
  '/admin/artists.html', '/admin/celebrity.html', '/admin/analytics.html', '/admin/revenue.html',
  '/admin/marketing.html', '/admin/ads.html', '/admin/content.html', '/admin/curation.html',
  '/admin/future.html',
];

await fs.rm(outputDir, { recursive: true, force: true });
await fs.mkdir(outputDir, { recursive: true });

const browser = await chromium.launch({ headless: !headed });
const context = await browser.newContext({
  viewport: { width, height },
  deviceScaleFactor: 1,
  colorScheme: 'light',
  reducedMotion: 'reduce',
});

if (authCookie) {
  const parsed = authCookie.split(';').map((part) => part.trim()).filter(Boolean);
  const cookies = parsed.map((part) => {
    const separator = part.indexOf('=');
    if (separator < 1) return null;
    return { name: part.slice(0, separator), value: part.slice(separator + 1), url: `${baseUrl}/` };
  }).filter(Boolean);
  await context.addCookies(cookies);
}

if (adminToken) {
  await context.addInitScript((token) => {
    localStorage.setItem('kurukoo_admin', token);
  }, adminToken);
}

const results = [];

async function walk(kind, route, index) {
  const page = await context.newPage();
  const consoleErrors = [];
  const requestFailures = [];
  const httpErrors = [];

  page.on('console', (message) => {
    if (message.type() === 'error') consoleErrors.push(message.text());
  });
  page.on('requestfailed', (request) => {
    requestFailures.push(`${request.method()} ${request.url()} — ${request.failure()?.errorText || 'request failed'}`);
  });
  page.on('response', (response) => {
    if (response.status() >= 500) httpErrors.push(`${response.status()} ${response.request().method()} ${response.url()}`);
  });

  const startedAt = Date.now();
  let status = 0;
  let finalUrl = '';
  let title = '';
  let layout = {};
  let error = null;

  try {
    const response = await page.goto(`${baseUrl}${route}`, { waitUntil: 'networkidle', timeout: 45000 });
    status = response?.status() || 0;
    finalUrl = page.url();
    title = await page.title();
    layout = await page.evaluate(() => {
      const body = document.body;
      const root = document.documentElement;
      const navs = [...document.querySelectorAll('nav')].map((nav) => ({ className: nav.className, aria: nav.getAttribute('aria-label') }));
      const shellSelectors = ['.k-app-sidebar', '.k-app-header', '.k-mobile-tabbar', '.kurukoo-admin-convergence-bar'];
      const shellCounts = Object.fromEntries(shellSelectors.map((selector) => [selector, document.querySelectorAll(selector).length]));
      return {
        bodyScrollWidth: body?.scrollWidth || 0,
        viewportWidth: window.innerWidth,
        horizontalOverflow: (body?.scrollWidth || 0) > window.innerWidth + 2,
        rootHeight: root?.scrollHeight || 0,
        navs,
        shellCounts,
        authLoginVisible: Boolean(document.querySelector('a[href*="/login"], form[action*="/login"]')),
        errorText: /internal server error|application error|cannot get|not found/i.test(body?.innerText || ''),
      };
    });
    const safeRoute = route.replace(/[^a-z0-9]+/gi, '_').replace(/^_+|_+$/g, '') || 'root';
    await page.screenshot({ path: path.join(outputDir, `${String(index).padStart(3, '0')}-${kind}-${safeRoute}.png`), fullPage: true });
  } catch (caught) {
    error = caught instanceof Error ? caught.message : String(caught);
  }

  const protectedRoute = kind !== 'public';
  const unauthenticatedRedirect = protectedRoute && /\/login(?:\/|\?|$)/.test(finalUrl);
  const hardFailure = Boolean(error) || status >= 500 || layout.errorText || layout.horizontalOverflow || unauthenticatedRedirect || (failOnConsole && consoleErrors.length > 0);

  const result = {
    kind, route, status, finalUrl, title,
    durationMs: Date.now() - startedAt,
    consoleErrors, requestFailures, httpErrors,
    layout, error,
    pass: !hardFailure,
    failureReasons: [
      ...(error ? [`navigation: ${error}`] : []),
      ...(status >= 500 ? [`HTTP ${status}`] : []),
      ...(layout.errorText ? ['visible application/server error text'] : []),
      ...(layout.horizontalOverflow ? ['horizontal overflow'] : []),
      ...(unauthenticatedRedirect ? ['protected route redirected to login'] : []),
      ...(failOnConsole && consoleErrors.length ? ['browser console error'] : []),
    ],
  };
  results.push(result);
  await page.close();
}

let index = 0;
for (const route of publicRoutes) await walk('public', route, index++);
for (const route of appRoutes) await walk('app', route, index++);
for (const route of adminRoutes) await walk('admin', route, index++);

await fs.writeFile(path.join(outputDir, 'report.json'), JSON.stringify({
  baseUrl, viewport: { width, height }, generatedAt: new Date().toISOString(), results,
  summary: {
    total: results.length,
    passed: results.filter((result) => result.pass).length,
    failed: results.filter((result) => !result.pass).length,
  },
}, null, 2));

const failed = results.filter((result) => !result.pass);
console.log(JSON.stringify({
  baseUrl, viewport: `${width}x${height}`,
  total: results.length,
  passed: results.length - failed.length,
  failed: failed.length,
  failures: failed.map((result) => ({ kind: result.kind, route: result.route, reasons: result.failureReasons })),
}, null, 2));

await browser.close();
if (failed.length) process.exit(1);

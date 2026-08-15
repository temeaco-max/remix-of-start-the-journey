import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const manifest = JSON.parse(fs.readFileSync(path.join(root, 'public', 'manifest.json'), 'utf8')) as Record<string, any>;
const serviceWorker = fs.readFileSync(path.join(root, 'public', 'sw.js'), 'utf8');
const pwaClient = fs.readFileSync(path.join(root, 'public', 'js', 'kurukoo-pwa.js'), 'utf8');
const offline = fs.readFileSync(path.join(root, 'public', 'offline.html'), 'utf8');

assert.equal(manifest.id, '/chat/');
assert.equal(manifest.start_url, '/chat/');
assert.equal(manifest.display, 'standalone');
assert.ok(Array.isArray(manifest.icons) && manifest.icons.length >= 1);
assert.match(serviceWorker, /self\.skipWaiting\(\)/);
assert.match(serviceWorker, /self\.clients\.claim\(\)/);
assert.match(serviceWorker, /caches\.match\('\/offline\.html'\)/);
assert.match(serviceWorker, /url\.pathname\.startsWith\('\/api\/chat'\)/);
assert.match(serviceWorker, /url\.pathname\.startsWith\('\/admin'\)/);
assert.match(pwaClient, /navigator\.serviceWorker\.register\('\/sw\.js'/);
assert.match(pwaClient, /updateViaCache:\s*'none'/);
assert.match(pwaClient, /controllerchange/);
assert.match(pwaClient, /dataset\.pwaState/);
assert.match(pwaClient, /registered/);
assert.match(pwaClient, /update-available/);
assert.match(pwaClient, /registration-error/);
assert.match(pwaClient, /installed/);
assert.match(offline, /id="retry-button"/);

console.log('PWA contract passed: standalone Chat launch, service-worker update lifecycle, offline fallback, and dynamic route exclusions are present.');

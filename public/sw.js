const STATIC_CACHE = 'kurukoo-static-v3';
const PAGES_CACHE = 'kurukoo-pages-v3';
const PWA_SHELL_CACHE = 'kurukoo-pwa-shell-v3';

const ALLOWED_CACHES = [STATIC_CACHE, PAGES_CACHE, PWA_SHELL_CACHE];

// Assets required for PWA offline shell
const SHELL_ASSETS = [
    '/dashboard.html',
    '/css/site.css',
    '/js/app.js',
    '/js/referral.js',
    '/js/deviceCommands.js',
    '/manifest.json',
    '/sw.js',
    '/offline.html',
    '/assets/icons/icon-192.svg',
    '/assets/icons/icon-512.svg'
];

// Static pages & public APIs for Stale-While-Revalidate caching
const PAGES_TO_CACHE = [
    '/',
    '/ng/',
    '/gh/',
    '/gb/',
    '/pricing',
    '/about',
    '/contact',
    '/help',
    '/blog',
    '/api/hero-taglines',
    '/api/emergency/contacts'
];

// Install Event: Pre-cache PWA shell and core public pages
self.addEventListener('install', (e) => {
    e.waitUntil(
        Promise.all([
            caches.open(PWA_SHELL_CACHE).then((cache) => cache.addAll(SHELL_ASSETS)),
            caches.open(PAGES_CACHE).then((cache) => cache.addAll(PAGES_TO_CACHE.map(p => new Request(p, { cache: 'reload' }))).catch(() => {}))
        ]).then(() => self.skipWaiting())
    );
});

// Activate Event: Clean up old cache versions
self.addEventListener('activate', (e) => {
    e.waitUntil(
        caches.keys().then((keys) => {
            return Promise.all(
                keys.map((key) => {
                    if (!ALLOWED_CACHES.includes(key)) {
                        return caches.delete(key);
                    }
                })
            );
        }).then(() => self.clients.claim())
    );
});

// Fetch Event: Smart Cache Strategy (Cache-First for Static, Stale-While-Revalidate for HTML/Public APIs, Network-Only for User/Dynamic Data)
self.addEventListener('fetch', (e) => {
    const request = e.request;
    const url = new URL(request.url);

    // 1. Only handle GET requests
    if (request.method !== 'GET') return;

    // 2. EXPLICIT DO NOT CACHE LIST (Always Network Only)
    if (
        url.pathname.startsWith('/admin') ||
        url.pathname.startsWith('/api/messages') ||
        url.pathname.startsWith('/api/dashboard') ||
        url.pathname.startsWith('/api/profile') ||
        url.pathname.startsWith('/api/credits') ||
        url.pathname.startsWith('/api/pulse') ||
        url.pathname.startsWith('/api/rides') ||
        url.pathname.startsWith('/api/survey') ||
        url.pathname.startsWith('/api/order') ||
        url.pathname.startsWith('/webhook') ||
        url.pathname.startsWith('/ussd')
    ) {
        return; // Let browser perform standard network fetch
    }

    // 3. PWA Shell Navigation (/dashboard.html) - Network First with Cache/Offline Fallback
    if (url.pathname === '/dashboard.html') {
        e.respondWith(
            fetch(request)
                .then((networkResponse) => {
                    if (networkResponse && networkResponse.status === 200) {
                        const clone = networkResponse.clone();
                        caches.open(PWA_SHELL_CACHE).then((cache) => cache.put(request, clone));
                    }
                    return networkResponse;
                })
                .catch(() => {
                    return caches.match(request).then((cached) => cached || caches.match('/offline.html'));
                })
        );
        return;
    }

    // 4. Static Assets (Cache-First Strategy)
    const isStaticAsset =
        url.pathname.startsWith('/css/') ||
        url.pathname.startsWith('/js/') ||
        url.pathname.startsWith('/assets/') ||
        url.pathname === '/manifest.json' ||
        url.hostname.includes('fonts.googleapis.com') ||
        url.hostname.includes('fonts.gstatic.com') ||
        url.hostname.includes('unpkg.com');

    if (isStaticAsset) {
        e.respondWith(
            caches.match(request).then((cachedResponse) => {
                if (cachedResponse) return cachedResponse;

                return fetch(request)
                    .then((networkResponse) => {
                        if (networkResponse && networkResponse.status === 200) {
                            const responseToCache = networkResponse.clone();
                            caches.open(STATIC_CACHE).then((cache) => cache.put(request, responseToCache));
                        }
                        return networkResponse;
                    })
                    .catch(() => cachedResponse);
            })
        );
        return;
    }

    // 5. HTML Pages & Public APIs (Stale-While-Revalidate Strategy)
    const isHtmlPageOrPublicApi =
        request.mode === 'navigate' ||
        request.headers.get('accept')?.includes('text/html') ||
        url.pathname.startsWith('/api/pricing') ||
        url.pathname.startsWith('/api/blog') ||
        url.pathname.startsWith('/api/hero-taglines') ||
        url.pathname.startsWith('/api/emergency/contacts');

    if (isHtmlPageOrPublicApi) {
        e.respondWith(
            caches.open(PAGES_CACHE).then((cache) => {
                return cache.match(request).then((cachedResponse) => {
                    const fetchPromise = fetch(request)
                        .then((networkResponse) => {
                            if (networkResponse && networkResponse.status === 200) {
                                cache.put(request, networkResponse.clone());
                            }
                            return networkResponse;
                        })
                        .catch(() => {
                            if (request.mode === 'navigate' || request.headers.get('accept')?.includes('text/html')) {
                                return caches.match('/offline.html');
                            }
                            return cachedResponse;
                        });

                    return cachedResponse || fetchPromise;
                });
            })
        );
        return;
    }
});

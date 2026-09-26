/* Kurukoo PWA service worker — app-shell caching with safe defaults.
 * - Static assets (JS/CSS/images/fonts): cache-first, versioned by CACHE.
 * - Navigations and /api/*, /backend/*: network-first with cache fallback for
 *   navigations only; API calls always go to network (never serve stale data).
 * - Push stays with firebase-messaging-sw.js; this worker does not claim it.
 */
const CACHE = "kurukoo-shell-v1";
const STATIC_RE = /\.(?:js|css|png|jpe?g|webp|svg|woff2?|ico|json)(?:\?.*)?$/i;

self.addEventListener("install", (event) => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)));
      await self.clients.claim();
    })(),
  );
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.pathname.startsWith("/api/") || url.pathname.startsWith("/backend/")) return;
  if (req.mode === "navigate") {
    event.respondWith(
      (async () => {
        try {
          const fresh = await fetch(req);
          const cache = await caches.open(CACHE);
          cache.put(req, fresh.clone()).catch(() => undefined);
          return fresh;
        } catch {
          const cached = await caches.match(req);
          return cached || Response.error();
        }
      })(),
    );
    return;
  }
  if (STATIC_RE.test(url.pathname)) {
    event.respondWith(
      (async () => {
        const cached = await caches.match(req);
        if (cached) return cached;
        const fresh = await fetch(req);
        if (fresh && fresh.ok) {
          const cache = await caches.open(CACHE);
          cache.put(req, fresh.clone()).catch(() => undefined);
        }
        return fresh;
      })(),
    );
  }
});

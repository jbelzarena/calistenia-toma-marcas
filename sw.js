/* Calistenia Valencia — minimal service worker.
 * - App shell (HTML/CSS/JS/logo): cache-first.
 * - data.json:                    network-first with cache fallback.
 * - Cross-origin (Chart.js, photos): network with passive cache. */

const VERSION = 'cv-v5';
const SHELL = [
    './',
    './index.html',
    './user.html',
    './admin.html',
    './styles.css?v=5',
    './user-styles.css?v=5',
    './admin.css',
    './script.js?v=5',
    './user.js?v=5',
    './admin.js',
    './calculations.js?v=5',
    './manifest.json',
    './logo.png',
    './logo-palabra.jpg'
];

self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(VERSION).then(cache => cache.addAll(SHELL).catch(() => { /* ignore missing */ }))
    );
    self.skipWaiting();
});

self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then(keys =>
            Promise.all(keys.filter(k => k !== VERSION).map(k => caches.delete(k))))
    );
    self.clients.claim();
});

self.addEventListener('fetch', (event) => {
    const req = event.request;
    if (req.method !== 'GET') return;
    const url = new URL(req.url);

    // Network-first for data.json so admin updates show up.
    if (url.pathname.endsWith('/data.json') || url.pathname.endsWith('data.json')) {
        event.respondWith(
            fetch(req).then(res => {
                const copy = res.clone();
                caches.open(VERSION).then(c => c.put(req, copy)).catch(() => { });
                return res;
            }).catch(() => caches.match(req))
        );
        return;
    }

    // Network-first for goals.json (synced via GitHub) — never serve stale by default.
    if (url.pathname.endsWith('/goals.json') || url.pathname.endsWith('goals.json')) {
        event.respondWith(
            fetch(req, { cache: 'no-store' }).then(res => {
                const copy = res.clone();
                caches.open(VERSION).then(c => c.put(req, copy)).catch(() => { });
                return res;
            }).catch(() => caches.match(req))
        );
        return;
    }

    // Same-origin: cache-first with background refresh.
    if (url.origin === self.location.origin) {
        event.respondWith(
            caches.match(req).then(cached => {
                const fetched = fetch(req).then(res => {
                    const copy = res.clone();
                    caches.open(VERSION).then(c => c.put(req, copy)).catch(() => { });
                    return res;
                }).catch(() => cached);
                return cached || fetched;
            })
        );
        return;
    }

    // Cross-origin: try network, fall back to cache (for offline browsing of athlete photos / Chart.js CDN).
    event.respondWith(
        fetch(req).then(res => {
            if (res && res.ok) {
                const copy = res.clone();
                caches.open(VERSION).then(c => c.put(req, copy)).catch(() => { });
            }
            return res;
        }).catch(() => caches.match(req))
    );
});

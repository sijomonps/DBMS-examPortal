const CACHE_PREFIX = 'sqlab-v';
const CACHE_NAME = 'sqlab-v8';
const ASSETS_TO_CACHE = [
    './',
    './index.html',
    './exam.html',
    './admin.html',
    './css/style.css',
    './css/style.css?v=20260328-4',
    './css/offline-indicator.css',
    './css/offline-indicator.css?v=20260328-2',
    './js/config.js',
    './js/db.js',
    './js/sqlengine.js',
    './js/editor.js',
    // External resources cached for offline execution
    'https://cdnjs.cloudflare.com/ajax/libs/sql.js/1.8.0/sql-wasm.js',
    'https://cdnjs.cloudflare.com/ajax/libs/sql.js/1.8.0/sql-wasm.wasm'
];

self.addEventListener('install', (event) => {
    event.waitUntil(
        caches
            .open(CACHE_NAME)
            .then((cache) => cache.addAll(ASSETS_TO_CACHE))
            .then(() => self.skipWaiting())
    );
});

self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches
            .keys()
            .then((keys) => {
                const oldKeys = keys.filter((key) => key.startsWith(CACHE_PREFIX) && key !== CACHE_NAME);
                return Promise.all(oldKeys.map((key) => caches.delete(key)));
            })
            .then(() => self.clients.claim())
    );
});

const cacheable = (response) => response && (response.status === 200 || response.type === 'opaque');

const cacheFirst = async (request) => {
    const cached = await caches.match(request);
    if (cached) {
        return cached;
    }

    const networkResponse = await fetch(request);
    if (cacheable(networkResponse)) {
        const cache = await caches.open(CACHE_NAME);
        cache.put(request, networkResponse.clone());
    }
    return networkResponse;
};

const networkFirst = async (request) => {
    try {
        const networkResponse = await fetch(request);
        if (cacheable(networkResponse)) {
            const cache = await caches.open(CACHE_NAME);
            cache.put(request, networkResponse.clone());
        }
        return networkResponse;
    } catch (error) {
        const cached = await caches.match(request);
        if (cached) {
            return cached;
        }
        return new Response('Offline and no cached copy available.', {
            status: 503,
            statusText: 'Service Unavailable'
        });
    }
};

self.addEventListener('fetch', (event) => {
    if (event.request.method !== 'GET') {
        return;
    }

    const requestUrl = new URL(event.request.url);
    const sameOrigin = requestUrl.origin === self.location.origin;

    // Do not intercept third-party requests (Firebase/Firestore/CDN/etc) except pre-cached assets.
    if (!sameOrigin) {
        return;
    }

    const isDocument = event.request.mode === 'navigate' || event.request.destination === 'document';
    const isStyle = event.request.destination === 'style';
    const isScript = event.request.destination === 'script';

    if (sameOrigin && (isDocument || isStyle || isScript)) {
        event.respondWith(networkFirst(event.request));
        return;
    }

    event.respondWith(cacheFirst(event.request));
});

const CACHE_NAME = 'sqlab-v1';
const ASSETS_TO_CACHE = [
    './',
    './index.html',
    './exam.html',
    './css/style.css',
    './js/config.js',
    './js/db.js',
    './js/sqlengine.js',
    './js/editor.js',
    // External resources that we should cache
    'https://cdnjs.cloudflare.com/ajax/libs/sql.js/1.8.0/sql-wasm.js',
    'https://cdnjs.cloudflare.com/ajax/libs/sql.js/1.8.0/sql-wasm.wasm'
    // Firebase libraries are complex to cache manually so we rely on Firestore's native offline persistence
];

self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            console.log('Opened cache');
            return cache.addAll(ASSETS_TO_CACHE);
        })
    );
});

self.addEventListener('fetch', (event) => {
    // Basic cache-first strategy for defined assets
    if (event.request.method === 'GET') {
        event.respondWith(
            caches.match(event.request).then((response) => {
                if (response) {
                    return response; // Return from cache
                }
                
                // Fetch from network
                return fetch(event.request).then((networkResponse) => {
                    // Update cache for GET requests, excluding APIs and fonts
                    if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') {
                        return networkResponse;
                    }
                    
                    const responseToCache = networkResponse.clone();
                    caches.open(CACHE_NAME).then((cache) => {
                        cache.put(event.request, responseToCache);
                    });
                    
                    return networkResponse;
                }).catch(() => {
                    // Fallback for offline if not in cache (could return an offline page here)
                });
            })
        );
    }
});

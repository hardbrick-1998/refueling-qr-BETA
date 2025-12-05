// 🚀 SERVICE WORKER - V1.0
// Handles offline caching & background sync

const CACHE_NAME = 'qr-scanner-v1';
const VERSION = '1.0';

// 📋 Assets untuk cache (saat install)
const URLS_TO_CACHE = [
  '/',
  '/index.html',
  '/manifest.json'
];

// ✅ INSTALL EVENT - Cache assets pertama kali
self.addEventListener('install', (event) => {
  console.log('[SW] Installing Service Worker v' + VERSION);
  
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[SW] Caching app shell');
      return cache.addAll(URLS_TO_CACHE);
    }).catch((err) => {
      console.error('[SW] Install error:', err);
    })
  );
  
  // Langsung activate (jangan menunggu)
  self.skipWaiting();
});

// ✅ ACTIVATE EVENT - Hapus cache lama
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating Service Worker');
  
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('[SW] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  
  // Langsung jadi active
  self.clients.claim();
});

// ✅ FETCH EVENT - Intercept network requests
self.addEventListener('fetch', (event) => {
  // Ignore non-GET requests
  if (event.request.method !== 'GET') {
    return;
  }
  
  // Ignore chrome extensions
  if (event.request.url.startsWith('chrome-extension://')) {
    return;
  }
  
  event.respondWith(
    // ⚡ STRATEGY: Network-first, fallback to cache
    fetch(event.request)
      .then((response) => {
        // Kalau berhasil, cache untuk next time
        if (response.ok) {
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseClone);
          });
        }
        return response;
      })
      .catch(() => {
        // Kalau network error, gunakan cache
        console.log('[SW] Network error, using cache for:', event.request.url);
        return caches.match(event.request).then((cachedResponse) => {
          if (cachedResponse) {
            return cachedResponse;
          }
          // Jika tidak ada di cache, return error page
          return new Response('Offline - Page not cached', {
            status: 503,
            statusText: 'Service Unavailable',
            headers: new Headers({
              'Content-Type': 'text/plain'
            })
          });
        });
      })
  );
});

console.log('[SW] Service Worker loaded');

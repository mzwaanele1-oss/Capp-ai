// CAPP AI Service Worker - v1.0.0
const CACHE_NAME = 'capp-ai-shell-v1';
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.webmanifest',
  '/manifest.json',
  '/icon.svg',
  '/icon-maskable.svg',
  '/pwa-192x192.png',
  '/pwa-512x512.png',
  '/pwa-maskable-512x512.png',
  '/apple-touch-icon.png',
];

// Install Event: Precaching App Shell
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS).catch((err) => {
        console.warn('Pre-caching some assets failed:', err);
      });
    }).then(() => self.skipWaiting())
  );
});

// Activate Event: Clean old caches and claim clients
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Listen for SKIP_WAITING message from update UI
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

// Fetch Event Strategy:
// 1. /api/*: Network-only. Never cache private chats. If offline, return friendly JSON offline status.
// 2. Navigation (HTML): Network-first with cache fallback to /index.html.
// 3. Static Assets (JS, CSS, images, fonts): Stale-While-Revalidate.
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Bypass non-GET requests (e.g. POST /api/chat)
  if (event.request.method !== 'GET') {
    if (url.pathname.startsWith('/api/')) {
      event.respondWith(
        fetch(event.request).catch(() => {
          return new Response(
            JSON.stringify({
              error: 'CAPP AI is offline. AI responses require an active internet connection.',
              isOffline: true,
            }),
            {
              status: 503,
              headers: { 'Content-Type': 'application/json' },
            }
          );
        })
      );
    }
    return;
  }

  // Handle API GET requests (e.g. /api/health)
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(
      fetch(event.request).catch(() => {
        return new Response(
          JSON.stringify({
            status: 'offline',
            message: 'CAPP AI is offline.',
          }),
          {
            status: 503,
            headers: { 'Content-Type': 'application/json' },
          }
        );
      })
    );
    return;
  }

  // HTML Navigation: Network-First with fallback to cached index.html
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const responseClone = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, responseClone));
          }
          return networkResponse;
        })
        .catch(async () => {
          const cache = await caches.open(CACHE_NAME);
          const cached = await cache.match('/index.html') || await cache.match('/');
          return cached || new Response('CAPP AI is currently offline. Please reconnect to continue.', {
            headers: { 'Content-Type': 'text/html' }
          });
        })
    );
    return;
  }

  // Static Assets: Stale-While-Revalidate
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      const fetchPromise = fetch(event.request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const responseClone = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, responseClone));
          }
          return networkResponse;
        })
        .catch(() => cachedResponse);

      return cachedResponse || fetchPromise;
    })
  );
});

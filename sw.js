const CACHE_NAME = 'moukaeritai-v0.2.0-20260114071500';
const ASSETS = [
  '/',
  '/index.html',
  '/style.css',
  '/script.js',
  '/manifest.json',
  '/experimental-layout-1.html',
  '/components/ring-carousel-item.js',
  '/components/ring-carousel.js',
  '/pictgram/64x64.webp/slate_teal.webp'
];

self.addEventListener('install', (event) => {
  // skipWaiting is now triggered by UI interaction
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(ASSETS))
  );
});

self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

// Helper to clean response
const cleanResponse = (response) => {
  if (!response.redirected) return response;

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers: response.headers
  });
};

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        if (response) {
          return cleanResponse(response);
        }

        // Fix for "redirect mode is not follow" error on navigation
        if (event.request.mode === 'navigate') {
          return fetch(event.request.url).then(cleanResponse);
        }

        return fetch(event.request);
      })
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    Promise.all([
      self.clients.claim(),
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== CACHE_NAME) {
              return caches.delete(cacheName);
            }
          })
        );
      })
    ])
  );
});

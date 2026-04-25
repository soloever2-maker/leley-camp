const CACHE = 'leley-v1';

const ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/images/hero.jpg',
  '/images/logo.jpg',
  '/images/camp-exterior.jpg',
  '/images/cabin-1.jpg',
  '/images/cabin-2.jpg',
  '/images/cabin-3.jpg',
  '/images/yoga.jpg',
  '/images/reef.jpg',
  '/images/beach.jpg',
  '/images/food-1.jpg',
  '/images/food-2.jpg',
  '/images/food-3.jpg',
  '/images/icon-192.png',
  '/images/icon-512.png',
];

// Install: cache everything
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(c => c.addAll(ASSETS))
  );
  self.skipWaiting();
});

// Activate: remove old caches
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Fetch: cache-first for images, network-first for HTML
self.addEventListener('fetch', e => {
  const { request } = e;
  const url = new URL(request.url);

  // Skip non-GET and external requests (like countapi)
  if (request.method !== 'GET' || url.origin !== self.location.origin) return;

  if (request.destination === 'image') {
    // Cache-first for images
    e.respondWith(
      caches.match(request).then(cached =>
        cached || fetch(request).then(res => {
          const clone = res.clone();
          caches.open(CACHE).then(c => c.put(request, clone));
          return res;
        })
      )
    );
  } else {
    // Network-first for HTML (so updates deploy instantly)
    e.respondWith(
      fetch(request)
        .then(res => {
          const clone = res.clone();
          caches.open(CACHE).then(c => c.put(request, clone));
          return res;
        })
        .catch(() => caches.match(request))
    );
  }
});

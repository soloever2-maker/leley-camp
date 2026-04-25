const CACHE = 'leley-v2';

const ASSETS = [
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
  '/images/og-image.jpg',
];

// ── Install ───────────────────────────────────────────
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(cache => cache.addAll(ASSETS))
  );
  self.skipWaiting();
});

// ── Activate: clear old caches ────────────────────────
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// ── Fetch ─────────────────────────────────────────────
self.addEventListener('fetch', e => {
  const { request } = e;
  const url = new URL(request.url);

  // Skip non-GET and cross-origin (countapi, fonts, etc.)
  if (request.method !== 'GET' || url.origin !== self.location.origin) return;

  // THE FIX: any navigation (page load / PWA launch from home screen)
  // always resolves to /index.html — avoids the 404 on "/"
  if (request.mode === 'navigate') {
    e.respondWith(
      caches.match('/index.html').then(cached =>
        cached ||
        fetch('/index.html').then(res => {
          caches.open(CACHE).then(c => c.put('/index.html', res.clone()));
          return res;
        })
      )
    );
    return;
  }

  // Images → cache-first
  if (request.destination === 'image') {
    e.respondWith(
      caches.match(request).then(cached =>
        cached ||
        fetch(request).then(res => {
          caches.open(CACHE).then(c => c.put(request, res.clone()));
          return res;
        })
      )
    );
    return;
  }

  // Everything else → network-first, fallback to cache
  e.respondWith(
    fetch(request)
      .then(res => {
        caches.open(CACHE).then(c => c.put(request, res.clone()));
        return res;
      })
      .catch(() => caches.match(request))
  );
});

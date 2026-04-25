const CACHE = 'leley-v3';
const BASE  = self.registration.scope; // works on both / and /leley-camp/

const ASSETS = [
  'index.html',
  'manifest.json',
  'images/hero.jpg',
  'images/logo.jpg',
  'images/camp-exterior.jpg',
  'images/cabin-1.jpg',
  'images/cabin-2.jpg',
  'images/cabin-3.jpg',
  'images/yoga.jpg',
  'images/reef.jpg',
  'images/beach.jpg',
  'images/food-1.jpg',
  'images/food-2.jpg',
  'images/food-3.jpg',
  'images/icon-192.png',
  'images/icon-512.png',
  'images/og-image.jpg',
].map(a => BASE + a);

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)));
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', e => {
  const { request } = e;
  const url = new URL(request.url);
  if (request.method !== 'GET' || url.origin !== self.location.origin) return;

  // Navigation → always serve index.html
  if (request.mode === 'navigate') {
    e.respondWith(
      caches.match(BASE + 'index.html').then(cached =>
        cached || fetch(BASE + 'index.html').then(res => {
          caches.open(CACHE).then(c => c.put(BASE + 'index.html', res.clone()));
          return res;
        })
      )
    );
    return;
  }

  // Images & video → cache-first
  if (request.destination === 'image' || request.destination === 'video') {
    e.respondWith(
      caches.match(request).then(cached =>
        cached || fetch(request).then(res => {
          caches.open(CACHE).then(c => c.put(request, res.clone()));
          return res;
        })
      )
    );
    return;
  }

  // Everything else → network-first
  e.respondWith(
    fetch(request).then(res => {
      caches.open(CACHE).then(c => c.put(request, res.clone()));
      return res;
    }).catch(() => caches.match(request))
  );
});

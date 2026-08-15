const CACHE_NAME = 'rickfinance-v1';
const ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './Gemini_Generated_Image_ftfkw8ftfkw8ftfk.jfif'
];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS);
    })
  );
});

self.addEventListener('fetch', (e) => {
  e.respondWith(
    caches.match(e.request).then((response) => {
      return response || fetch(e.request);
    })
  );
});

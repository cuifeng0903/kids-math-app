// PWA Service Worker（GitHub Pages /kids-math-app/ 配下公開対応）
const CACHE_NAME = 'mathkids-v1.1.2-20251031';
const BASE = '/kids-math-app/';
const ASSETS = [
  BASE,
  BASE + 'index.html',
  BASE + 'manifest.webmanifest',
  BASE + 'sw.js',
  BASE + 'apple-touch-icon.png',
  BASE + 'icon-192.png',
  BASE + 'icon-512.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(ASSETS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.map((key) => (key !== CACHE_NAME) ? caches.delete(key) : null)))
      .then(() => self.clients.claim())
  );
});

// HTMLナビゲーション：ネット優先→失敗時 index.html（オフラインでも動作）
self.addEventListener('fetch', (event) => {
  const req = event.request;

  if (req.mode === 'navigate') {
    event.respondWith(
      fetch(req).catch(() => caches.match(BASE + 'index.html'))
    );
    return;
  }

  // その他：キャッシュ優先
  event.respondWith(
    caches.match(req).then((res) => res || fetch(req))
  );
});

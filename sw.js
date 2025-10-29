// シンプルなPWAキャッシュ（静的アセット）
// 事前キャッシュ → ネット優先＋フォールバック
const CACHE_NAME = 'mathkids-v1-20251029';
const ASSETS = [
  './',
  './index.html',
  './manifest.webmanifest',
  './apple-touch-icon.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS))
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.map((key) => {
        if (key !== CACHE_NAME) return caches.delete(key);
      }))
    )
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  // HTMLはネット優先、失敗したらキャッシュ
  if (req.mode === 'navigate') {
    event.respondWith(
      fetch(req).catch(() => caches.match('./index.html'))
    );
    return;
  }
  // その他はキャッシュ優先・なければネット
  event.respondWith(
    caches.match(req).then((res) => res || fetch(req))
  );
});

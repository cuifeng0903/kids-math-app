// PWA Service Worker（GitHub Pages /kids-math-app/ 配下公開対応）
const CACHE_NAME = 'mathkids-v1.1.1-20251031';
const BASE = '/kids-math-app/';
const ASSETS = [
  BASE,
  BASE + 'index.html',
  BASE + 'manifest.webmanifest',
  BASE + 'sw.js',
  BASE + 'apple-touch-icon.png',
  // 追加アイコン（存在すればキャッシュ）
  BASE + 'icon-192.png',
  BASE + 'icon-512.png'
];

// Install: 事前キャッシュ
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS)).then(() => self.skipWaiting())
  );
});

// Activate: 古いキャッシュ削除
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.map((key) => {
        if (key !== CACHE_NAME) return caches.delete(key);
      }))
    ).then(() => self.clients.claim())
  );
});

// Fetch: ナビゲーションはネット優先→失敗時 index.html、その他はキャッシュ優先
self.addEventListener('fetch', (event) => {
  const req = event.request;

  // HTMLナビゲーション（ブラウザのアドレス遷移）
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

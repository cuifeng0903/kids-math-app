/* Ver.1.1.3 Fix2：/kids-math-app/ スコープ対応・堅牢化 */
const VERSION    = 'v1.1.3-fix2';
const CACHE_NAME = `kids-math-app-${VERSION}`;

const BASE      = new URL(self.registration.scope).pathname;
const BASE_PATH = BASE.endsWith('/') ? BASE : (BASE + '/');

const PRE_CACHE = [
  BASE_PATH,
  BASE_PATH + 'index.html',
  BASE_PATH + 'manifest.webmanifest',
  BASE_PATH + 'apple-touch-icon.png',
  BASE_PATH + 'icon-192.png',
  BASE_PATH + 'icon-512.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE_NAME);
    await Promise.allSettled(PRE_CACHE.map(async (url) => {
      try {
        const res = await fetch(url, { cache: 'no-cache' });
        if (res.ok) { await cache.put(url, res.clone()); }
      } catch {}
    }));
    await self.skipWaiting();
  })());
});

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)));
    if ('navigationPreload' in self.registration) {
      try { await self.registration.navigationPreload.enable(); } catch {}
    }
    await self.clients.claim();
  })());
});

/* navigate: ネットワーク優先 → 失敗時 index.html
   静的: キャッシュ優先 + バックグラウンド更新 */
self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;

  if (req.mode === 'navigate') {
    event.respondWith((async () => {
      try {
        const preload = await event.preloadResponse;
        if (preload) return preload;

        const fresh = await fetch(req);
        const cache = await caches.open(CACHE_NAME);
        cache.put(BASE_PATH + 'index.html', fresh.clone());
        return fresh;
      } catch {
        const cached = await caches.match(BASE_PATH + 'index.html', { ignoreSearch: true });
        return cached || new Response('Offline', { status: 503, statusText: 'Offline' });
      }
    })());
    return;
  }

  event.respondWith((async () => {
    const cached = await caches.match(req, { ignoreSearch: true });
    if (cached) {
      fetch(req).then(async (res) => {
        try {
          const cache = await caches.open(CACHE_NAME);
          cache.put(req, res.clone());
        } catch {}
      }).catch(() => {});
      return cached;
    }

    try {
      const res = await fetch(req);
      const cache = await caches.open(CACHE_NAME);
      cache.put(req, res.clone());
      return res;
    } catch {
      return new Response('', { status: 404 });
    }
  })());
});

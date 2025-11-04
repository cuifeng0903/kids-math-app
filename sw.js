/* Ver.1.1.3 Fix2 版: GitHub Pages /kids-math-app/ スコープ対応 + シンプルオフライン */
const VERSION     = 'v1.1.3-fix2';
const CACHE_NAME  = `kids-math-app-${VERSION}`;

/* 有効スコープ（/kids-math-app/）を取得し、ベースパス化 */
const BASE        = new URL(self.registration.scope).pathname;
const ensureSlash = (p) => (p.endsWith('/') ? p : p + '/');
const BASE_PATH   = ensureSlash(BASE);

/* プリキャッシュ（単一ファイル構成なので最小限） */
const ASSETS = [
  BASE_PATH,                     // /kids-math-app/
  BASE_PATH + 'index.html',
  BASE_PATH + 'manifest.webmanifest',
  BASE_PATH + 'icons/icon-192.png',
  BASE_PATH + 'icons/icon-512.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(ASSETS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)));

    // Navigation Preload（対応ブラウザでネットワーク優先の初期レスポンスを高速化）
    if ('navigationPreload' in self.registration) {
      try { await self.registration.navigationPreload.enable(); } catch {}
    }
    await self.clients.claim();
  })());
});

/* 戦略:
   - navigate（ページ遷移）: ネットワーク優先 → オフライン時 index.html フォールバック
   - 静的リソース: キャッシュ優先 + バックグラウンド更新
*/
self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;

  // ページ遷移
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

  // 静的リソース
  event.respondWith((async () => {
    const cached = await caches.match(req, { ignoreSearch: true });
    if (cached) {
      // バックグラウンド更新（失敗は握りつぶし）
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

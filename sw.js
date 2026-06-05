// ════════════════════════════════════════════
// Service Worker - サイボクファーム カレンダー PWA
// ════════════════════════════════════════════

const CACHE_NAME = 'saiboku-calendar-v1';

// キャッシュするリソース
const STATIC_ASSETS = [
  './index.html',
  './manifest.json',
  './config.js',
  'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2',
  'https://cdn.jsdelivr.net/npm/jszip@3.10.1/dist/jszip.min.js'
];

// ── インストール：静的リソースをキャッシュ
self.addEventListener('install', event => {
  console.log('[SW] インストール中...');
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      // 個別にキャッシュ（一部失敗しても続行）
      return Promise.allSettled(
        STATIC_ASSETS.map(url =>
          cache.add(url).catch(err => {
            console.warn('[SW] キャッシュ失敗:', url, err);
          })
        )
      );
    }).then(() => {
      console.log('[SW] インストール完了');
      return self.skipWaiting();
    })
  );
});

// ── アクティベート：古いキャッシュを削除
self.addEventListener('activate', event => {
  console.log('[SW] アクティベート中...');
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames
          .filter(name => name !== CACHE_NAME)
          .map(name => {
            console.log('[SW] 古いキャッシュを削除:', name);
            return caches.delete(name);
          })
      );
    }).then(() => {
      console.log('[SW] アクティベート完了');
      return self.clients.claim();
    })
  );
});

// ── フェッチ：キャッシュ優先 + ネットワークフォールバック
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);

  // Supabase APIリクエストはキャッシュしない（常にネットワーク）
  if (url.hostname.includes('supabase.co')) {
    event.respondWith(
      fetch(event.request).catch(() => {
        return new Response(
          JSON.stringify({ error: 'オフラインのため接続できません' }),
          { headers: { 'Content-Type': 'application/json' } }
        );
      })
    );
    return;
  }

  // 静的リソース：キャッシュ優先、なければネットワーク
  event.respondWith(
    caches.match(event.request).then(cached => {
      if (cached) {
        // バックグラウンドでキャッシュを更新（Stale-While-Revalidate）
        const fetchPromise = fetch(event.request).then(response => {
          if (response && response.status === 200) {
            const responseClone = response.clone();
            caches.open(CACHE_NAME).then(cache => {
              cache.put(event.request, responseClone);
            });
          }
          return response;
        }).catch(() => {});
        return cached;
      }
      // キャッシュになければネットワークから取得
      return fetch(event.request).then(response => {
        if (!response || response.status !== 200 || response.type === 'opaque') {
          return response;
        }
        const responseClone = response.clone();
        caches.open(CACHE_NAME).then(cache => {
          cache.put(event.request, responseClone);
        });
        return response;
      }).catch(() => {
        // オフライン時のフォールバック
        if (event.request.destination === 'document') {
          return caches.match('./index.html');
        }
      });
    })
  );
});

// ── バックグラウンド同期（将来の拡張用）
self.addEventListener('sync', event => {
  if (event.tag === 'sync-calendar') {
    console.log('[SW] バックグラウンド同期:', event.tag);
  }
});

// ── プッシュ通知（将来の拡張用）
self.addEventListener('push', event => {
  if (event.data) {
    const data = event.data.json();
    self.registration.showNotification(data.title || 'サイボクカレンダー', {
      body: data.body || '',
      icon: './icons/icon-192.png',
      badge: './icons/icon-192.png'
    });
  }
});

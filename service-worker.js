/*
 * service-worker.js — Floor Manager
 * Gold Coins Casino System
 * AUTO-UPDATE: Detects new version, clears old cache, reloads all clients silently.
 * Bump CACHE_VER on every release — everything else is automatic.
 */
var CACHE_VER = 'floor-v1.1';

var CACHE_URLS = ['./index.html','./manifest.json','./icons/icon-192x192.png','./icons/icon-512x512.png'];

self.addEventListener('install', function(e) {
  e.waitUntil(
    caches.open(CACHE_VER)
      .then(function(cache) {
        return cache.addAll(CACHE_URLS).catch(function(err) {
          console.warn('[SW] Pre-cache failed (non-fatal):', err);
        });
      })
      .then(function() { return self.skipWaiting(); })
  );
});

self.addEventListener('activate', function(e) {
  e.waitUntil(
    caches.keys()
      .then(function(keys) {
        return Promise.all(
          keys.map(function(key) {
            if (key !== CACHE_VER) {
              console.log('[SW] Deleting stale cache:', key);
              return caches.delete(key);
            }
          })
        );
      })
      .then(function() { return self.clients.claim(); })
      .then(function() {
        return self.clients.matchAll({ type: 'window' }).then(function(clients) {
          clients.forEach(function(client) {
            if ('navigate' in client) client.navigate('./index.html');
          });
        });
      })
  );
});

self.addEventListener('fetch', function(e) {
  var url = e.request.url;
  if (url.indexOf('.js') !== -1 || url.indexOf('.html') !== -1 ||
      url.indexOf('supabase.co') !== -1 || url.indexOf('jsdelivr.net') !== -1 ||
      url.indexOf('cdn.') !== -1) {
    e.respondWith(
      fetch(e.request).then(function(resp) {
        var clone = resp.clone();
        caches.open(CACHE_VER).then(function(cache) { cache.put(e.request, clone); });
        return resp;
      }).catch(function() { return caches.match(e.request); })
    );
    return;
  }
  e.respondWith(
    caches.match(e.request).then(function(cached) {
      return cached || fetch(e.request).then(function(resp) {
        var clone = resp.clone();
        caches.open(CACHE_VER).then(function(cache) { cache.put(e.request, clone); });
        return resp;
      });
    })
  );
});

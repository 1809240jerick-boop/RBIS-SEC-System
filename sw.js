// --- 1. UPDATE VERSION HERE ---
const CACHE_NAME = 'rbi-system-v28'; 

// 2. Install: Safe caching strategy
self.addEventListener('install', (event) => {
  self.skipWaiting(); // Force activation immediately

  event.waitUntil(
    caches.open(CACHE_NAME).then(async (cache) => {
      // A. Critical Files (Must work or app breaks)
      const criticalAssets = [
        './',
        './index.html',
        './manifest.json',
        './icon.png'
      ];

      // B. External Files (cache each individually so one failure doesn't stop others)
      const optionalAssets = [
        'https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css',
        'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css',
        'https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js',
        'https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js',
        'https://unpkg.com/dexie/dist/dexie.js'
      ];

      // Add critical files first
      await cache.addAll(criticalAssets);

      // Try each optional file individually
      for (const url of optionalAssets) {
        try {
          await cache.add(url);
        } catch (error) {
          console.warn('Failed to cache optional asset:', url, error.message);
        }
      }
    })
  );
});

// 3. Activate: Delete old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            console.log('Clearing old cache:', key);
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// 4. Fetch: Cache First, fall back to network, cache new responses dynamically
self.addEventListener('fetch', (event) => {
  // Skip non-GET requests
  if (event.request.method !== 'GET') return;

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }
      // Not in cache — fetch from network and cache the result for next time
      return fetch(event.request).then((networkResponse) => {
        if (networkResponse && networkResponse.status === 200 && networkResponse.type !== 'opaque') {
          const responseClone = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseClone);
          });
        }
        return networkResponse;
      }).catch(() => {
        // Offline and not in cache - return index.html for navigation requests
        if (event.request.destination === 'document') {
          return caches.match('./index.html');
        }
      });
    })
  );
});

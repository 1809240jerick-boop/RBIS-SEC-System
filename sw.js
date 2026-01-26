// --- 1. UPDATE VERSION HERE ---
const CACHE_NAME = 'rbi-system-v4'; 

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

      // B. External Files (If these fail, we still want the app to update)
      const optionalAssets = [
        'https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css',
        'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css',
        'https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js',
        'https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js'
      ];

      // Add critical files first
      await cache.addAll(criticalAssets);

      // Try to add optional files, but don't crash if they fail
      try {
        await cache.addAll(optionalAssets);
      } catch (error) {
        console.warn('Some external assets failed to cache, but app installed successfully.');
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

// 4. Fetch: Cache First strategy
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request);
    })
  );
});



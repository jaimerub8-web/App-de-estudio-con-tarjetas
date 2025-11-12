const CACHE_NAME = 'estudio-pro-v2'; // Bump version to force update
const urlsToCache = [
  // Core files
  '/',
  '/index.html',
  '/manifest.json',
  
  // Scripts
  '/index.tsx',
  '/App.tsx',
  '/types.ts',
  '/services/geminiService.ts',
  '/components/Flashcard.tsx',
  '/components/Timer.tsx',
  
  // Icons
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png',

  // Third-party resources
  'https://cdn.tailwindcss.com',
  'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Opened cache and caching assets');
        return cache.addAll(urlsToCache);
      })
      .catch(err => {
        console.error('Failed to cache assets:', err);
      })
  );
});

self.addEventListener('fetch', event => {
  // We only want to cache GET requests.
  if (event.request.method !== 'GET') {
    return;
  }

  event.respondWith(
    caches.match(event.request)
      .then(cachedResponse => {
        // Cache hit - return response
        if (cachedResponse) {
          return cachedResponse;
        }

        // Not in cache, fetch from network
        return fetch(event.request).then(
          networkResponse => {
            // Check if we received a valid response
            if(!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') {
              if (event.request.url.startsWith('https://fonts.gstatic.com')) {
                // Don't cache opaque responses for fonts, but return them
                return networkResponse;
              }
            }
            
            // IMPORTANT: Clone the response. A response is a stream
            // and because we want the browser to consume the response
            // as well as the cache consuming the response, we need
            // to clone it so we have two streams.
            const responseToCache = networkResponse.clone();

            caches.open(CACHE_NAME)
              .then(cache => {
                // We don't cache Netlify function calls
                if (!event.request.url.includes('/.netlify/functions/')) {
                  cache.put(event.request, responseToCache);
                }
              });

            return networkResponse;
          }
        ).catch(error => {
          // The network failed, and we don't have a cached version.
          // You could return a custom offline page here if you had one.
          console.error('Fetch failed; returning offline fallback if available.', error);
        });
      })
  );
});

self.addEventListener('activate', event => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});
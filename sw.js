const CACHE_NAME = 'mangahub-cache-v2'; // On passe en v2 pour forcer la mise à jour

const urlsToCache = [
  './',
  './index.html',
  'https://unpkg.com/react@18/umd/react.production.min.js',
  'https://unpkg.com/react-dom@18/umd/react-dom.production.min.js',
  'https://unpkg.com/@babel/standalone/babel.min.js',
  'https://cdn.tailwindcss.com',
  'https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js',
  'https://cdn.jsdelivr.net/npm/mobile-drag-drop@2.3.0-rc.2/default.css',
  'https://cdn.jsdelivr.net/npm/mobile-drag-drop@2.3.0-rc.2/index.min.js',
  'https://fonts.googleapis.com/css2?family=Inter:wght@400;700;900&display=swap'
];

// Installation et mise en cache
self.addEventListener('install', event => {
  self.skipWaiting(); // Force le Service Worker à s'activer immédiatement
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(urlsToCache))
      .catch(err => console.error('Erreur de cache:', err))
  );
});

// Nettoyage des anciens caches lors de la mise à jour
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cache => {
          if (cache !== CACHE_NAME) {
            return caches.delete(cache);
          }
        })
      );
    })
  );
  self.clients.claim(); // Prend le contrôle de tous les onglets ouverts
});

// Interception réseau ultra-robuste pour iOS
self.addEventListener('fetch', event => {
  event.respondWith(
    // 1. On cherche dans le cache en ignorant les paramètres d'URL (?v=1 etc.)
    caches.match(event.request, { ignoreSearch: true })
      .then(response => {
        if (response) {
          return response; // Fichier trouvé en local
        }
        
        // 2. Si pas dans le cache, on tente internet
        return fetch(event.request).catch(() => {
          // 3. SECOURS HORS LIGNE : Si internet échoue et qu'on cherche la page d'accueil
          if (event.request.mode === 'navigate' || event.request.headers.get('accept').includes('text/html')) {
            return caches.match('./index.html');
          }
        });
      })
  );
});

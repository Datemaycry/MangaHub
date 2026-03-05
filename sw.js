const CACHE_NAME = 'mangahub-core-v3';
const DYNAMIC_CACHE = 'mangahub-dynamic-v3';

// Fichiers de base à mettre en cache immédiatement
const urlsToCache = [
  './',
  './index.html',
  'https://unpkg.com/react@18/umd/react.production.min.js',
  'https://unpkg.com/react-dom@18/umd/react-dom.production.min.js',
  'https://unpkg.com/@babel/standalone/babel.min.js',
  'https://cdn.tailwindcss.com',
  'https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js',
  'https://cdn.jsdelivr.net/npm/mobile-drag-drop@2.3.0-rc.2/default.css',
  'https://cdn.jsdelivr.net/npm/mobile-drag-drop@2.3.0-rc.2/index.min.js'
];

// 1. INSTALLATION : On force le service worker à s'activer tout de suite
self.addEventListener('install', event => {
  self.skipWaiting(); 
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(urlsToCache))
      .catch(err => console.error('Erreur pré-cache:', err))
  );
});

// 2. ACTIVATION : On nettoie les vieux caches si tu fais une mise à jour
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => Promise.all(
      keys.map(key => {
        if (key !== CACHE_NAME && key !== DYNAMIC_CACHE) {
          return caches.delete(key);
        }
      })
    ))
  );
  self.clients.claim(); // Force la prise de contrôle de la page
});

// 3. INTERCEPTION : Stratégie "Cache First" avec "Dynamic Caching"
self.addEventListener('fetch', event => {
  // On ignore les requêtes bizarres (extensions Chrome, etc.)
  if (!event.request.url.startsWith('http')) return;

  event.respondWith(
    caches.match(event.request, { ignoreSearch: true }).then(cachedResponse => {
      // Si le fichier est déjà dans la mémoire de l'iPad, on le donne !
      if (cachedResponse) {
        return cachedResponse;
      }

      // Sinon, on va le chercher sur internet...
      return fetch(event.request).then(networkResponse => {
        // ...et on le stocke dans le cache dynamique pour la prochaine fois !
        return caches.open(DYNAMIC_CACHE).then(cache => {
          cache.put(event.request, networkResponse.clone());
          return networkResponse;
        });
      }).catch(() => {
        // Si internet est coupé ET que le fichier n'est pas en cache :
        // Si c'est une requête pour une page web, on force l'affichage de index.html
        if (event.request.mode === 'navigate' || event.request.headers.get('accept').includes('text/html')) {
          return caches.match('./index.html');
        }
      });
    })
  );
});


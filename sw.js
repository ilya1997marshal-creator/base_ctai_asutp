const CACHE_NAME = 'ctai-base-v6'; // актуальная версия кэша
const STATIC_ASSETS = [
  './',
  './index.html',
  './styles.css',
  './app.js',
  './data.js',
  './questions.js',
  './questions-fire.js',
  './questions-labor.js',
  './credentials.js',
  './manifest.json',
  './apple-touch-icon.png',
  'https://cdn.tailwindcss.com',
  'https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600;700;800&display=swap'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return Promise.allSettled(
        STATIC_ASSETS.map(url => {
          return fetch(url, { cache: 'no-cache' }).then(response => {
            if (response.ok) return cache.put(url, response);
          }).catch(err => console.warn('Не удалось закэшировать', url, err));
        })
      );
    }).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => {
      return Promise.all(
        keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key))
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  event.respondWith(
    fetch(event.request)
      .then(response => {
        const cloned = response.clone();
        caches.open(CACHE_NAME).then(cache => cache.put(event.request, cloned));
        return response;
      })
      .catch(() => caches.match(event.request))
  );
});

self.addEventListener('message', event => {
  if (event.data && event.data.action === 'skipWaiting') {
    self.skipWaiting();
  }
});
const CACHE_NAME = 'ctai-base-v74'; // Не забывай менять версию при правках!
const ASSETS = [
  './',
  './index.html',
  './styles.css',
  './app.js',
  './data.js',
  './manifest.json',
  './apple-touch-icon.png',
  './docs/S7-400_instalation.pdf',
  'https://cdn.tailwindcss.com',
  'https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600;700;800&display=swap'
];

// Установка: кэшируем все файлы
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return Promise.allSettled(
        ASSETS.map(url => {
          return fetch(url, { cache: 'no-cache' }).then(response => {
            if (response.ok) return cache.put(url, response);
            throw new Error(`Failed to fetch ${url}`);
          }).catch(err => console.error(err));
        })
      );
    })
  );
});

// Активация: чистим старые версии кэша
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            console.log('Удаление старого кэша:', key);
            return caches.delete(key);
          }
        })
      );
    })
  );
  // self.clients.claim(); // УДАЛИЛИ ЭТУ СТРОКУ, чтобы не перехватывать управление мгновенно
});

// Запросы: сначала ищем в кэше, если нет — идем в сеть
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request);
    })
  );
});

// Сообщение для принудительного обновления через кнопку в UI
self.addEventListener('message', (event) => {
  if (event.data && event.data.action === 'skipWaiting') {
    self.skipWaiting();
  }
});
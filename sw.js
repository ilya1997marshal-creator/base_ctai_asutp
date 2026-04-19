const CACHE_NAME = 'ctai-base-v1';
// Список файлов для сохранения (добавь свои, если есть еще)
const assets = [
  './',
  './index.html',
  './styles.css',
  './app.js',
  './manifest.json',
  './data/instructions.json',
  './apple-touch-icon.png'
];

// Установка: скачиваем файлы в кэш
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(assets);
    })
  );
});

// Активация: чистим старый кэш
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      );
    })
  );
});

// Запрос: сначала берем из кэша, если нет — идем в сеть
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request);
    })
  );
});
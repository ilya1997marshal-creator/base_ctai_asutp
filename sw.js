/**
 * Service worker: офлайн-режим.
 * Ядро приложения кладём в кэш при установке и отдаём из кэша сразу —
 * поэтому всё открывается без сети. Навигация идёт в сеть, а без неё
 * отдаётся сохранённая копия страницы.
 */

const CACHE_NAME = 'ctai-base-v22';
const OFFLINE_PAGE = './index.html';

const CORE = [
  './',
  './index.html',
  './styles.css',
  './app.js',
  './dock.js',
  './hero.js',
  './data.js',
  './troubles.js',
  './questions.js',
  './questions-fire.js',
  './questions-labor.js',
  './credentials.js',
  './manifest.json',
  './apple-touch-icon.png'
];

const FONT_CSS = 'https://fonts.googleapis.com/css2?family=Golos+Text:wght@400;500;600&family=IBM+Plex+Mono:wght@400;500;600&family=Unbounded:wght@400;600&display=swap';

self.addEventListener('install', event => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE_NAME);
    // локальные файлы обязательны: если хоть один не сохранится, офлайн будет дырявым
    await cache.addAll(CORE);
    // шрифты необязательны — их отсутствие не должно ломать установку
    try {
      const res = await fetch(FONT_CSS, { cache: 'no-cache' });
      if (res && res.ok) await cache.put(FONT_CSS, res);
    } catch (err) {
      // нет сети при первой установке — не страшно
    }
    await self.skipWaiting();
  })());
});

self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)));
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', event => {
  const req = event.request;
  if (req.method !== 'GET') return;

  const url = new URL(req.url);
  if (url.protocol !== 'http:' && url.protocol !== 'https:') return;

  // переходы по адресу: сначала сеть, иначе сохранённая страница
  if (req.mode === 'navigate') {
    event.respondWith((async () => {
      try {
        const fresh = await fetch(req);
        const cache = await caches.open(CACHE_NAME);
        cache.put(OFFLINE_PAGE, fresh.clone());
        return fresh;
      } catch (err) {
        const cache = await caches.open(CACHE_NAME);
        return (await cache.match(req)) ||
          (await cache.match(OFFLINE_PAGE)) ||
          (await cache.match('./')) ||
          Response.error();
      }
    })());
    return;
  }

  // остальное: сразу из кэша, а в фоне обновляем копию
  event.respondWith((async () => {
    const cache = await caches.open(CACHE_NAME);
    const cached = await cache.match(req);

    const network = fetch(req).then(res => {
      if (res && (res.ok || res.type === 'opaque')) {
        cache.put(req, res.clone());
      }
      return res;
    }).catch(() => null);

    if (cached) return cached;
    const res = await network;
    return res || Response.error();
  })());
});

self.addEventListener('message', event => {
  if (event.data && event.data.action === 'skipWaiting') {
    self.skipWaiting();
  }
});

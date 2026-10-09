// Hopabout offline cache. Bump VERSION whenever you upload a changed file.
const VERSION = 'hopabout-v2';
const FONT_CSS = 'https://fonts.googleapis.com/css2?family=Lilita+One&display=swap';
const FILES = [
  './', './index.html', './manifest.webmanifest',
  './icons/icon-180.png', './icons/icon-192.png', './icons/icon-512.png', './icons/icon-maskable-512.png'
];

self.addEventListener('install', event => {
  event.waitUntil((async () => {
    const cache = await caches.open(VERSION);
    await cache.addAll(FILES);
    // Store the display font too; the game falls back to a system font if this fails.
    try {
      const res = await fetch(FONT_CSS, { mode: 'cors' });
      const css = await res.clone().text();
      await cache.put(FONT_CSS, res);
      const urls = [...css.matchAll(/url\((https:[^)]+)\)/g)].map(m => m[1]);
      await Promise.all(urls.map(u => fetch(u, { mode: 'cors' }).then(r => cache.put(u, r))));
    } catch (e) {}
    self.skipWaiting();
  })());
});

self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter(k => k !== VERSION).map(k => caches.delete(k)));
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;
  event.respondWith((async () => {
    const cache = await caches.open(VERSION);
    const hit = await cache.match(event.request, { ignoreSearch: event.request.mode === 'navigate' });
    if (hit) return hit;
    try {
      const res = await fetch(event.request);
      if (res && (res.ok || res.type === 'opaque')) cache.put(event.request, res.clone());
      return res;
    } catch (e) {
      if (event.request.mode === 'navigate') return (await cache.match('./index.html')) || Response.error();
      return Response.error();
    }
  })());
});

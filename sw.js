// Macht die App ohne Internet nutzbar.
// Mit Internet wird immer die neueste Version geladen, ohne Internet die zuletzt gespeicherte.

const CACHE = 'statikrechner-v1';

const DATEIEN = [
  './',
  './index.html',
  './manifest.webmanifest',
  './css/style.css',
  './icons/icon.svg',
  './icons/icon-180.png',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './js/app.js',
  './js/core/format.js',
  './js/core/speicher.js',
  './js/core/schnee.js',
  './js/core/eigenlast.js',
  './js/core/kombination.js',
  './js/core/traeger.js',
  './js/ui/dom.js',
  './js/ui/diagramm.js',
  './js/modules/index.js',
  './js/modules/schneelast.js',
  './js/modules/eigenlast.js',
  './js/modules/kombination.js',
  './js/modules/traeger.js',
];

self.addEventListener('install', (ev) => {
  ev.waitUntil(
    caches
      .open(CACHE)
      .then((cache) => cache.addAll(DATEIEN))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener('activate', (ev) => {
  ev.waitUntil(
    caches
      .keys()
      .then((namen) => Promise.all(namen.filter((n) => n !== CACHE).map((n) => caches.delete(n))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', (ev) => {
  const anfrage = ev.request;
  if (anfrage.method !== 'GET' || new URL(anfrage.url).origin !== self.location.origin) return;
  ev.respondWith(
    fetch(anfrage)
      .then((antwort) => {
        if (antwort.ok) {
          const kopie = antwort.clone();
          caches.open(CACHE).then((cache) => cache.put(anfrage, kopie));
        }
        return antwort;
      })
      .catch(() =>
        caches.match(anfrage, { ignoreSearch: true }).then((treffer) => treffer || caches.match('./index.html')),
      ),
  );
});

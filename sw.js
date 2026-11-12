// Offline support: always try the network first (so new lessons show up right away),
// and fall back to the cached copy when offline.
// Bump VERSION whenever you add a new unit file so phones pick it up.
const VERSION = 'slovak-v1';
const FILES = [
  './', 'index.html', 'styles.css', 'app.js', 'manifest.json',
  'icons/icon.svg', 'icons/icon-192.png', 'icons/icon-512.png',
  'data/meta.js',
  'data/units/01-greetings.js', 'data/units/02-family.js', 'data/units/03-to-have.js',
  'data/units/04-days-time.js', 'data/units/05-numbers.js', 'data/units/06-questions.js',
  'data/units/07-about-me.js', 'data/units/08-likes.js', 'data/units/09-food.js',
  'data/units/10-home-places.js', 'data/units/11-weather.js', 'data/units/12-colours.js',
  'data/units/13-things.js', 'data/units/14-verbs-present.js', 'data/units/15-future-past.js',
  'data/units/16-cases.js', 'data/units/17-feelings.js'
];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(VERSION).then((c) => c.addAll(FILES)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== VERSION).map((k) => caches.delete(k)))).then(() => self.clients.claim()));
});

self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET' || new URL(e.request.url).origin !== location.origin) return;
  e.respondWith(
    caches.open(VERSION).then((cache) =>
      fetch(e.request, { cache: 'no-cache' })
        .then((res) => { if (res.ok) cache.put(e.request, res.clone()); return res; })
        .catch(() => cache.match(e.request, { ignoreSearch: true }))
    )
  );
});

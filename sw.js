// Keeps a copy of the game on the device so it opens instantly and works offline.
// Change VERSION whenever game files change, so devices pick up the update.
const VERSION = 'rail-words-v1';
const FILES = [
  './',
  'index.html',
  'manifest.webmanifest',
  'css/style.css',
  'data/questions.json',
  'js/coach.js',
  'js/levels.js',
  'js/main.js',
  'js/scene.js',
  'js/sound.js',
  'js/speech.js',
  'js/storage.js',
  'js/trackMesh.js',
  'js/trackPath.js',
  'js/train.js',
  'vendor/three/build/three.core.js',
  'vendor/three/build/three.module.js',
  'vendor/three/examples/jsm/controls/OrbitControls.js',
  'vendor/three/examples/jsm/environments/RoomEnvironment.js',
  'icons/apple-touch-icon.png',
  'icons/icon-192.png',
  'icons/icon-512.png',
  'icons/icon-maskable-512.png',
];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(VERSION).then((c) => c.addAll(FILES)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== VERSION).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

// Serve from the device copy first; refresh it quietly in the background when online.
self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET' || new URL(e.request.url).origin !== self.location.origin) return;
  e.respondWith(
    caches.open(VERSION).then(async (cache) => {
      const cached = await cache.match(e.request, { ignoreSearch: true });
      const fresh = fetch(e.request)
        .then((res) => { if (res.ok) cache.put(e.request, res.clone()); return res; })
        .catch(() => cached);
      return cached || fresh;
    }),
  );
});

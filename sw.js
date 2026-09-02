/* Offline shell.

   Precache is the app itself — markup, styles, modules, fonts, icons. The
   photos and the hero clip are cached as they are first seen, so a second
   visit on a bad connection still opens instantly without paying 1.4MB of
   video up front. */
const V = 'jaryan-v1';
const SHELL = [
  './', 'index.html', 'css/app.css', 'manifest.webmanifest',
  'js/app.js', 'js/config.js', 'js/data.js', 'js/hero.js', 'js/icons.js',
  'js/install.js', 'js/router.js', 'js/store.js', 'js/ui.js', 'js/util.js',
  'js/wordmark.js',
  'js/views/home.js', 'js/views/discover.js', 'js/views/event.js',
  'js/views/tickets.js', 'js/views/saved.js', 'js/views/profile.js',
  'js/views/host.js',
  'assets/fonts/IRANYekanXFaNum-Regular.woff2',
  'assets/fonts/IRANYekanXFaNum-Medium.woff2',
  'assets/fonts/IRANYekanXFaNum-DemiBold.woff2',
  'assets/fonts/IRANYekanXFaNum-ExtraBold.woff2',
  'assets/fonts/IRANYekanXFaNum-Black.woff2',
  'assets/fonts/IRANYekanX-Medium.woff2',
  'assets/icons/icon-192.png', 'assets/icons/icon-512.png',
  'media/hero-poster.webp',
];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(V)
    .then((c) => Promise.allSettled(SHELL.map((u) => c.add(u))))
    .then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys()
    .then((keys) => Promise.all(keys.filter((k) => k !== V).map((k) => caches.delete(k))))
    .then(() => self.clients.claim()));
});

self.addEventListener('fetch', (e) => {
  const { request } = e;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);
  if (url.origin !== location.origin) return;

  /* Video needs Range support; let the network own it. */
  if (request.destination === 'video' || request.headers.has('range')) return;

  if (request.mode === 'navigate') {
    e.respondWith(fetch(request).catch(() => caches.match('index.html')));
    return;
  }

  e.respondWith(caches.match(request).then((hit) => hit || fetch(request).then((res) => {
    if (res.ok && res.type === 'basic') {
      const copy = res.clone();
      caches.open(V).then((c) => c.put(request, copy));
    }
    return res;
  }).catch(() => Response.error())));
});

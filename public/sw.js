const CACHE = 'morrow-v11';
const APP = [
  './', './index.html', './styles.css', './app.js', './manifest.webmanifest',
  './assets/morrow-logo.png',
  './vendor/phosphor/regular/style.css', './vendor/phosphor/regular/Phosphor.woff2',
  './vendor/phosphor/fill/style.css', './vendor/phosphor/fill/Phosphor-Fill.woff2'
];

self.addEventListener('install', e => e.waitUntil(
  caches.open(CACHE).then(c => c.addAll(APP)).then(() => self.skipWaiting())
));
self.addEventListener('activate', e => e.waitUntil(
  caches.keys()
    .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
    .then(() => self.clients.claim())
    .then(() => self.clients.matchAll({ type:'window' }))
    .then(clients => Promise.all(clients.map(client => client.navigate(client.url))))
));
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  const url = new URL(e.request.url);
  if (url.origin !== self.location.origin || url.pathname.startsWith('/api/')) return;

  e.respondWith(fetch(e.request).then(res => {
    if (res.ok) {
      const copy = res.clone();
      e.waitUntil(caches.open(CACHE).then(c => c.put(e.request, copy)));
    }
    return res;
  }).catch(async () => {
    const hit = await caches.match(e.request);
    if (hit) return hit;
    if (e.request.mode === 'navigate') return caches.match('./index.html');
    return Response.error();
  }));
});

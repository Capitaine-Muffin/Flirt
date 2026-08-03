/* Service worker de la démo : réseau d'abord, cache en secours.
   Les visiteurs ont toujours la dernière version en ligne, et la
   version installée continue de marcher hors connexion. */
const CACHE = 'flirt-demo-v3';

self.addEventListener('install', () => self.skipWaiting());

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET') return;
  e.respondWith(
    // no-cache : revalide auprès du serveur à chaque fois, sinon le
    // téléphone ressert sa copie « encore valable » (GitHub Pages
    // autorise 10 min) et l'app installée semble ne jamais se mettre
    // à jour.
    fetch(e.request, { cache: 'no-cache' })
      .then((res) => {
        const copy = res.clone();
        caches.open(CACHE).then((c) => c.put(e.request, copy));
        return res;
      })
      .catch(() => caches.match(e.request))
  );
});

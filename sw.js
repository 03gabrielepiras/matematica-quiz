const CACHE_NAME = "math-algebra-pwa-v17";

const CORE_ASSETS = [
  "./",
  "./index.html",
  "./styles.css",
  "./quiz.js",
  "./manifest.webmanifest"
];

const OPTIONAL_ASSETS = [
  "./data/P0.json",
  "./data/M1.json",
  "./data/M2.json",
  "./data/M3.json",
  "./data/M4.json",
  "./data/M5.json"
];

self.addEventListener("install", (event) => {
  // Non forziamo l'update: lo SW resta in waiting finche' l'utente non preme "Aggiorna".
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE_NAME);

    // 1) cache core (se fallisce qui, non ha senso proseguire)
    await cache.addAll(CORE_ASSETS);

    // 2) cache opzionali: non deve mai bloccare l'install
    await Promise.all(OPTIONAL_ASSETS.map(async (u) => {
      try {
        const res = await fetch(u, { cache: "no-cache" });
        if(res && res.ok) await cache.put(u, res);
      } catch (_) {
        // ignora
      }
    }));
  })());
});

self.addEventListener("activate", (event) => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)));
    await self.clients.claim();
  })());
});

self.addEventListener("message", (event) => {
  const data = event.data || {};
  if (data && data.type === "SKIP_WAITING") self.skipWaiting();
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  const url = new URL(req.url);

  // Solo same-origin
  if (url.origin !== self.location.origin) return;

  const isNav = req.mode === "navigate" || (req.destination === "document");

  event.respondWith((async () => {
    const cache = await caches.open(CACHE_NAME);

    // Navigazione: index.html come fallback
    if (isNav) {
      try {
        const fresh = await fetch(req);
        cache.put(req, fresh.clone());
        return fresh;
      } catch (_) {
        return (await cache.match("./index.html")) || Response.error();
      }
    }

    // Asset (js/css/json...): cache-first, fallback SOLO se esiste, mai index.html
    const cached = await cache.match(req);
    if (cached) return cached;

    try {
      const fresh = await fetch(req);
      cache.put(req, fresh.clone());
      return fresh;
    } catch (_) {
      return Response.error();
    }
  })());
});

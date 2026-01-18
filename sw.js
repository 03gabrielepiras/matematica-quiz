const CACHE_NAME = "math-algebra-pwa-v28";

// iOS a volte e' molto severo: se una risorsa in addAll fallisce, l'install fallisce.
// Qui costruiamo URL assoluti in base allo scope dello SW.
const CORE_PATHS = [
  "index.html",
  "styles.css",
  "quiz.js",
  "manifest.webmanifest"
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

    // 1) cache core (senza addAll unico, cosi' non si blocca se una fetch e' lenta)
    const scope = self.registration.scope;
    for (const p of CORE_PATHS) {
      const url = new URL(p, scope).toString();
      try { await cache.add(url); } catch (_) { /* ignora: verra' preso online */ }
    }

    // 2) cache opzionali: non deve mai bloccare l'install
    await Promise.all(OPTIONAL_ASSETS.map(async (u) => {
      try {
        const url = new URL(u, scope).toString();
        const res = await fetch(url, { cache: "no-cache" });
        if(res && res.ok) await cache.put(url, res);
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
        const fallback = await cache.match(new URL("index.html", self.registration.scope).toString());
        return fallback || Response.error();
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

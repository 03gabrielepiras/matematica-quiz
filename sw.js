const CACHE_NAME = "math-algebra-pwa-v2";

const ASSETS = [
  "./",
  "./index.html",
  "./styles.css",
  "./quiz.js",
  "./manifest.webmanifest"
];

self.addEventListener("install", (event) => {
  self.skipWaiting();
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS)));
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)));
      await self.clients.claim();
    })()
  );
});

async function cacheFirst(req) {
  const cached = await caches.match(req);
  if (cached) return cached;
  const res = await fetch(req);
  // Cache solo risorse same-origin (evita di "congelare" SDK esterni tipo Firebase)
  if (new URL(req.url).origin === self.location.origin && res.ok) {
    const copy = res.clone();
    caches.open(CACHE_NAME).then((cache) => cache.put(req, copy));
  }
  return res;
}

async function networkFirst(req) {
  try {
    const res = await fetch(req);
    if (new URL(req.url).origin === self.location.origin && res.ok) {
      const copy = res.clone();
      caches.open(CACHE_NAME).then((cache) => cache.put(req, copy));
    }
    return res;
  } catch {
    const cached = await caches.match(req);
    return cached || caches.match("./index.html");
  }
}

self.addEventListener("fetch", (event) => {
  const req = event.request;

  // Navigazione: meglio network-first per evitare HTML/JS vecchi dopo update
  if (req.mode === "navigate") {
    event.respondWith(networkFirst(req));
    return;
  }

  // Altre richieste: cache-first, ma solo same-origin viene memorizzato
  event.respondWith(cacheFirst(req));
});

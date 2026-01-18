// ===============================
// Service Worker – Matematica Quiz
// Versione: v29-3
// ===============================

const CACHE_VERSION = 'v29-3';
const CACHE_NAME = `matematica-quiz-cache-${CACHE_VERSION}`;

// File essenziali (aggiungine solo se servono davvero)
const CORE_ASSETS = [
  './',
  './index.html',
  './style.css',
  './quiz.js',
  './manifest.json',

  // dati quiz
  './data/P0.json',
  './data/M1.json',
  './data/M2.json',
  './data/M3.json',
  './data/M4.json',
  './data/M5.json'
];

// ===============================
// INSTALL
// ===============================
self.addEventListener('install', (event) => {
  console.log('[SW] Install', CACHE_VERSION);
  self.skipWaiting();

  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(CORE_ASSETS);
    })
  );
});

// ===============================
// ACTIVATE
// ===============================
self.addEventListener('activate', (event) => {
  console.log('[SW] Activate', CACHE_VERSION);

  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key.startsWith('matematica-quiz-cache-') && key !== CACHE_NAME)
          .map((key) => caches.delete(key))
      )
    ).then(() => self.clients.claim())
  );
});

// ===============================
// FETCH
// ===============================
self.addEventListener('fetch', (event) => {
  const req = event.request;

  // ❌ Non cache Firebase / API / roba dinamica
  if (req.url.includes('firebase') || req.url.includes('googleapis')) {
    return;
  }

  event.respondWith(
    caches.match(req).then((cached) => {
      if (cached) return cached;

      return fetch(req)
        .then((res) => {
          // Cache solo GET validi
          if (req.method === 'GET' && res.status === 200) {
            const resClone = res.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(req, resClone));
          }
          return res;
        })
        .catch(() => {
          // fallback minimale offline
          if (req.destination === 'document') {
            return caches.match('./index.html');
          }
        });
    })
  );
});

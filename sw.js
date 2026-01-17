// Minimal Service Worker (safe for GitHub Pages).
// We keep it simple for now to avoid cache headaches.
self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', () => {
  // No-op: network-first by default.
});

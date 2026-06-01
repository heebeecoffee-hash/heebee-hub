const CACHE = 'heebee-hub-v7';

self.addEventListener('install', e => {
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  // Clear ALL old caches
  e.waitUntil(caches.keys().then(keys =>
    Promise.all(keys.map(k => caches.delete(k)))
  ));
  self.clients.claim();
});

self.addEventListener('fetch', e => {
  // Always let navigation requests (page loads) go straight to network
  if (e.request.mode === 'navigate') return;
  if (e.request.method !== 'GET') return;
  // Never cache GitHub API calls
  if (e.request.url.includes('github.com')) return;
});

const CACHE_NAME = "quy-choi-shell-v1";
const BASE_PATH = new URL("./", self.location.href).pathname;
const APP_SHELL = [BASE_PATH, `${BASE_PATH}manifest.webmanifest`, `${BASE_PATH}manus-routes.json`];

self.addEventListener("install", event => {
  event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(APP_SHELL)));
  self.skipWaiting();
});

self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys().then(keys => Promise.all(keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key))))
  );
  self.clients.claim();
});

self.addEventListener("fetch", event => {
  const request = event.request;
  const url = new URL(request.url);
  if (request.method !== "GET" || url.origin !== self.location.origin || url.pathname.startsWith(`${BASE_PATH}api/`)) return;

  if (request.mode === "navigate") {
    event.respondWith(fetch(request).catch(() => caches.match(BASE_PATH)));
    return;
  }

  event.respondWith(
    caches.match(request).then(cached => cached || fetch(request).then(response => {
      if (response.ok && (url.pathname.startsWith(`${BASE_PATH}assets/`) || url.pathname.startsWith(`${BASE_PATH}icons/`))) {
        const copy = response.clone();
        caches.open(CACHE_NAME).then(cache => cache.put(request, copy));
      }
      return response;
    }))
  );
});

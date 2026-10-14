// TopoVías: funciona sin internet.
// Al publicar una versión nueva, cambiar CACHE_VERSION para que los equipos la descarguen.
const CACHE_VERSION = "topovias-v9";
const ARCHIVOS = ["./", "./index.html", "./manifest.json", "./icon-192.png", "./icon-512.png", "./icon-maskable.png", "./apple-touch-icon.png", "./favicon.png"];

self.addEventListener("install", e => {
  e.waitUntil(caches.open(CACHE_VERSION).then(c => c.addAll(ARCHIVOS)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", e => {
  e.waitUntil(caches.keys()
    .then(ks => Promise.all(ks.filter(k => k !== CACHE_VERSION).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});

// Primero lo guardado (abre al instante y sin señal); en segundo plano se trae la versión
// más reciente para la próxima vez que se abra.
self.addEventListener("fetch", e => {
  if (e.request.method !== "GET" || new URL(e.request.url).origin !== location.origin) return;
  e.respondWith(caches.open(CACHE_VERSION).then(async cache => {
    const clave = e.request.mode === "navigate" ? "./index.html" : e.request;
    const guardado = await cache.match(clave, { ignoreSearch: e.request.mode === "navigate" });
    const red = fetch(e.request).then(r => {
      if (r && r.ok) cache.put(clave, r.clone());
      return r;
    }).catch(() => null);
    if (guardado) { e.waitUntil(red); return guardado; }
    return (await red) || new Response("Sin conexión", { status: 503 });
  }));
});

// TopoVías: funciona sin internet.
// Al publicar una versión nueva, cambiar CACHE_VERSION (y TV_VERSION en index.html).
const CACHE_VERSION = "topovias-v41";
const ARCHIVOS = ["./", "./index.html", "./manifest.json", "./icon-topo-192.png", "./icon-topo-512.png", "./icon-topo-maskable.png", "./apple-touch-icon.png", "./favicon.png"];

self.addEventListener("install", e => {
  e.waitUntil(caches.open(CACHE_VERSION).then(c => c.addAll(ARCHIVOS.map(a => new Request(a, { cache: "reload" })))).then(() => self.skipWaiting()));
});

self.addEventListener("activate", e => {
  e.waitUntil(caches.keys()
    .then(ks => Promise.all(ks.filter(k => k !== CACHE_VERSION).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});

// La app (index.html): primero la red, para tener siempre la última versión; si no hay señal
// o tarda más de 4 s, se abre la guardada. Lo demás (íconos): primero lo guardado.
self.addEventListener("fetch", e => {
  if (e.request.method !== "GET" || new URL(e.request.url).origin !== location.origin) return;
  // la app y su manifest (nombre e ícono) se piden primero a la red
  const navegar = e.request.mode === "navigate" || /manifest\.json$/.test(new URL(e.request.url).pathname);
  e.respondWith(caches.open(CACHE_VERSION).then(async cache => {
    const clave = e.request.mode === "navigate" ? "./index.html" : e.request;
    const guardado = await cache.match(clave, { ignoreSearch: e.request.mode === "navigate" });
    const red = fetch(e.request, navegar ? { cache: "no-cache" } : undefined).then(r => {
      if (r && r.ok) cache.put(clave, r.clone());
      return r;
    }).catch(() => null);
    if (navegar && guardado) {
      const espera = new Promise(res => setTimeout(() => res(null), 4000));
      const r = await Promise.race([red, espera]);
      if (r && r.ok) return r;
      e.waitUntil(red);
      return guardado;
    }
    if (guardado) { e.waitUntil(red); return guardado; }
    return (await red) || new Response("Sin conexión", { status: 503 });
  }));
});

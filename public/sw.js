/* Service worker — Garcia Pedro Teleka
 * - Páginas: sempre da rede (stock e preços atuais); sem rede mostra /offline.html
 * - Ficheiros estáticos do próprio site: cache rápida (atualiza em segundo plano)
 * - Nunca guarda: Supabase, /api, pedidos POST, painel do autor
 */
const VERSION = "v1";
const STATIC_CACHE = `gpt-static-${VERSION}`;
const PRECACHE = [
  "/offline.html",
  "/icons/icon-192.png",
  "/icons/icon-512.png",
  "/icons/apple-touch-icon.png",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(STATIC_CACHE)
      .then((cache) => cache.addAll(PRECACHE))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((k) => k.startsWith("gpt-static-") && k !== STATIC_CACHE)
            .map((k) => caches.delete(k))
        )
      )
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;

  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return; // Supabase, Unsplash, etc.
  if (url.pathname.startsWith("/api/")) return;

  // Navegação: rede primeiro, página offline se falhar
  if (req.mode === "navigate") {
    event.respondWith(
      fetch(req).catch(() =>
        caches.match("/offline.html").then(
          (r) =>
            r ||
            new Response("Sem ligação à internet.", {
              status: 503,
              headers: { "Content-Type": "text/plain; charset=utf-8" },
            })
        )
      )
    );
    return;
  }

  // Ficheiros estáticos: cache + atualização em segundo plano
  const isStatic =
    url.pathname.startsWith("/_next/static/") ||
    url.pathname.startsWith("/icons/") ||
    /\.(?:png|jpg|jpeg|webp|svg|ico|woff2?)$/.test(url.pathname);

  if (isStatic) {
    event.respondWith(
      caches.open(STATIC_CACHE).then((cache) =>
        cache.match(req).then((cached) => {
          const network = fetch(req)
            .then((res) => {
              if (res.ok) cache.put(req, res.clone());
              return res;
            })
            .catch(() => cached);
          return cached || network;
        })
      )
    );
  }
});

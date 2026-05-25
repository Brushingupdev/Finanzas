const CACHE_NAME = "finanzas-v2"
const STATIC_ASSETS = ["/manifest.json", "/icon.svg"]

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS)
    })
  )
  self.skipWaiting()
})

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      )
    })
  )
  self.clients.claim()
})

self.addEventListener("fetch", (event) => {
  // Skip non-GET requests and API calls
  if (event.request.method !== "GET") return
  if (event.request.url.includes("/api/")) return

  // Always use network for navigations to avoid stale HTML that can reference old Server Action IDs.
  if (event.request.mode === "navigate") {
    event.respondWith(fetch(event.request))
    return
  }

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        if (
          response.status === 200 &&
          (event.request.destination === "script" ||
            event.request.destination === "style" ||
            event.request.destination === "image" ||
            event.request.destination === "font")
        ) {
          const clone = response.clone()
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, clone)
          })
        }
        return response
      })
      .catch(() => caches.match(event.request).then((cached) => cached || new Response("Offline", { status: 503 })))
  )
})

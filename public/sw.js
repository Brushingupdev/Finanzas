const CACHE_NAME = "finanzas-v1"
const STATIC_ASSETS = [
  "/",
  "/dashboard",
  "/login",
  "/register",
  "/manifest.json",
  "/icon.svg",
]

self.addEventListener("install", (event: ExtendableEvent) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS)
    })
  )
  ;(self as unknown as ServiceWorkerGlobalScope).skipWaiting()
})

self.addEventListener("activate", (event: ExtendableEvent) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      )
    })
  )
  ;(self as unknown as ServiceWorkerGlobalScope).clients.claim()
})

self.addEventListener("fetch", (event: FetchEvent) => {
  // Skip non-GET requests and API calls
  if (event.request.method !== "GET") return
  if (event.request.url.includes("/api/")) return

  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) return cached
      return fetch(event.request)
        .then((response) => {
          // Cache successful responses for static assets
          if (
            response.status === 200 &&
            (event.request.destination === "script" ||
              event.request.destination === "style" ||
              event.request.destination === "image" ||
              event.request.destination === "document")
          ) {
            const clone = response.clone()
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, clone)
            })
          }
          return response
        })
        .catch(() => {
          // Fallback for navigation requests
          if (event.request.mode === "navigate") {
            return caches.match("/dashboard") as Promise<Response>
          }
          return new Response("Offline", { status: 503 })
        })
    })
  )
})

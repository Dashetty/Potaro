/*
 * Potaro service worker.
 *
 * Goals, in order:
 *  1. Serve the immutable Next.js chunks and fonts from Cache Storage so a
 *     cold launch does not re-download ~200 KiB of JS on a phone.
 *  2. Network-first for navigations with a short timeout: a warm network
 *     always gets fresh SSR, and a slow/cold one falls back to the last
 *     rendered document instead of a blank screen.
 *  3. Never cache auth, API or third-party traffic.
 *
 * The document cache holds the last authenticated render (single-user app,
 * private device). Signing out — and rendering /login after a session expires
 * — clears it via CLEAR_PAGES, so bookmarks do not linger in Cache Storage.
 */

const VERSION = "potaro-v1";
const STATIC_CACHE = `${VERSION}-static`;
// Mirrors src/lib/pwa.ts; the SW cannot import from the app bundle.
const PAGES_CACHE = `${VERSION}-pages`;
const NAV_TIMEOUT_MS = 2500;

// Next output is content-hashed and served immutable: safe to serve forever.
const IMMUTABLE = /^\/_next\/static\//;
// Unhashed assets can change between deploys, so revalidate in the background.
const ASSET = /^\/(?:icons\/|apple-touch-icon\.png$)|\.(?:woff2?|png|svg|ico|jpe?g|webp)$/;

self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(
        keys
          .filter((key) => !key.startsWith(VERSION))
          .map((key) => caches.delete(key)),
      );
      await self.clients.claim();
    })(),
  );
});

self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "CLEAR_PAGES") {
    event.waitUntil(caches.delete(PAGES_CACHE));
  }
});

async function cacheFirst(request) {
  const cache = await caches.open(STATIC_CACHE);
  const cached = await cache.match(request);
  if (cached) return cached;

  const response = await fetch(request);
  // A redirected response must not be pinned under an asset URL.
  if (response.ok && !response.redirected) {
    await cache.put(request, response.clone());
  }
  return response;
}

async function staleWhileRevalidate(request, event) {
  const cache = await caches.open(STATIC_CACHE);
  const cached = await cache.match(request);

  const network = fetch(request)
    .then(async (response) => {
      if (response.ok && !response.redirected) {
        await cache.put(request, response.clone());
      }
      return response;
    })
    .catch(() => null);

  // Keep the event alive so the write completes even when the cached copy is
  // returned immediately.
  event.waitUntil(network);

  return cached || (await network) || new Response("", { status: 504 });
}

async function networkFirst(request, event) {
  const cache = await caches.open(PAGES_CACHE);

  const network = fetch(request)
    .then(async (response) => {
      // Only cache a direct 200 document. `redirected` means the proxy sent
      // us to /login, and that page must never be stored under "/".
      if (response.ok && !response.redirected) {
        await cache.put(request, response.clone());
      }
      return response;
    })
    .catch(() => null);

  // A navigation response can settle before the cache write does; waitUntil
  // keeps the worker alive for it.
  event.waitUntil(network);

  const timeout = new Promise((resolve) => {
    setTimeout(() => resolve(null), NAV_TIMEOUT_MS);
  });

  const winner = await Promise.race([network, timeout]);
  if (winner) return winner;

  const cached = await cache.match(request);
  if (cached) return cached;

  // Nothing cached and the network is slower than the timeout: wait for it.
  const response = await network;
  if (response) return response;

  return new Response(
    "<!doctype html><meta charset=utf-8><meta name=viewport content='width=device-width'><title>Offline</title><body style='margin:0;display:grid;place-items:center;min-height:100dvh;background:#151114;color:#f1eef4;font-family:system-ui,sans-serif'><p>You're offline. Reconnect and reopen Potaro.</p>",
    { status: 503, headers: { "Content-Type": "text/html; charset=utf-8" } },
  );
}

self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;
  if (url.pathname.startsWith("/auth/") || url.pathname.startsWith("/api/")) {
    return;
  }

  if (IMMUTABLE.test(url.pathname)) {
    event.respondWith(cacheFirst(request));
    return;
  }

  if (ASSET.test(url.pathname)) {
    event.respondWith(staleWhileRevalidate(request, event));
    return;
  }

  if (request.mode === "navigate") {
    event.respondWith(networkFirst(request, event));
  }
});

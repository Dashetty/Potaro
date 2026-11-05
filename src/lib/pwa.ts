/**
 * Service-worker cache names. `PAGES_CACHE` is also referenced by the client
 * (src/lib/pwa.ts) and hard-coded in public/sw.js, which cannot import from
 * the app bundle — keep the three in sync.
 */
export const PAGES_CACHE = "potaro-v1-pages";

/**
 * Drops the cached authenticated document. Called from the sign-out buttons
 * and whenever the login screen renders (which is also the session-expired
 * path), so bookmarks never replay from Cache Storage after the session ends.
 *
 * Deletes the cache from the window directly as well as messaging the service
 * worker: on a cold page there may be no active controller yet, and the
 * window deletion is not tied to the worker's lifetime.
 */
export function clearCachedPages() {
  if (typeof caches !== "undefined") {
    void caches.delete(PAGES_CACHE).catch(() => {});
  }
  if (typeof navigator !== "undefined") {
    navigator.serviceWorker?.controller?.postMessage({ type: "CLEAR_PAGES" });
  }
}

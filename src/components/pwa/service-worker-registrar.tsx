"use client";

import { useEffect } from "react";
import { clearCachedPages } from "@/lib/pwa";

/**
 * Registers the service worker in production only. In dev, Turbopack URLs
 * are not content-hashed the same way, so caching would mask edits.
 *
 * The login screen is also the session-expired path, so rendering it drops
 * any authenticated document the service worker had cached.
 */
export function ServiceWorkerRegistrar() {
  useEffect(() => {
    if (typeof window === "undefined") return;

    if (window.location.pathname.startsWith("/login")) {
      clearCachedPages();
    }

    if (process.env.NODE_ENV !== "production") return;
    if (!("serviceWorker" in navigator)) return;

    const register = () => {
      void navigator.serviceWorker.register("/sw.js").catch(() => {
        // A failed registration is non-fatal: the app still works online.
      });
    };

    if (document.readyState === "complete") {
      register();
    } else {
      window.addEventListener("load", register, { once: true });
      return () => window.removeEventListener("load", register);
    }
  }, []);

  return null;
}

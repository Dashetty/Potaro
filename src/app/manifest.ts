import type { MetadataRoute } from "next";

/**
 * Web app manifest — required for Android to install Potaro as a real PWA
 * (WebAPK with a splash screen) instead of a plain home-screen shortcut.
 *
 * Served at /manifest.webmanifest by Next. The proxy matcher excludes that
 * path so an unauthenticated fetch of the manifest is not redirected to
 * /login (Chrome refuses a manifest that redirects cross-document).
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/",
    name: "Potaro — Bookmark Manager",
    short_name: "Potaro",
    description:
      "A personal bookmark manager. Save links, tag them, and find them again.",
    lang: "en",
    dir: "ltr",
    start_url: "/",
    scope: "/",
    display: "standalone",
    background_color: "#151114",
    theme_color: "#151114",
    icons: [
      {
        src: "/icons/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/icon-maskable-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "maskable",
      },
      {
        src: "/icons/icon-maskable-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}

import { NextRequest, NextResponse } from "next/server";

type MetaResult = {
  url: string;
  domain: string;
  title: string;
  description: string | null;
  faviconUrl: string | null;
};

function normalizeUrl(raw: string): URL | null {
  try {
    let candidate = raw.trim();
    if (!/^https?:\/\//i.test(candidate)) {
      candidate = `https://${candidate}`;
    }
    const url = new URL(candidate);
    if (url.protocol !== "http:" && url.protocol !== "https:") return null;
    return url;
  } catch {
    return null;
  }
}

/** Block obvious private / local targets (SSRF hygiene). */
function isBlockedHost(hostname: string): boolean {
  const host = hostname.toLowerCase();
  if (host === "localhost" || host.endsWith(".localhost")) return true;
  if (host === "::1" || host === "[::1]") return true;
  if (/^127\./.test(host)) return true;
  if (/^10\./.test(host)) return true;
  if (/^192\.168\./.test(host)) return true;
  if (/^172\.(1[6-9]|2\d|3[01])\./.test(host)) return true;
  return false;
}

function decodeHtml(input: string): string {
  return input
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, " ")
    .replace(/&#x27;/g, "'")
    .replace(/&#x2F;/g, "/")
    .trim();
}

function getMeta(
  html: string,
  selectors: RegExp[],
): string | null {
  for (const selector of selectors) {
    const match = html.match(selector);
    if (match?.[1]) {
      const cleaned = decodeHtml(match[1] as string).replace(/\s+/g, " ").trim();
      if (cleaned) return cleaned;
    }
  }
  return null;
}

function extractFavicon(html: string, url: URL): string | null {
  // 1. <link rel="icon"|"shortcut icon">
  const iconLink = html.match(
    /<link[^>]*(?:rel=["'](?:shortcut\s+)?icon["'])[^>]*>/i,
  );
  if (iconLink) {
    const href = iconLink[0].match(/href=["']([^"']+)["']/i)?.[1];
    if (href) {
      try {
        return new URL(href, url).toString();
      } catch {
        // fall through to the service
      }
    }
  }

  // 2. Google favicon service as a public fallback.
  return `https://www.google.com/s2/favicons?domain=${encodeURIComponent(
    url.hostname,
  )}&sz=64`;
}

export async function GET(request: NextRequest) {
  const raw = request.nextUrl.searchParams.get("url") ?? "";

  const url = normalizeUrl(raw);
  if (!url) {
    return NextResponse.json({ error: "Invalid URL" }, { status: 400 });
  }
  if (isBlockedHost(url.hostname)) {
    return NextResponse.json(
      { error: "That address isn't allowed" },
      { status: 400 },
    );
  }

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);

    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        "User-Agent":
          "Mozilla/5.0 (compatible; Potaro/1.0; +https://potaro.app)",
        Accept: "text/html,application/xhtml+xml",
      },
      redirect: "follow",
    });
    clearTimeout(timeout);

    const contentType = response.headers.get("content-type") ?? "";
    if (!contentType.includes("text/html") && !contentType.includes("application/xhtml+xml")) {
      // Not a web page — still return the URL so it can be saved manually.
      return NextResponse.json({
        url: url.toString(),
        domain: url.hostname,
        title: "",
        description: null,
        faviconUrl: extractFavicon("", url),
      } satisfies MetaResult);
    }

    const html = await response.text();
    const title =
      getMeta(html, [
        /<meta[^>]*property=["']og:title["'][^>]*content=["']([^"']*)["'][^>]*>/i,
        /<meta[^>]*content=["']([^"']*)["'][^>]*property=["']og:title["'][^>]*>/i,
        /<title[^>]*>([\s\S]*?)<\/title>/i,
      ]) ?? "";
    const description = getMeta(html, [
      /<meta[^>]*property=["']og:description["'][^>]*content=["']([^"']*)["'][^>]*>/i,
      /<meta[^>]*name=["']description["'][^>]*content=["']([^"']*)["'][^>]*>/i,
      /<meta[^>]*content=["']([^"']*)["'][^>]*name=["']description["'][^>]*>/i,
    ]);

    return NextResponse.json({
      url: url.toString(),
      domain: url.hostname,
      title,
      description,
      faviconUrl: extractFavicon(html, url),
    } satisfies MetaResult);
  } catch {
    // Unreachable or timeout — let the client fall back to manual entry.
    return NextResponse.json({
      url: url.toString(),
      domain: url.hostname,
      title: "",
      description: null,
      faviconUrl: extractFavicon("", url),
    } satisfies MetaResult);
  }
}
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Bookmark } from "@/lib/types";

/** Fetch every bookmark, newest first. Single-user scale: search/filter happen client-side. */
export async function fetchAllBookmarks(
  supabase: SupabaseClient,
): Promise<Bookmark[]> {
  const { data, error } = await supabase
    .from("bookmarks")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("fetchAllBookmarks:", error.message);
    return [];
  }

  return (data ?? []) as Bookmark[];
}

/** Distinct tags across all bookmarks, sorted alphabetically. */
export function collectTags(bookmarks: Bookmark[]): string[] {
  const set = new Set<string>();
  for (const bookmark of bookmarks) {
    for (const tag of bookmark.tags) {
      if (tag.trim()) set.add(tag.trim());
    }
  }
  return [...set].sort((a, b) => a.localeCompare(b));
}

/** Normalize a user-pasted URL: add https:// when missing, trim. */
export function normalizeUrl(raw: string): string {
  const candidate = raw.trim();
  if (!candidate) return "";
  return /^https?:\/\//i.test(candidate)
    ? candidate
    : `https://${candidate}`;
}

/** Query params that never change what a page is — tracking/campaign junk. */
const TRACKING_PARAMS = new Set([
  "fbclid",
  "gclid",
  "igshid",
  "mc_eid",
  "ref",
  "ref_src",
  "ref_url",
  "si",
  "utm_campaign",
  "utm_content",
  "utm_id",
  "utm_medium",
  "utm_source",
  "utm_term",
]);

/**
 * Loose key for comparing saved URLs: lowercase host/path, tracking params
 * and #hash stripped, no trailing slashes. Two keys match when they'd land
 * on the same page in a browser.
 */
export function urlKey(raw: string): string {
  const normalized = normalizeUrl(raw);
  try {
    const parsed = new URL(normalized);
    for (const key of [...parsed.searchParams.keys()]) {
      if (TRACKING_PARAMS.has(key.toLowerCase())) {
        parsed.searchParams.delete(key);
      }
    }
    parsed.hash = "";
    const path =
      parsed.pathname.length > 1
        ? parsed.pathname.replace(/\/+$/, "")
        : parsed.pathname;
    return `${parsed.host}${path}${parsed.search}`.toLowerCase();
  } catch {
    // Unparseable input: fall back to a case-folded, slash-trimmed string.
    return normalized.toLowerCase().replace(/\/+$/, "");
  }
}

/** Newest-first ordering shared by the library list and optimistic updates. */
export function compareNewestFirst(a: Bookmark, b: Bookmark): number {
  return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
}
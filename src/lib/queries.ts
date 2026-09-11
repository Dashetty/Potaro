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

/** Loose key for comparing saved URLs: lowercase, no trailing slashes. */
export function urlKey(raw: string): string {
  return normalizeUrl(raw).toLowerCase().replace(/\/+$/, "");
}

/** Newest-first ordering shared by the library list and optimistic updates. */
export function compareNewestFirst(a: Bookmark, b: Bookmark): number {
  return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
}
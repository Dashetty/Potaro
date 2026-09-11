"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { normalizeUrl } from "@/lib/queries";
import type { Bookmark, BookmarkInput } from "@/lib/types";

export type ActionResult = { ok: boolean; error?: string; id?: string };

function cleanTags(tags: string[] | undefined): string[] {
  if (!tags) return [];
  return [...new Set(tags.map((t) => t.trim()).filter(Boolean))];
}

/** Map the Postgres unique-violation code to the action's conflict message. */
function urlConflict(
  error: { code?: string | null },
  message: string,
): ActionResult | null {
  return error.code === "23505" ? { ok: false, error: message } : null;
}

export async function addBookmark(
  input: BookmarkInput,
): Promise<ActionResult> {
  const supabase = await createClient();
  const url = normalizeUrl(input.url);

  if (!url) {
    return { ok: false, error: "A URL is required." };
  }

  const { data, error } = await supabase
    .from("bookmarks")
    .insert({
      url,
      title: input.title?.trim() || "",
      description: input.description?.trim() || null,
      favicon_url: input.favicon_url || null,
      tags: cleanTags(input.tags),
    })
    .select("id")
    .single();

  if (error) {
    return (
      urlConflict(error, "That URL is already saved.") ?? {
        ok: false,
        error: error.message,
      }
    );
  }

  revalidatePath("/");
  return { ok: true, id: data.id };
}

export async function updateBookmark(
  id: string,
  input: BookmarkInput,
): Promise<ActionResult> {
  const supabase = await createClient();
  const url = normalizeUrl(input.url);

  if (!url) {
    return { ok: false, error: "A URL is required." };
  }

  const { error } = await supabase
    .from("bookmarks")
    .update({
      url,
      title: input.title?.trim() || "",
      description: input.description?.trim() || null,
      favicon_url: input.favicon_url || null,
      tags: cleanTags(input.tags),
    })
    .eq("id", id);

  if (error) {
    return (
      urlConflict(error, "Another bookmark already uses that URL.") ?? {
        ok: false,
        error: error.message,
      }
    );
  }

  revalidatePath("/");
  return { ok: true };
}

export async function deleteBookmark(id: string): Promise<ActionResult> {
  const supabase = await createClient();

  const { error } = await supabase.from("bookmarks").delete().eq("id", id);

  if (error) {
    return { ok: false, error: error.message };
  }

  revalidatePath("/");
  return { ok: true };
}

/** Re-insert a deleted bookmark with its original id and created_at (Undo). */
export async function restoreBookmark(
  bookmark: Bookmark,
): Promise<ActionResult> {
  const supabase = await createClient();
  const url = normalizeUrl(bookmark.url);

  if (!url) {
    return { ok: false, error: "A URL is required." };
  }

  const { error } = await supabase.from("bookmarks").insert({
    id: bookmark.id,
    url,
    title: bookmark.title,
    description: bookmark.description,
    favicon_url: bookmark.favicon_url,
    tags: cleanTags(bookmark.tags),
    created_at: bookmark.created_at,
  });

  if (error) {
    return (
      urlConflict(error, "That URL is already saved.") ?? {
        ok: false,
        error: error.message,
      }
    );
  }

  revalidatePath("/");
  return { ok: true, id: bookmark.id };
}
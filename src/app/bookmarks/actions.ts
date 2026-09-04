"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { normalizeUrl } from "@/lib/queries";
import type { BookmarkInput } from "@/lib/types";

export type ActionResult = { ok: boolean; error?: string; id?: string };

function cleanTags(tags: string[] | undefined): string[] {
  if (!tags) return [];
  return [...new Set(tags.map((t) => t.trim()).filter(Boolean))];
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
    if (error.code === "23505") {
      return { ok: false, error: "That URL is already saved." };
    }
    return { ok: false, error: error.message };
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
    if (error.code === "23505") {
      return { ok: false, error: "Another bookmark already uses that URL." };
    }
    return { ok: false, error: error.message };
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
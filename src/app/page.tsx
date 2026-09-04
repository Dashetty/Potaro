import { createClient } from "@/lib/supabase/server";
import { collectTags, fetchAllBookmarks } from "@/lib/queries";
import { HomeClient } from "@/components/home-client";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const supabase = await createClient();
  const bookmarks = await fetchAllBookmarks(supabase);
  const existingTags = collectTags(bookmarks);

  return (
    <HomeClient
      initialBookmarks={bookmarks}
      existingTags={existingTags}
    />
  );
}
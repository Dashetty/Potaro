import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import { collectTags, fetchAllBookmarks } from "@/lib/queries";
import { HomeClient } from "@/components/home-client";
import { HomeLoading } from "@/components/home-loading";

export const dynamic = "force-dynamic";

export default function HomePage() {
  return (
    <Suspense fallback={<HomeLoading />}>
      <HomeData />
    </Suspense>
  );
}

/**
 * Kept separate so the fallback streams immediately: the route shell paints
 * while this awaits the auth/DB round-trips.
 */
async function HomeData() {
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

/**
 * Loading shell for the bookmark library.
 *
 * The page is dynamic (auth + Supabase), so this fallback paints the real
 * header, tag rail and card grid while the data resolves. It is rendered as a
 * Suspense fallback in `page.tsx` rather than a route-level `loading.tsx`, so
 * it applies to `/` only and never flashes over `/login` or the 404 page.
 */
export function HomeLoading() {
  return (
    <div
      role="status"
      aria-live="polite"
      className="page-shell flex w-full flex-col bg-background"
    >
      <span className="sr-only">Loading bookmarks…</span>

      <header className="relative z-10 px-5 pt-5 pb-3 md:px-8">
        <div className="grid grid-cols-2 items-center gap-x-3 gap-y-3 md:grid-cols-[1fr_minmax(12rem,28rem)_1fr]">
          <span className="col-span-2 inline-block select-none justify-self-center font-display text-4xl leading-none tracking-tight text-white [translate-y_1px] md:col-span-1 md:justify-self-start md:text-5xl">
            Potaro
          </span>

          <div className="col-span-2 min-w-0 md:col-span-1 md:col-start-2 md:row-start-1">
            <div className="h-11 rounded-full border border-border bg-white/5" />
          </div>

          <div className="hidden items-center justify-self-end gap-1.5 md:col-start-3 md:row-start-1 md:flex">
            <div className="h-9 w-24 rounded-md border border-border bg-white/5" />
            <div className="size-9 rounded-md border border-border bg-white/5" />
          </div>
        </div>
        <div
          aria-hidden="true"
          className="rule-dashed pointer-events-none absolute inset-x-0 bottom-0"
        />
      </header>

      <div className="border-b-2 border-pink-horror/50">
        <div className="flex flex-nowrap items-center justify-start gap-1.5 overflow-x-auto overscroll-x-contain px-5 py-2.5 scrollbar-none md:flex-wrap md:justify-center md:overflow-visible md:px-8">
          {Array.from({ length: 6 }).map((_, index) => (
            <div
              key={index}
              className="h-7 w-20 shrink-0 rounded-[3px] border border-white/10 bg-white/5"
            />
          ))}
        </div>
      </div>

      <main className="library-canvas flex w-full flex-1 flex-col bg-[#1a1619] px-5 pb-28 pt-4 md:px-8 md:pb-4">
        <div className="grid w-full grid-cols-1 gap-2 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 9 }).map((_, index) => (
            <div
              key={index}
              className="rounded-[5px] border border-border bg-card p-3"
            >
              <div className="flex items-center gap-2.5">
                <div className="size-8 shrink-0 rounded-[10px] bg-white/5" />
                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline gap-2">
                    <div className="h-3.5 flex-1 rounded-sm bg-white/10" />
                    <div className="h-3 w-10 shrink-0 rounded-sm bg-white/5" />
                  </div>
                  <div className="mt-2 h-2.5 w-3/4 rounded-sm bg-white/5" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </main>

      <div className="pointer-events-none fixed inset-x-0 bottom-0 z-40 flex justify-center px-4 pb-[env(safe-area-inset-bottom)] md:hidden">
        <div className="pointer-events-auto mb-4 h-14 w-40 rounded-full border-0 bg-card/45 shadow-[0_0_0_1px_oklch(1_0_0_/_0.1),0_8px_32px_-8px_oklch(0_0_0_/_0.55),inset_0_1px_0_0_oklch(1_0_0_/_0.06)] backdrop-blur-2xl backdrop-saturate-150" />
      </div>
    </div>
  );
}

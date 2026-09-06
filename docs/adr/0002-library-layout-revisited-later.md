# ADR-0002: Bookmark library layout — keep grid, revisit later

- **Status:** Deferred (accepted as "no change now")
- **Date:** 2026-09-06

## Context

A design interview ("grill-with-docs") was held about the bookmark library's
presentation. Today every bookmark is an identical full-width tile in a
responsive grid (`grid-cols-1 md:grid-cols-2 lg:grid-cols-3`), which reads as a
plain sequence on desktop and a plain stack on mobile. The request: "make it
something interesting."

Options surfaced in the interview:

1. **Editorial list rows** — full-width paper rows (large favicon block, title +
   description beside it, tags trailing); reads like a table of contents on both
   breakpoints.
2. **Masonry / mixed heights** — natural card heights flowing into columns (the
   vendored `infinite-masonry` block); ragged bottom edges.
3. **Mixed-size bento** — first bookmark featured large, rest tiled around it.
4. **Grouped stacks by domain/site** — one header per site, compact rows beneath.
5. **Restyle grid cards** — same tidy grid, richer individual tiles.

## Decision

Keep the current responsive grid for now. No layout code changed. Ordering
remains newest-first (the status quo). The user wants to defer this until the
rest of the redesign settles, then revisit with one of the options above.

## Consequences

- The single-column/two/three-column grid stays the canonical card layout.
- This ADR preserves the option space so a later session can pick up the
  redesign without re-running the interview.
- Card internals can still evolve independently (they already did: no hover
  tooltip, inline description, time at the title row) without touching layout.

# ADR-0003: Mobile bottom dock and slideable tag rail

- **Status:** Accepted
- **Date:** 2026-09-07

## Context

On phones, every primary action (Add, palette search, sign out) lives in the
top-right corner of the header — out of thumb reach one-handed — and the tag
strip wraps onto as many rows as there are tags, pushing the library down the
screen. beUI ships a macOS-style Dock (no hover dependency, 44px items) that
suits a fixed bottom action bar.

## Decision

Ship a mobile ergonomics pass. Every change is scoped below `md`; desktop is
unchanged.

- Vendor `@beui/dock` as `src/components/motion/dock.tsx` and mount it fixed
  at bottom-center (`z-40`, safe-area padding, hidden at `md` and up) with
  three items: Add (opens the Drawer), Search (opens the ⌘K palette), and
  Sign out — grouped with a separator before Sign out.
- Header Add and Sign out hide below `md`; the in-field ⌘K palette trigger is
  removed everywhere (the palette binds ⌘K itself; phones use the dock).
- The Tag Bar becomes its own component: on phones a single-line,
  start-aligned horizontal rail that scrolls exactly when chips overflow the
  width (no threshold constant), with a hidden scrollbar, gradient fades only
  on the edge that can scroll, and the active filter chip auto-scrolled into
  view. Ordering stays heaviest-tag-first (count desc, ties alphabetical).
  Desktop keeps the wrapped, centered bar.
- Toasts lift above the dock on phones; page content gets bottom padding so
  the last row clears the dock.

## Consequences

- Each breakpoint has exactly one action surface: the dock on phones, the
  header on desktop. No duplicated affordances.
- The dock is `z-40`, below the Drawer (`z-50`), toasts (`z-[90]`) and palette
  (`z-[100]`), so every overlay covers it while open.
- Edge fades are measured in JS (scroll listener + ResizeObserver), not pure
  CSS, because a static mask would fade chips even when the whole rail fits.
- Add/edit stays in the Drawer and delete stays in the card's context menu
  with the confirmation modal (ADR-0001) — the dock only launches the Drawer.
- The future Tag Index sidebar is unaffected: the rail is the mobile
  presentation of tag filtering until that lands.

# ADR-0001: Right-side drawer for add/edit bookmarks

- **Status:** Accepted
- **Date:** 2026-09-06

## Context

Adding or editing a bookmark used a centered bottom-anchored MorphingModal. The
desktop redesign moves creation flows out of centered dialogs and into a
side-mounted surface. Tag entry previously used a floating dropdown
(MultiSelect), which conflicts with the redesign's inline, chip-based tag
model. The persistent tag-index sidebar is a separate future component and must
not be conflated with this temporary panel.

## Decision

Replace the MorphingModal for add/edit with a right-side Drawer:

- `@beui/drawer` (vendored at `src/components/motion/drawer.tsx`), spring
  slide-in, backdrop blur, Esc-to-close, body scroll lock.
- Panel: full height, `rounded-sm`, ~440px wide on desktop (`sm:w-[440px]`),
  full width below 640px.
- Layout top to bottom: header ("Add bookmark"/"Edit bookmark") → scrollable
  fields (URL auto-focused with meta fetch, Title, Description, Tags) → sticky
  footer (Cancel + StatefulButton Save, idle → loading → success).
- Tags use a new inline component (`InlineTagInput`): Enter converts typed text
  into a chip inside the field, Backspace removes the last chip, and existing
  tags appear below as square chips (1px border, radius 0) filtered by the
  query. No floating dropdown in this flow.
- The same drawer opens pre-filled when editing.
- After a successful save the drawer springs out, a toast confirms, and the
  list updates in place — no navigation.
- Delete stays in the bookmark context menu with a small centered confirmation
  modal (MorphingModal). It does not move into the drawer.

The MultiSelect + TagMultiSelect primitives remain vendored but are unused by
this flow.

## Consequences

- One overlay pattern for entry (Drawer) and one for destructive confirmation
  (modal), which keeps the two intents visually distinct.
- Inline tag entry removes popover positioning/collision logic from the form
  flow entirely.
- `BookmarkForm` now owns the drawer's full interior (header/scroll/footer), so
  the form and the drawer shell must stay coupled.
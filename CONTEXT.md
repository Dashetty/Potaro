# Potaro — Context

A personal, single-user bookmark manager. Dark-mode-only, burgundy "black cherry"
aesthetic, deployed on Vercel. Stack: Next.js 16 (App Router) · TypeScript ·
Tailwind CSS v4 · Supabase (Postgres + Auth, RLS).

## Glossary

| Term | Meaning |
| --- | --- |
| Bookmark | A saved link with `url`, `title`, `description`, `favicon_url`, `tags`. |
| Tag | Free-form label on a bookmark, stored as a `text[]` value on the bookmark. |
| Tag Index | The *persistent* sidebar (not yet built) that lists all tags for browsing. Distinct from the Drawer — never merge the two. |
| Drawer | The *temporary* right-side overlay panel used to add or edit a bookmark (~440px on desktop, full width on mobile). Slides in/out with a spring, has a backdrop, closes on Esc or backdrop click. |
| Inline tag entry | The Drawer's tag input: typed text + Enter becomes a chip inside the field, Backspace removes the last chip, and matching existing tags appear below as square chips. No floating dropdown in this flow. |
| Delete flow | Lives in the bookmark card's context menu, confirmed in a small centered modal (MorphingModal). Deliberately *not* in the Drawer. |
| Add/Edit flow | The Drawer plus the BookmarkForm: header → URL (auto-focused, meta fetch) → Title → Description → Tags → sticky footer with Cancel + Save. |

## Domain docs

- ADRs: `docs/adr/`
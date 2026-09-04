# Potaro

A personal bookmark manager — a minimal, dark-mode-only clone of Shiori with a
burgundy "black cherry" aesthetic. Single user, private, deployed on Vercel.

**Stack:** Next.js 16 (App Router) · TypeScript · Tailwind CSS v4 · Supabase
(Postgres + Auth, RLS) · animated UI from [beUI](https://beui.dev).

## Features

- Add a URL → auto-fetches title, meta description, and favicon (Google favicon
  service, `/favicon.ico` fallback). Title/description are editable before and
  after saving; if fetching fails you can type a title manually.
- Free-form tags with autocomplete from your existing tags.
- Bookmark list (newest first) with favicon, title, domain, and tags.
- Search across title / URL / tags, plus click-a-tag filtering and a ⌘K palette.
- Edit and delete (with confirmation) via right-click / long-press.
- Fully responsive on phone and desktop.

## Supabase setup

1. Create a project at [supabase.com](https://supabase.com).
2. In the **SQL Editor**, run the migration in
   [`supabase/migrations/0001_init.sql`](supabase/migrations/0001_init.sql).
   It creates the `bookmarks` table and enables Row Level Security so only an
   authenticated user can read/write.
3. **Disable sign-ups:** Authentication → Providers → Email → turn off
   **Allow new users to sign up**.
4. **Create your account:** Authentication → Users → **Add user**. Enter your
   email and a password. This is the only account the app accepts.

## Environment variables

Copy `.env.example` to `.env.local` and fill in the values from
Supabase → **Settings → API**:

| Variable | Value |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Your project URL (`https://<ref>.supabase.co`) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Your anon / public key |

These are public-safe client keys — never put the service-role key in the app.

## Run locally

```bash
npm install
npm run dev
```

Open http://localhost:3000 and sign in with the account you created.

## Deploy to Vercel

1. Push this repo to GitHub.
2. In Vercel, **Import** the repo (framework auto-detected as Next.js).
3. Add the two environment variables above in Project → Settings → Environment
   Variables (for **Production**).
4. Deploy. The app is protected by Supabase Auth, so only your account can sign
   in.

## Notes

- **Dark mode only** — there is deliberately no light-mode toggle.
- The single `bookmarks` table holds everything: `id`, `url` (unique), `title`,
  `description`, `favicon_url`, `tags` (text[]), `created_at`, `updated_at`.
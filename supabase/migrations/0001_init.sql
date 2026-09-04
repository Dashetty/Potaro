-- Potaro: initial schema
-- Single-user bookmark manager. RLS grants access to any authenticated
-- user; sign-ups are disabled at the project level so the only account
-- that can authenticate is the owner's.

create extension if not exists "pgcrypto";

create table if not exists public.bookmarks (
  id uuid primary key default gen_random_uuid(),
  url text not null unique,
  title text not null default '',
  description text,
  favicon_url text,
  tags text[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Updated-at trigger so edits don't have to set it manually.
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists bookmarks_set_updated_at on public.bookmarks;
create trigger bookmarks_set_updated_at
  before update on public.bookmarks
  for each row
  execute function public.set_updated_at();

-- Row Level Security: only authenticated users can read/write.
alter table public.bookmarks enable row level security;

drop policy if exists "authenticated can select" on public.bookmarks;
create policy "authenticated can select"
  on public.bookmarks for select
  using (auth.uid() is not null);

drop policy if exists "authenticated can insert" on public.bookmarks;
create policy "authenticated can insert"
  on public.bookmarks for insert
  with check (auth.uid() is not null);

drop policy if exists "authenticated can update" on public.bookmarks;
create policy "authenticated can update"
  on public.bookmarks for update
  using (auth.uid() is not null)
  with check (auth.uid() is not null);

drop policy if exists "authenticated can delete" on public.bookmarks;
create policy "authenticated can delete"
  on public.bookmarks for delete
  using (auth.uid() is not null);
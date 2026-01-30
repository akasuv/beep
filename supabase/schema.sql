-- Beep schema for Supabase (Postgres)
--
-- Creates tables:
--   - identities
--   - posts
--   - replies
--
-- Notes:
-- - This file only defines tables/indexes/constraints.
-- - If you want RLS/policies, add them separately.

create table if not exists public.identities (
  id text primary key,
  public_key text not null unique,
  created_at timestamptz not null default now()
);

create table if not exists public.posts (
  id text primary key,
  author_id text not null references public.identities(id),
  content text not null,
  signature text not null,
  created_at timestamptz not null default now()
);

create index if not exists idx_posts_created_at on public.posts (created_at desc);

create table if not exists public.replies (
  id text primary key,
  post_id text not null references public.posts(id) on delete cascade,
  parent_id text references public.replies(id) on delete cascade,
  author_id text not null references public.identities(id),
  content text not null,
  signature text not null,
  created_at timestamptz not null default now(),
  depth integer not null default 0,
  constraint replies_depth_nonnegative check (depth >= 0)
);

create index if not exists idx_replies_post_id on public.replies (post_id);
create index if not exists idx_replies_parent_id on public.replies (parent_id);


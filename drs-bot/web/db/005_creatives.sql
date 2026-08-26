-- 005_creatives.sql — persistent, scope-based Creative Studio library.
-- Scope = a project id (e.g. 'DRS-GOA-900') or the literal 'GLOBAL' for
-- independent (no-project) creatives. Mirrors how chats are scoped.

create table if not exists creatives (
  id           text primary key,
  scope        text not null,                -- project id or 'GLOBAL'
  created_by   uuid,                         -- filled when auth is on; null otherwise
  kind         text not null default 'asset',-- 'asset' | 'card' | 'all-channel'
  channel      text,
  format       text,
  hook         text,
  objective    text,
  market       text,
  title        text,
  content      text,                         -- the written deliverable (copy)
  doc          jsonb default '{}'::jsonb,     -- editable creative: headline/sub/cta/url, element positions, bg, ratio, palette
  image_url    text,                         -- background image (Supabase Storage URL)
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create index if not exists creatives_scope_idx      on creatives (scope, updated_at desc);
create index if not exists creatives_created_by_idx  on creatives (created_by);

-- RLS: enabled, but permissive while auth is flagged off (anon key is used
-- client-side, same as chats). Tighten to (created_by = auth.uid()) once
-- NEXT_PUBLIC_AUTH_ENABLED is on.
alter table creatives enable row level security;

do $$ begin
  if not exists (select 1 from pg_policies where tablename='creatives' and policyname='creatives_all') then
    create policy creatives_all on creatives for all using (true) with check (true);
  end if;
end $$;

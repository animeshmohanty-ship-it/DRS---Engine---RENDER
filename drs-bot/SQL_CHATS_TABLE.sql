-- DRS Bot — shared Binny chat history (run once in Supabase → SQL Editor)
-- Chats become project-scoped and SHARED: any signed-in teammate who opens a
-- project sees its conversations. Scope = project id, or 'GLOBAL' for the
-- project-less "General" chat.

create table if not exists public.chats (
  id          text primary key,                    -- thread id from the client
  scope       text not null,                       -- project id or 'GLOBAL'
  title       text,
  messages    jsonb not null default '[]'::jsonb,
  created_by  uuid references public.profiles(id) on delete set null,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index if not exists chats_scope_updated_idx
  on public.chats (scope, updated_at desc);

alter table public.chats enable row level security;

-- Shared team access: any signed-in user can read and contribute to chats.
drop policy if exists "chats readable by authenticated" on public.chats;
create policy "chats readable by authenticated"
  on public.chats for select to authenticated using (true);

drop policy if exists "chats insertable by authenticated" on public.chats;
create policy "chats insertable by authenticated"
  on public.chats for insert to authenticated with check (true);

drop policy if exists "chats updatable by authenticated" on public.chats;
create policy "chats updatable by authenticated"
  on public.chats for update to authenticated using (true);

drop policy if exists "chats deletable by authenticated" on public.chats;
create policy "chats deletable by authenticated"
  on public.chats for delete to authenticated using (true);

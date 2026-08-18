-- DRS BRAIN — central RAG memory (run once in Supabase → SQL Editor)
-- Prereq: this enables the pgvector extension. Embeddings are 768-dim
-- (Vertex text-embedding-004).

create extension if not exists vector;

create table if not exists public.brain_chunks (
  id           uuid primary key default gen_random_uuid(),
  content      text not null,
  embedding    vector(768),
  status       text not null default 'experience' check (status in ('experience','verified','quarantined')),
  confidence   text check (confidence in ('Verified','Inferred','Assumption')),
  source       text,
  as_of_date   date,
  scope        text default 'drs',
  geo          text,
  market_type  text,
  model        text,
  visibility   text not null default 'internal' check (visibility in ('internal','external')),
  origin       text not null default 'upload' check (origin in ('upload','generation','chat','seed')),
  project_id   text,                       -- null = central brain; set = project-local overlay
  meta         jsonb not null default '{}'::jsonb,
  created_at   timestamptz not null default now()
);

create index if not exists brain_embedding_idx on public.brain_chunks using hnsw (embedding vector_cosine_ops);
create index if not exists brain_status_idx    on public.brain_chunks (status);
create index if not exists brain_project_idx   on public.brain_chunks (project_id);
create index if not exists brain_origin_idx     on public.brain_chunks (origin);

-- Semantic search: central brain (project_id is null) + the current project's overlay.
-- Quarantined chunks are never returned.
create or replace function public.match_brain_chunks(
  query_embedding vector(768),
  match_count     int  default 8,
  p_project_id    text default null
) returns table (
  id uuid, content text, status text, confidence text, source text,
  as_of_date date, scope text, geo text, market_type text, model text,
  visibility text, origin text, project_id text, similarity float
) language sql stable as $$
  select c.id, c.content, c.status, c.confidence, c.source, c.as_of_date,
         c.scope, c.geo, c.market_type, c.model, c.visibility, c.origin, c.project_id,
         1 - (c.embedding <=> query_embedding) as similarity
  from public.brain_chunks c
  where c.status <> 'quarantined'
    and (c.project_id is null or c.project_id = p_project_id)
  order by c.embedding <=> query_embedding
  limit match_count;
$$;

-- Server routes access the brain with the SERVICE ROLE key (bypasses RLS), so
-- RLS stays on with no policies → no anon/browser access to brain content.
alter table public.brain_chunks enable row level security;

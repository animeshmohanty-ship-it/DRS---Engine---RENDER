-- ============================================================================
-- DRS BOT — SOCIAL INTELLIGENCE  (run once in Supabase SQL editor)
-- Extends the scrape queue to route by platform, and adds a flexible store for
-- social records (ads / profiles / pages / posts / people) — these aren't
-- "touchpoints", so they live in their own table.
-- ============================================================================

-- Route jobs by platform (google = existing Maps collector; others = social)
alter table scrape_jobs add column if not exists platform text not null default 'google';

create table if not exists social_records (
  id         bigserial primary key,
  platform   text not null,              -- meta_ads | linkedin | instagram | facebook | twitter
  kind       text,                        -- ad | profile | page | post | person
  name       text,                        -- advertiser / person / page name
  handle     text,
  url        text,
  category   text,
  snippet    text,                        -- ad copy / bio / post text
  query      text,                        -- the search that found it
  country    text,
  meta       jsonb default '{}'::jsonb,
  fetched_at timestamptz default now(),
  unique (platform, url)
);
create index if not exists idx_social_platform_query on social_records (platform, query);
create index if not exists idx_social_platform on social_records (platform);

-- ============================================================================
-- DRS BOT — SCRAPE JOB QUEUE  (run once in Supabase SQL editor)
-- Lets the bot request dense touchpoint data without knowing where it comes from:
-- the bot writes a job here; a runner agent on the user's laptop picks it up,
-- runs the Google-Maps scraper, writes results into geo_touchpoints, marks done.
-- ============================================================================
create table if not exists scrape_jobs (
  id            bigserial primary key,
  country       text not null default 'India',
  state         text,
  city          text not null,
  category      text not null,             -- liquor | mrf | retail | horeca | ...
  query         text,                       -- optional explicit search string (else built from city+category)
  total         int  not null default 40,   -- results to collect
  status        text not null default 'pending',  -- pending | running | done | failed
  result_count  int  default 0,
  message       text,
  project_id    text,
  requested_at  timestamptz default now(),
  started_at    timestamptz,
  finished_at   timestamptz
);
create index if not exists idx_scrape_jobs_status on scrape_jobs (status, requested_at);

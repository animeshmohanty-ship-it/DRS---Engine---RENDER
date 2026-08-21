-- ============================================================================
-- DRS BOT — discovery filters  (run once in Supabase SQL editor)
-- Adds the two REAL search filters used by the Social Intelligence discovery
-- modes: region (country) and timelimit (recency bucket: d/w/m/y).
-- ============================================================================
alter table scrape_jobs add column if not exists region    text;
alter table scrape_jobs add column if not exists timelimit  text;

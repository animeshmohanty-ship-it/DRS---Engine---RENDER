-- ============================================================================
-- DRS BOT — VERIFIED DATA LAYER  (Phase 0 schema)
-- Run ONCE in the Supabase SQL editor (Dashboard → SQL → New query → paste → Run).
-- Safe to re-run: every statement is idempotent (IF NOT EXISTS).
--
-- Purpose: give the bot a store of REAL, SOURCED facts that offline workers fill
-- from authoritative datasets. The LLM then READS these tables and reasons on
-- top — it never invents population / religion / touchpoint data again.
-- ============================================================================

-- 1) Registry of every authoritative source + its freshness -------------------
create table if not exists data_sources (
  id           text primary key,          -- 'census_2011_c01' | 'shrug' | 'lgd' | 'osm' | 'overture' | 'scraper'
  name         text not null,
  url          text,
  license      text,
  cadence      text,                       -- 'once' | 'monthly' | 'weekly'
  last_run_at  timestamptz,
  last_status  text,                        -- 'ok' | 'failed' | 'flagged'
  notes        text
);

-- 2) Audit log of every ingestion attempt (who ran, what happened) ------------
create table if not exists ingest_runs (
  id            bigserial primary key,
  source_id     text references data_sources(id),
  started_at    timestamptz default now(),
  finished_at   timestamptz,
  status        text,                        -- 'ok' | 'failed' | 'flagged'
  rows_in       int  default 0,
  rows_written  int  default 0,
  rows_rejected int  default 0,
  message       text,
  details       jsonb default '{}'::jsonb
);

-- 3) Verified district-level facts (the District Intelligence table's truth) ---
create table if not exists geo_districts (
  id           bigserial primary key,
  country      text not null default 'India',
  state        text not null,
  district     text not null,
  lgd_code     text,                         -- universal join key across sources
  population   bigint,
  households   bigint,
  urban_pct    numeric,
  literacy_pct numeric,
  religions    jsonb,                         -- [{ "name":"Hindu","pct":95.1 }, ...] REAL per-district, from Census C-01
  level2_count int,                           -- blocks / taluks
  level3_count int,                           -- panchayats / wards
  extra        jsonb default '{}'::jsonb,     -- e.g. { "nightlights_income_proxy": ... } from SHRUG
  sources      jsonb default '{}'::jsonb,     -- per-field provenance: { "religions": {"source":"census_2011_c01","confidence":"Verified"} }
  updated_at   timestamptz default now(),
  unique (country, state, district)
);

-- 4) Verified touchpoints / POIs (Phase-2 Targeted Research) -------------------
create table if not exists geo_touchpoints (
  id         bigserial primary key,
  country    text not null default 'India',
  state      text,
  city       text not null,
  category   text not null,                   -- liquor|horeca|retail|mrf|school|mall|fuel|cinema|hotel
  name       text not null,
  address    text,
  lat        numeric,
  lon        numeric,
  phone      text,
  rating     numeric,
  source     text not null,                   -- 'osm' | 'overture' | 'scraper'
  meta       jsonb default '{}'::jsonb,
  fetched_at timestamptz default now(),
  unique (country, city, category, name, source)
);

create index if not exists idx_geo_districts_state     on geo_districts (country, state);
create index if not exists idx_geo_touchpoints_city_cat on geo_touchpoints (country, city, category);

-- Seed the source registry (idempotent) --------------------------------------
insert into data_sources (id, name, url, license, cadence, notes) values
  ('census_2011_c01', 'Census of India 2011 — C-01 Religion', 'https://github.com/datameet', 'Gov OpenData / mirror', 'once',   'District-level religion %. No live API — verified community mirror, cached.'),
  ('shrug',           'SHRUG — Development Data Lab',          'https://www.devdatalab.org/shrug', 'CC BY-NC-SA (non-commercial)', 'once', 'District/sub-district socioeconomic + nightlights income proxy.'),
  ('lgd',             'Local Government Directory',            'https://lgdirectory.gov.in/', 'Gov OpenData', 'monthly', 'Current admin-unit counts + LGD codes (join key).'),
  ('osm',             'OpenStreetMap via Overpass',            'https://overpass-api.de/', 'ODbL', 'weekly', 'Institutional touchpoints (fuel/schools/malls/hotels/supermarkets).'),
  ('overture',        'Overture Maps Places',                  'https://docs.overturemaps.org/', 'CDLA/ODbL', 'monthly', 'Retail/business touchpoint coverage-fill (OSM+Meta+MS).'),
  ('scraper',         'Crawlee scraper',                       null, 'n/a', 'on-demand', 'Gap categories OSM cannot cover: liquor / kirana / scrap-MRF.')
on conflict (id) do nothing;

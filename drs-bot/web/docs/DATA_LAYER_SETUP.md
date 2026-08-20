# DRS Bot — Verified Data Layer: one-time setup (Render + Supabase)

The data layer makes the bot read **real, sourced facts** instead of letting the
LLM invent them. Ingestion runs as background jobs; the bot only reads the tables.

There are exactly **three one-time setup steps** (none is recurring "manual data
work" — after this, everything refreshes itself).

---

## Step 1 — Create the tables (once, ~30 seconds)

Supabase Dashboard → **SQL Editor** → New query → paste the contents of
[`db/001_data_layer.sql`](../db/001_data_layer.sql) → **Run**.

Creates: `data_sources`, `ingest_runs`, `geo_districts`, `geo_touchpoints`
(all idempotent — safe to re-run).

## Step 2 — Add env vars

The worker reuses the bot's existing Supabase env (already set on Render):
`NEXT_PUBLIC_SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`.

Add one new (free) key for government open data:
- `DATA_GOV_IN_API_KEY` — get it free at https://data.gov.in → sign in → *My Account*.

Optional overrides:
- `OVERPASS_URL` — a self-hosted / mirror Overpass endpoint (defaults to the public one).

## Step 3 — Load the data + schedule refreshes (Render)

### First load (run each once, in order)
From a Render **Shell** (or locally with env set), inside `drs-bot/web`:

```bash
node worker/ingest.js census     # FIRST — district religion + names + population (Census 2011)
node worker/ingest.js shrug      # then — households + literacy (joins onto census by population)
node worker/ingest.js lgd        # then — official LGD codes (joins onto census by name)
node worker/ingest.js osm Chennai   # touchpoints for one city (repeat per city)
```

> Order matters: `census` builds the district rows (with names); `shrug` and
> `lgd` attach extra columns onto them. Running shrug/lgd before census errors
> out with a clear message.

Check results: Supabase → Table editor → `geo_districts`, and `ingest_runs`
for the audit log (status `ok` / `flagged` / `failed`).

### Keep it fresh (Render Cron Jobs — the "0 manual" part)
Render Dashboard → **New → Cron Job**, one per source. Command =
`node worker/ingest.js <source>`, Root Directory = `drs-bot/web`.

| Source  | Suggested schedule | Cron |
|---------|--------------------|------|
| `lgd`   | monthly            | `0 3 1 * *` |
| `census`| yearly (it's static) | `0 4 1 1 *` |
| `shrug` | yearly             | `0 5 1 1 *` |
| `osm <City>` | weekly, per priority city | `0 2 * * 0` |

Census 2011 is frozen data, so it effectively only needs loading once; the
yearly cron just re-confirms the mirror still matches.

---

## How it flows

```
worker/ingest.js  →  fetch source  →  validate (gate)  →  upsert geo_* tables
bot UI  →  /api/geodata (read)  →  District tab shows VERIFIED rows (badge)
LLM  →  reads the tables, reasons on top (never invents facts)
```

The **validation gate** (`lib/datalayer/validate.js`) blocks bad data — e.g. it
rejects a religion breakdown that is identical across every district (the
state-aggregate-copied-down bug). A flagged run still writes clean rows but marks
`ingest_runs.status = 'flagged'` for review.

## Phase 2 (scraper) note
The on-demand scraper (liquor / kirana / scrap-MRF, which OSM lacks) needs an
always-on **Render Background Worker** + `pg-boss` queue — documented separately
when Phase 2 lands.

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
`NEXT_PUBLIC_SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`. **Nothing else is required** —
Census / SHRUG / LGD / OSM all use open URLs with **no key, no cost**.

Optional:
- `DATA_GOV_IN_API_KEY` — only for *future* data.gov.in sources (free at https://data.gov.in → My Account).
- `OVERPASS_URL` — a mirror/self-hosted Overpass endpoint (defaults to the public one).

## Step 3 — Load the data (100% free — pick ONE way)

### Option A — Run locally, once (simplest; Census is frozen 2011 data)
On your laptop, inside `drs-bot/web`, with the two Supabase env vars set:

```bash
node worker/ingest.js census     # FIRST — religion + population + households + urban% + literacy (Census 2011)
node worker/ingest.js shrug      # then — refines literacy to official 7+ rate (joins by population)
node worker/ingest.js lgd        # then — official LGD district codes (joins by Census 2011 code)
node worker/ingest.js lgdunits   # then — sub-districts + blocks counts (joins by LGD code)
```

> Order matters: `census` builds the district rows (and fills most columns);
> `shrug`/`lgd`/`lgdunits` attach onto them. Result: ~100% coverage on every column.

### Option B — GitHub Actions (free, automated, "0 manual")
Repo → **Settings → Secrets and variables → Actions** → add `NEXT_PUBLIC_SUPABASE_URL`
and `SUPABASE_SERVICE_ROLE_KEY`. Then **Actions tab → "Data Layer Refresh" → Run
workflow** (or let the monthly cron run it). Defined in
[`.github/workflows/data-layer-refresh.yml`](../../../.github/workflows/data-layer-refresh.yml).
Free-tier minutes easily cover these seconds-long jobs. **No paid Render worker/cron.**

Verify either way: Supabase → Table editor → `geo_districts` (~640 rows) and
`ingest_runs` for the audit log (status `ok` / `flagged` / `failed`).

## Touchpoints — two free ways

1. **Live, from the bot** — GTM → Targeted Research → **Data Extractor**: type a
   city, click Extract. Pulls real named touchpoints from OpenStreetMap inside the
   normal web request (no worker). Best for fuel/schools/malls/hotels/supermarkets/cinemas.

2. **Gap categories (liquor / kirana / scrap-MRF)** — sparse in OSM. Run your local
   scraper (residential IP = no blocking, no proxy cost), then import its CSV:
   ```bash
   node worker/ingest.js import "path/to/scraped.csv::Coimbatore::liquor"
   ```
   Columns auto-map (name/address/phone/rating/lat/lon). Rows land in the same
   table and appear in the bot alongside the OSM ones.

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

## Cost note
Everything here runs on **free tiers only** — Supabase (existing), open data
sources (no key), the bot's existing Render web service, and free GitHub Actions.
There is **no paid Render worker, no queue, no proxy**. The one trade-off vs.
paying: the informal-retail scraper (gap categories) runs from your laptop /
GitHub Actions rather than live inside the bot — the bot always *displays*
whatever has been collected.

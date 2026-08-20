import { NextResponse } from 'next/server';
import { fetchOsmTouchpoints, OSM_CATEGORIES } from '../../../lib/datalayer/sources/osm.js';
import { upsertTouchpoints, getTouchpoints, dataLayerReady } from '../../../lib/datalayer/db.js';
import { validateTouchpoints } from '../../../lib/datalayer/validate.js';

export const dynamic = 'force-dynamic';
export const maxDuration = 120;

// Live touchpoint EXTRACTOR — runs inside the normal web request (no paid worker).
// One city + category per call (an OSM fetch is seconds). Fetches from OpenStreetMap,
// validates, upserts to geo_touchpoints, returns the rows.
//
// POST { city, category, state?, country? }
// Gap categories (liquor/kirana/mrf) are sparse in OSM — response says so and the
// local scraper import fills them.
const GAP = new Set(['liquor', 'mrf']);

export async function POST(req) {
  try {
    if (!dataLayerReady()) return NextResponse.json({ ok: false, disabled: true, rows: [] });
    const { city, category, state = null, country = 'India' } = (await req.json().catch(() => ({}))) || {};
    if (!city || !category) return NextResponse.json({ ok: false, error: 'city and category required' }, { status: 400 });
    if (!OSM_CATEGORIES.includes(category)) return NextResponse.json({ ok: false, error: `unknown category (use: ${OSM_CATEGORIES.join(', ')})` }, { status: 400 });

    let fetched = [], note = '';
    try {
      fetched = await fetchOsmTouchpoints({ city, category, state, country });
    } catch (e) {
      note = `OSM fetch issue: ${e.message}. `;
    }
    const { clean } = validateTouchpoints(fetched);
    if (clean.length) await upsertTouchpoints(clean);

    // Return the full stored set for this city+category (OSM + any imported scraper rows).
    const rows = await getTouchpoints({ country, city, category });
    if (GAP.has(category) && rows.length < 5) {
      note += `"${category}" is sparse in OpenStreetMap — run the local collector to fill it (see docs/DATA_LAYER_SETUP.md).`;
    }
    return NextResponse.json({ ok: true, city, category, added: clean.length, total: rows.length, note, rows });
  } catch (e) {
    return NextResponse.json({ ok: false, error: e.message, rows: [] }, { status: 500 });
  }
}

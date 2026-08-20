import { NextResponse } from 'next/server';
import { getDistricts, getTouchpoints, dataLayerReady } from '../../../lib/datalayer/db.js';

export const dynamic = 'force-dynamic';

// Read-only access to the VERIFIED data layer for the UI.
// POST { resource:'districts', country, state }  → verified district rows
// POST { resource:'touchpoints', country, city, category } → verified POIs
export async function POST(req) {
  try {
    if (!dataLayerReady()) return NextResponse.json({ ok: false, disabled: true, rows: [] });
    const { resource, country = 'India', state, city, category } = (await req.json().catch(() => ({}))) || {};
    if (resource === 'districts') {
      const rows = await getDistricts({ country, state });
      return NextResponse.json({ ok: true, resource, count: rows.length, rows });
    }
    if (resource === 'touchpoints') {
      const rows = await getTouchpoints({ country, city, category });
      return NextResponse.json({ ok: true, resource, count: rows.length, rows });
    }
    return NextResponse.json({ ok: false, error: 'unknown resource' }, { status: 400 });
  } catch (e) {
    return NextResponse.json({ ok: false, error: e.message, rows: [] }, { status: 500 });
  }
}

import { NextResponse } from 'next/server';
import { BRAIN_ENABLED } from '../../../../lib/brain/config.js';
import { supabaseAdmin } from '../../../../lib/brain/supabaseAdmin.js';

export const dynamic = 'force-dynamic';

// Lists what's in the Brain, grouped by source document.
export async function GET() {
  try {
    if (!BRAIN_ENABLED) return NextResponse.json({ ok: true, enabled: false, sources: [] });
    if (!supabaseAdmin) return NextResponse.json({ ok: true, enabled: true, connected: false, sources: [] });
    // Pull lightweight fields and aggregate by source (fine for thousands of rows).
    const { data, error } = await supabaseAdmin
      .from('brain_chunks')
      .select('source, status, origin, created_at')
      .limit(5000);
    if (error) throw error;
    const map = new Map();
    for (const r of (data || [])) {
      const key = r.source || '(untitled)';
      let g = map.get(key);
      if (!g) { g = { source: key, origin: r.origin, total: 0, verified: 0, experience: 0, quarantined: 0, lastAdded: r.created_at }; map.set(key, g); }
      g.total++;
      if (r.status === 'verified') g.verified++;
      else if (r.status === 'quarantined') g.quarantined++;
      else g.experience++;
      if (r.created_at && (!g.lastAdded || r.created_at > g.lastAdded)) g.lastAdded = r.created_at;
      // prefer a document origin label if mixed
      if (['upload', 'seed'].includes(r.origin)) g.origin = r.origin;
    }
    const sources = [...map.values()].sort((a, b) => (b.lastAdded || '').localeCompare(a.lastAdded || ''));
    return NextResponse.json({ ok: true, enabled: true, connected: true, count: sources.length, sources });
  } catch (e) {
    return NextResponse.json({ ok: false, error: e.message }, { status: 500 });
  }
}

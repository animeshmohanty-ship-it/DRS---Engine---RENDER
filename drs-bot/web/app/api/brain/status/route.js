import { NextResponse } from 'next/server';
import { BRAIN_ENABLED } from '../../../../lib/brain/config.js';
import { supabaseAdmin, HAS_SERVICE_ROLE } from '../../../../lib/brain/supabaseAdmin.js';

export const dynamic = 'force-dynamic';

// Lightweight health/summary for the Brain (counts by status/origin).
export async function GET() {
  try {
    if (!BRAIN_ENABLED) return NextResponse.json({ ok: true, enabled: false });
    if (!supabaseAdmin) return NextResponse.json({ ok: true, enabled: true, connected: false });
    const counts = {};
    for (const status of ['experience', 'verified', 'quarantined']) {
      const { count } = await supabaseAdmin.from('brain_chunks').select('id', { count: 'exact', head: true }).eq('status', status);
      counts[status] = count || 0;
    }
    const { count: total } = await supabaseAdmin.from('brain_chunks').select('id', { count: 'exact', head: true });
    return NextResponse.json({ ok: true, enabled: true, connected: true, hasServiceRole: HAS_SERVICE_ROLE, total: total || 0, byStatus: counts });
  } catch (e) {
    return NextResponse.json({ ok: false, error: e.message }, { status: 500 });
  }
}

import { NextResponse } from 'next/server';
import { brainReady } from '../../../../lib/brain/brain.js';
import { supabaseAdmin } from '../../../../lib/brain/supabaseAdmin.js';

export const dynamic = 'force-dynamic';

// Reset facts back to 'experience' so they get re-verified (with the current,
// softer rules). Default: requeue everything quarantined + everything already
// attempted-but-uncertain. Pass {source} to limit to one document.
export async function POST(req) {
  try {
    if (!brainReady()) return NextResponse.json({ ok: false, disabled: true });
    const { source, trust } = (await req.json().catch(() => ({}))) || {};

    // Trust-by-source: accept a curated authoritative document as verified
    // outright (no grounded re-check). Requires an explicit source.
    if (trust && source) {
      const { error, count } = await supabaseAdmin
        .from('brain_chunks')
        .update({ status: 'verified', confidence: 'Verified' }, { count: 'exact' })
        .eq('source', source);
      if (error) throw error;
      return NextResponse.json({ ok: true, trusted: count || 0, source });
    }

    // 1) quarantined → experience
    let q1 = supabaseAdmin.from('brain_chunks').update({ status: 'experience', meta: {} }, { count: 'exact' }).eq('status', 'quarantined');
    if (source) q1 = q1.eq('source', source);
    const { count: unq } = await q1;

    // 2) clear the verify_attempted flag on doc-sourced experience facts so they re-run
    let q2 = supabaseAdmin.from('brain_chunks').update({ meta: {} }, { count: 'exact' }).eq('status', 'experience').in('origin', ['upload', 'seed']);
    if (source) q2 = q2.eq('source', source);
    const { count: cleared } = await q2;

    return NextResponse.json({ ok: true, unquarantined: unq || 0, cleared: cleared || 0 });
  } catch (e) {
    return NextResponse.json({ ok: false, error: e.message }, { status: 500 });
  }
}

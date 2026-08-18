import { NextResponse } from 'next/server';
import { brainReady } from '../../../../lib/brain/brain.js';
import { supabaseAdmin } from '../../../../lib/brain/supabaseAdmin.js';

export const dynamic = 'force-dynamic';

// Delete every chunk of a source document from the Brain.
export async function POST(req) {
  try {
    if (!brainReady()) return NextResponse.json({ ok: false, disabled: true });
    const { source } = (await req.json()) || {};
    if (!source) return NextResponse.json({ ok: false, error: 'source required' }, { status: 400 });
    const { error, count } = await supabaseAdmin
      .from('brain_chunks')
      .delete({ count: 'exact' })
      .eq('source', source);
    if (error) throw error;
    return NextResponse.json({ ok: true, deleted: count || 0 });
  } catch (e) {
    return NextResponse.json({ ok: false, error: e.message }, { status: 500 });
  }
}

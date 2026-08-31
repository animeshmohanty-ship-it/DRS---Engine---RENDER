import { NextResponse } from 'next/server';
import { supabaseAdmin } from '../../../lib/brain/supabaseAdmin.js';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

// Upload a creative background to the 'creatives' Storage bucket using the
// service-role client (bypasses Storage RLS). POST { id, dataUrl } -> { ok, url }.
// On any failure returns ok:false so the client keeps the inline data URL.
export async function POST(req) {
  try {
    const { id, dataUrl } = await req.json();
    if (!id || !dataUrl || !/^data:/.test(dataUrl)) {
      return NextResponse.json({ ok: false, error: 'id and data URL required' }, { status: 400 });
    }
    if (!supabaseAdmin) return NextResponse.json({ ok: false, error: 'storage not configured' });

    const m = dataUrl.match(/^data:([^;]+);base64,(.*)$/);
    if (!m) return NextResponse.json({ ok: false, error: 'bad data URL' });
    const contentType = m[1] || 'image/png';
    const bytes = Buffer.from(m[2], 'base64');
    const ext = (contentType.split('/')[1] || 'png').replace('jpeg', 'jpg');
    const path = `${String(id).replace(/[^a-z0-9_-]/gi, '')}.${ext}`;

    const { error } = await supabaseAdmin.storage.from('creatives')
      .upload(path, bytes, { upsert: true, contentType });
    if (error) return NextResponse.json({ ok: false, error: error.message });

    const { data } = supabaseAdmin.storage.from('creatives').getPublicUrl(path);
    return NextResponse.json({ ok: true, url: data?.publicUrl || null });
  } catch (e) {
    return NextResponse.json({ ok: false, error: e.message }, { status: 500 });
  }
}

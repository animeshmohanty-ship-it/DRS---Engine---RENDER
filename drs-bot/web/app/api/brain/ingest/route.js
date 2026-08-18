import { NextResponse } from 'next/server';
import { ingest, brainReady } from '../../../../lib/brain/brain.js';

export const dynamic = 'force-dynamic';

export async function POST(req) {
  try {
    if (!brainReady()) return NextResponse.json({ ok: false, disabled: true, stored: 0 });
    const body = await req.json();
    const { text, source, origin, projectId, tags, status, confidence, asOfDate } = body || {};
    if (!text || !String(text).trim()) return NextResponse.json({ ok: false, error: 'text required' }, { status: 400 });
    const res = await ingest(text, { source, origin, projectId, tags, status, confidence, asOfDate });
    return NextResponse.json(res);
  } catch (e) {
    return NextResponse.json({ ok: false, error: e.message }, { status: 500 });
  }
}

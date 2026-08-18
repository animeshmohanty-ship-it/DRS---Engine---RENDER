import { NextResponse } from 'next/server';
import { recall, brainReady } from '../../../../lib/brain/brain.js';

export const dynamic = 'force-dynamic';

export async function POST(req) {
  try {
    if (!brainReady()) return NextResponse.json({ ok: false, disabled: true, results: [] });
    const { query, projectId, k } = (await req.json()) || {};
    if (!query) return NextResponse.json({ ok: false, error: 'query required' }, { status: 400 });
    const rows = await recall(query, { projectId, k });
    return NextResponse.json({ ok: true, count: rows.length, results: rows });
  } catch (e) {
    return NextResponse.json({ ok: false, error: e.message }, { status: 500 });
  }
}

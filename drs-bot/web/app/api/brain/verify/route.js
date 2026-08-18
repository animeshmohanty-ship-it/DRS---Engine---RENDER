import { NextResponse } from 'next/server';
import { verifyBatch } from '../../../../lib/brain/verify.js';

export const dynamic = 'force-dynamic';
export const maxDuration = 300;

// Promote corroborated experience-facts to verified. Call repeatedly (or on a
// schedule) to work through the backlog a batch at a time.
export async function POST(req) {
  try {
    const { limit } = (await req.json().catch(() => ({}))) || {};
    const res = await verifyBatch({ limit: limit || 8 });
    return NextResponse.json(res);
  } catch (e) {
    return NextResponse.json({ ok: false, error: e.message }, { status: 500 });
  }
}

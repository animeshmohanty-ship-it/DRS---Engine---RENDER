import { NextResponse } from 'next/server';
import * as gemini from '../../../lib/llm/gemini.js';

export const dynamic = 'force-dynamic';
export const maxDuration = 120;

// AI background for a creative. POST { prompt } → { ok, dataUrl }.
// Brand-styled prompt wrapper; on failure the client keeps the brand gradient.
export async function POST(req) {
  try {
    const { prompt = '' } = (await req.json().catch(() => ({}))) || {};
    if (!prompt.trim()) return NextResponse.json({ ok: false, error: 'prompt required' }, { status: 400 });
    const styled = `${prompt}. Clean, modern, optimistic advertising photograph/illustration for a Deposit Refund Scheme in Goa, India. Bright natural light, teal-and-green palette, plenty of empty negative space at the top and bottom for text overlay, no text, no logos, no watermarks.`;
    const { dataUrl } = await gemini.generateImage(styled);
    return NextResponse.json({ ok: true, dataUrl });
  } catch (e) {
    return NextResponse.json({ ok: false, error: e.message }, { status: 500 });
  }
}

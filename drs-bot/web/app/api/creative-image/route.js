import { NextResponse } from 'next/server';
import * as vertex from '../../../lib/llm/vertex.js';
import * as gemini from '../../../lib/llm/gemini.js';

export const dynamic = 'force-dynamic';
export const maxDuration = 120;

// AI background for a creative. POST { prompt, aspectRatio } → { ok, dataUrl }.
// Uses Vertex Imagen (real quota); falls back to the AI-Studio image model only
// if Vertex isn't configured. On any failure the client keeps the brand gradient.
export async function POST(req) {
  try {
    const { prompt = '', aspectRatio = '1:1' } = (await req.json().catch(() => ({}))) || {};
    if (!prompt.trim()) return NextResponse.json({ ok: false, error: 'prompt required' }, { status: 400 });
    const styled = `${prompt}. Clean, modern, optimistic advertising photograph for a Deposit Refund Scheme in Goa, India. Bright natural light, teal-and-green palette, plenty of empty negative space for text overlay, no text, no logos, no watermarks.`;
    try {
      const { dataUrl } = await vertex.generateImage(styled, { aspectRatio });
      return NextResponse.json({ ok: true, dataUrl, via: 'vertex' });
    } catch (ve) {
      // Fallback to AI-Studio image model if Vertex creds/quota aren't available.
      const { dataUrl } = await gemini.generateImage(styled);
      return NextResponse.json({ ok: true, dataUrl, via: 'gemini', note: `vertex: ${ve.message}` });
    }
  } catch (e) {
    return NextResponse.json({ ok: false, error: e.message }, { status: 500 });
  }
}

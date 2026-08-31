import { NextResponse } from 'next/server';
import * as vertex from '../../../lib/llm/vertex.js';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

// Draft a photo prompt RELEVANT to a specific slide's copy, so the image
// actually matches the message. POST { headline, body, market } -> { ok, prompt }.
export async function POST(req) {
  try {
    const { headline = '', body = '', market = '' } = await req.json();
    const place = market && !/goa/i.test(market) ? market : (market || 'India');
    const ask = `You are an art director for a Deposit Refund Scheme (bottle/can return) campaign in ${place}. Write ONE photo prompt for a photorealistic editorial lifestyle image that DIRECTLY illustrates this slide's message.

Slide headline: "${headline}"
Slide text: "${body}"

The prompt MUST depict a real, relatable moment that matches the message above — specific person/people (age + everyday clothing for ${place}), a specific everyday setting in ${place} (kirana store, market, home kitchen, college, street, etc.), and a clear action with empty plastic bottles or aluminium cans that fits the slide's point (returning, handing over, collecting, sorting, carrying back, etc.).
Style: 35mm, natural daylight, candid, warm optimistic, subtle teal/green tones. FULL-BLEED, edge-to-edge, uniformly sharp — NO blur, fade, vignette, or empty/soft borders.
Hard rules: NO machines, kiosks, bins or hardware; NO text; NO logos; single natural scene.
Return ONLY the prompt, 1-2 sentences, no preamble.`;
    const { text } = await vertex.generateGrounded(ask, { grounding: false, temperature: 0.6 });
    const prompt = (text || '').trim().replace(/^["']|["']$/g, '');
    if (!prompt || prompt.length < 20) return NextResponse.json({ ok: false, error: 'Could not draft a prompt' });
    return NextResponse.json({ ok: true, prompt });
  } catch (e) {
    return NextResponse.json({ ok: false, error: e.message }, { status: 500 });
  }
}

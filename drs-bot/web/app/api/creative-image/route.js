import { NextResponse } from 'next/server';
import * as vertex from '../../../lib/llm/vertex.js';
import * as gemini from '../../../lib/llm/gemini.js';

export const dynamic = 'force-dynamic';
export const maxDuration = 120;

// Strip any hardware/product references a brief may contain — we never render an
// invented machine/kiosk. Replace with a neutral action phrase.
function sanitizeBrief(s) {
  let t = String(s || '');
  const hardware = /\b(reverse[- ]?vending|vending machine|rvm|kiosk|machine|collection (?:point|bin|unit|kiosk)|bin|device|hardware|dispenser|terminal|booth structure)\b/gi;
  if (hardware.test(t)) t = t.replace(hardware, 'a person returning empty beverage bottles and cans');
  return t.trim();
}

// Turn a short/vague brief into a vivid, SPECIFIC photographic prompt so the
// image is relatable to the slide (the "smart" step). Falls back to the brief.
async function enhancePrompt(brief, place) {
  const ask = `You are an art director. Turn the idea below into ONE vivid, specific prompt for a PHOTOREALISTIC editorial lifestyle photograph for a beverage-container Deposit Refund Scheme campaign in ${place}.

Idea: "${brief}"

The prompt must specify: a specific relatable person or people (age, everyday clothing appropriate to ${place}), a specific real everyday setting in ${place} (name the kind of place — a local kirana store, a busy market street, a home kitchen, a college campus, a beach cleanup, etc.), and a clear action involving returning/collecting empty plastic bottles or aluminium cans. Style cues: shot on a 35mm lens, natural daylight, candid documentary feel, warm optimistic mood, subtle teal/green tones in the surroundings.
Composition rules (critical): a FULL-BLEED photograph that fills the ENTIRE frame edge to edge, uniformly sharp and evenly lit, subject well inside the frame. Absolutely NO blur, NO fade, NO vignette, NO white or soft borders, NO gradient edges, NO out-of-focus empty area, NO bokeh dead-zone on any side — the whole picture is a normal in-focus photo.
Hard rules: NO reverse-vending machines, kiosks, bins, devices or hardware of any kind; NO text or typography in the image; NO logos or watermarks; single natural scene, not a collage.
Return ONLY the final prompt, one or two sentences, no preamble.`;
  try {
    const { text } = await vertex.generateGrounded(ask, { grounding: false, temperature: 0.6 });
    const out = (text || '').trim().replace(/^["']|["']$/g, '');
    return out.length > 30 ? out : null;
  } catch { return null; }
}

// Try Nano Banana Pro (Gemini 3 Pro Image) first for quality, then 2.5 Flash
// Image, then AI-Studio. Each model id is configurable via env.
async function generateWithChain(prompt, aspectRatio) {
  const pro = process.env.VERTEX_IMAGE_MODEL_PRO || 'gemini-3-pro-image';
  const flash = process.env.VERTEX_IMAGE_MODEL || 'gemini-2.5-flash-image';
  const notes = [];
  for (const model of [pro, flash]) {
    try { const { dataUrl } = await vertex.generateImage(prompt, { aspectRatio, customModel: model }); return { dataUrl, via: `vertex:${model}`, notes }; }
    catch (e) { notes.push(`${model}: ${e.message}`); }
  }
  const { dataUrl } = await gemini.generateImage(prompt); // last resort
  return { dataUrl, via: 'gemini', notes };
}

// POST { prompt, aspectRatio, market, enhance? } → { ok, dataUrl, via }
export async function POST(req) {
  try {
    const { prompt = '', aspectRatio = '1:1', market = '', enhance = true } = (await req.json().catch(() => ({}))) || {};
    if (!prompt.trim()) return NextResponse.json({ ok: false, error: 'prompt required' }, { status: 400 });
    const place = market && !/goa/i.test(market) ? market : (market || 'India');
    const clean = sanitizeBrief(prompt);

    // 1) smart prompt enhancement
    let scene = clean;
    if (enhance) { const better = await enhancePrompt(clean, place); if (better) scene = sanitizeBrief(better); }

    // 2) technical wrapper (kept short so the enhanced scene leads)
    const styled = `${scene} — photorealistic, high detail, natural lighting, editorial advertising quality, full-frame edge-to-edge composition with uniform sharpness. No text, no logos, no watermarks, no machines or kiosks, no blur, no fade, no vignette, no soft or white borders.`;

    // 3) model chain (Pro → Flash → AI-Studio)
    const { dataUrl, via, notes } = await generateWithChain(styled, aspectRatio);
    return NextResponse.json({ ok: true, dataUrl, via, enhanced: scene !== clean, note: notes.join(' | ') || undefined });
  } catch (e) {
    return NextResponse.json({ ok: false, error: e.message }, { status: 500 });
  }
}

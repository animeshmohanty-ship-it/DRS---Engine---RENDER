import { NextResponse } from 'next/server';
import * as vertex from '../../../lib/llm/vertex.js';
import * as gemini from '../../../lib/llm/gemini.js';

export const dynamic = 'force-dynamic';
export const maxDuration = 120;

// AI background for a creative. POST { prompt, aspectRatio } → { ok, dataUrl }.
// Uses Vertex Imagen (real quota); falls back to the AI-Studio image model only
// if Vertex isn't configured. On any failure the client keeps the brand gradient.
// Strip any hardware/product references a copy brief may contain — we must never
// render an invented machine/kiosk. Replace with a neutral action phrase.
function sanitizeBrief(s) {
  let t = String(s || '');
  const hardware = /\b(reverse[- ]?vending|vending machine|rvm|kiosk|machine|collection (?:point|bin|unit|kiosk)|bin|device|hardware|dispenser|terminal|booth structure)\b/gi;
  if (hardware.test(t)) t = t.replace(hardware, 'a person returning empty beverage bottles and cans');
  return t.trim();
}

export async function POST(req) {
  try {
    const { prompt = '', aspectRatio = '1:1', market = '' } = (await req.json().catch(() => ({}))) || {};
    if (!prompt.trim()) return NextResponse.json({ ok: false, error: 'prompt required' }, { status: 400 });
    const place = market && !/goa/i.test(market) ? market : (market || 'India');
    const clean = sanitizeBrief(prompt);
    const styled = `${clean}. Clean, modern, optimistic lifestyle/advertising photograph about a beverage-container Deposit Refund Scheme in ${place}. Show people and place — someone returning empty bottles or cans, everyday circular-economy moments, a bright clean street/market. Blue-and-green (Recykal) palette, bright natural light, plenty of empty negative space for text overlay. ABSOLUTELY NO reverse-vending machines, kiosks, bins, devices or any product/hardware; NO text; NO logos or brand marks; NO watermarks.`;
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

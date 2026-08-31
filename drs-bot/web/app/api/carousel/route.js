import { NextResponse } from 'next/server';
import * as gemini from '../../../lib/llm/gemini.js';
import * as groq from '../../../lib/llm/groq.js';
import * as vertex from '../../../lib/llm/vertex.js';
import { getProvider } from '../../../lib/llm/provider.js';
import { buildCarouselPrompt, buildCarouselFromCopyPrompt } from '../../../lib/prompts/carousel.js';

export const dynamic = 'force-dynamic';
export const maxDuration = 120;

function parseJSON(s) {
  if (!s) return null;
  const m = String(s).replace(/```json/gi, '').replace(/```/g, '').match(/\{[\s\S]*\}/);
  if (!m) return null;
  for (const c of [m[0], m[0].replace(/,\s*([}\]])/g, '$1')]) { try { return JSON.parse(c); } catch {} }
  return null;
}

// POST { topic, slides, market, narrative, model } -> { ok, carousel:{title, slides:[...]} }
export async function POST(req) {
  try {
    const { topic = '', slides = 6, market = '', narrative = '', platform = 'instagram', approvedCopy = '', model: selectedModel } = await req.json();

    let llm = getProvider();
    const ml = (selectedModel || '').toLowerCase();
    let override = null;
    if (ml.startsWith('gemini-3') || ml === 'gemini-vertex') { llm = vertex; override = selectedModel; }
    else if (ml.startsWith('gemini')) { llm = gemini; override = selectedModel; }
    else if (ml.startsWith('llama') || ml.startsWith('groq')) { llm = groq; }
    const opts = override ? { customModel: override, grounding: false, jsonMode: true } : { grounding: false, jsonMode: true };

    const prompt = approvedCopy && approvedCopy.trim()
      ? buildCarouselFromCopyPrompt({ approvedCopy, market })
      : buildCarouselPrompt({ topic, slides, market, narrative, platform });
    let carousel = null, lastText = '';
    for (let i = 0; i < 2 && !carousel; i++) {
      try {
        const { text } = await llm.generateGrounded(prompt, opts);
        lastText = text || '';
        const j = parseJSON(lastText);
        if (j && Array.isArray(j.slides) && j.slides.length) carousel = j;
      } catch (e) { lastText = e.message; }
    }
    if (!carousel) return NextResponse.json({ ok: false, error: 'Could not generate the carousel — please retry.', rawText: lastText.slice(0, 400) });
    return NextResponse.json({ ok: true, carousel });
  } catch (e) {
    return NextResponse.json({ ok: false, error: e.message }, { status: 500 });
  }
}

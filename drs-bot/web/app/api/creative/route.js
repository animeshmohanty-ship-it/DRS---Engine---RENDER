import { NextResponse } from 'next/server';
import * as gemini from '../../../lib/llm/gemini.js';
import * as groq from '../../../lib/llm/groq.js';
import * as vertex from '../../../lib/llm/vertex.js';
import { getProvider } from '../../../lib/llm/provider.js';
import { buildCreativePrompt, buildCreativeAssetPrompt } from '../../../lib/prompts/creative.js';

export const dynamic = 'force-dynamic';
export const maxDuration = 120;

function parseJSON(s) {
  if (!s) return null;
  const m = String(s).replace(/```json/gi, '').replace(/```/g, '').match(/\{[\s\S]*\}/);
  if (!m) return null;
  for (const c of [m[0], m[0].replace(/,\s*([}\]])/g, '$1')]) { try { return JSON.parse(c); } catch {} }
  return null;
}

// Generate all-channel, brand-locked creative COPY (Phase B).
// POST { market, objective, narrative, focus, channels?, model? } → { ok, creative }
export async function POST(req) {
  try {
    const { market = '', objective = '', narrative = '', focus = '', channels = null, channel = '', format = '', hook = '', model: selectedModel } = await req.json();

    let llm = getProvider();
    const ml = (selectedModel || '').toLowerCase();
    let override = null;
    if (ml.startsWith('gemini-3') || ml === 'gemini-vertex') { llm = vertex; override = selectedModel; }
    else if (ml.startsWith('gemini')) { llm = gemini; override = selectedModel; }
    else if (ml.startsWith('llama') || ml.startsWith('groq')) { llm = groq; }
    const opts = override ? { customModel: override, grounding: false, jsonMode: true } : { grounding: false, jsonMode: true };

    // SINGLE-ASSET mode (per plan row / independent create) — has a format/hook.
    if (format || hook) {
      const prompt = buildCreativeAssetPrompt({ channel, format, hook, objective, market, narrative });
      const { text } = await llm.generateGrounded(prompt, opts);
      const asset = parseJSON(text);
      if (!asset) return NextResponse.json({ ok: false, error: 'Could not parse asset', rawText: (text || '').slice(0, 400) });
      return NextResponse.json({ ok: true, asset });
    }

    // ALL-CHANNEL mode (the Execute button).
    const prompt = buildCreativePrompt({ market, objective, narrative, focus, channels });
    const { text } = await llm.generateGrounded(prompt, opts);
    const creative = parseJSON(text);
    if (!creative) return NextResponse.json({ ok: false, error: 'Could not parse creative', rawText: (text || '').slice(0, 400) });
    return NextResponse.json({ ok: true, creative });
  } catch (e) {
    return NextResponse.json({ ok: false, error: e.message }, { status: 500 });
  }
}

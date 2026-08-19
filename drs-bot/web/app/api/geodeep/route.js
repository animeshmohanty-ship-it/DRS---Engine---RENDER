import { NextResponse } from 'next/server';
import * as gemini from '../../../lib/llm/gemini.js';
import * as groq from '../../../lib/llm/groq.js';
import * as vertex from '../../../lib/llm/vertex.js';
import { getProvider } from '../../../lib/llm/provider.js';
import { buildGeoDeepPrompt } from '../../../lib/prompts/geoDeep.js';
import { recallBlock, brainReady } from '../../../lib/brain/brain.js';
import { getSubdivisions, formatSubdivisionsSeed } from '../../../lib/opendata/wikidata.js';

export const dynamic = 'force-dynamic';
export const maxDuration = 120;

function parseJSON(s) {
  if (!s) return null;
  const m = String(s).match(/\{[\s\S]*\}/);
  if (!m) return null;
  for (const c of [m[0], m[0].replace(/,\s*([}\]])/g, '$1')]) { try { return JSON.parse(c); } catch {} }
  return null;
}

const RECALL = {
  economic: (i) => `${i.state || i.country} economy per capita income GSDP growth`,
  income: (i) => `${i.state || i.country} household income class distribution poverty affluent`,
  priority: (i) => `${i.state || i.country} largest cities corporations municipalities districts population priority`,
  districts: (i) => `${i.state || i.country} districts population households urban literacy taluks panchayats`,
  snapshot: (i) => `${i.state || i.country} population districts urban local bodies households literacy`,
  context: (i) => `${i.state || i.country} waste management plastic ban DRS pilot associations threats channelisation`,
  touchpoints: (i, o) => `${i.state || i.country} ${o?.category || ''} outlets stores count density`,
  narrative: (i) => `${i.state || i.country} DRS waste challenges solution thought leaders events`,
  awareness: (i) => `${i.state || i.country} DRS awareness benefits demos activation`,
};

export async function POST(req) {
  try {
    const { section, input = {}, projectId = null, opts = {}, model: selectedModel } = await req.json();
    if (!section) return NextResponse.json({ ok: false, error: 'section required' }, { status: 400 });

    // Pick provider (default), honour a Gemini/Vertex override.
    let llm = getProvider();
    const ml = (selectedModel || '').toLowerCase();
    let override = null;
    if (ml.startsWith('gemini-3') || ml === 'gemini-vertex') { llm = vertex; override = selectedModel; }
    else if (ml.startsWith('gemini')) { llm = gemini; override = selectedModel; }
    else if (ml.startsWith('llama') || ml.startsWith('groq')) { llm = groq; }

    const q = (RECALL[section] || RECALL.districts)(input, opts);
    const brain = brainReady() ? await recallBlock(q, { projectId, k: 10 }).catch(() => '') : '';

    // FREE open-data seed (Wikidata) — real subdivisions + populations, no key.
    let seed = '';
    if (['districts', 'priority', 'snapshot'].includes(section)) {
      const place = (input.state && !/national|whole country/i.test(input.state)) ? input.state : input.country;
      const rows = await getSubdivisions(place, { limit: 80 }).catch(() => []);
      seed = formatSubdivisionsSeed(rows);
    }
    const prompt = buildGeoDeepPrompt(section, input, brain + seed, opts);

    const { text, sources } = await llm.generateGrounded(
      prompt,
      override ? { customModel: override, grounding: true } : { grounding: true }
    );
    const data = parseJSON(text);
    if (!data) return NextResponse.json({ ok: false, error: 'Could not parse result', rawText: (text || '').slice(0, 400) });
    return NextResponse.json({ ok: true, section, data, sources: sources || [] });
  } catch (e) {
    return NextResponse.json({ ok: false, error: e.message }, { status: 500 });
  }
}

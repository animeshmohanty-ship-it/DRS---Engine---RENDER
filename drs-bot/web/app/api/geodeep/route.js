import { NextResponse } from 'next/server';
import * as gemini from '../../../lib/llm/gemini.js';
import * as groq from '../../../lib/llm/groq.js';
import * as vertex from '../../../lib/llm/vertex.js';
import { getProvider } from '../../../lib/llm/provider.js';
import { buildGeoDeepPrompt } from '../../../lib/prompts/geoDeep.js';
import { recallBlock, brainReady } from '../../../lib/brain/brain.js';
import { getSubdivisions, formatSubdivisionsSeed } from '../../../lib/opendata/wikidata.js';
import { getDistricts, formatDistrictsSeed } from '../../../lib/datalayer/db.js';

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

    // VERIFIED SNAPSHOT: for any state the data layer covers, compute the State
    // Snapshot directly from geo_districts (same source as the District table) so
    // the two can never disagree — no LLM. Falls through to LLM only when empty.
    if (section === 'snapshot') {
      const vstate = (input.state && !/national|whole country/i.test(input.state)) ? input.state : null;
      if (vstate) {
        const drows = await getDistricts({ country: input.country || 'India', state: vstate }).catch(() => []);
        if (drows.length) {
          const num = (f) => drows.reduce((s, r) => s + (Number(r[f]) || 0), 0);
          const pop = num('population'), hh = num('households');
          const litW = drows.reduce((s, r) => s + (Number(r.literacy_pct) || 0) * (Number(r.population) || 0), 0);
          const urbW = drows.reduce((s, r) => s + (Number(r.urban_pct) || 0) * (Number(r.households) || 0), 0);
          const fmt = (n) => (n ? n.toLocaleString('en-IN') : null);
          const snapshot = {
            population: fmt(pop),
            adminDivisions: `${drows.length} districts`,
            subDivisions: num('level2_count') || null,
            localBodies: num('level3_count') || null,
            households: fmt(hh),
            urbanPct: hh ? Math.round((urbW / hh) * 10) / 10 : null,
            literacyPct: pop ? Math.round((litW / pop) * 10) / 10 : null,
            confidence: 'Verified',
            _verified: true,
            source: 'Census 2011 / SHRUG / LGD',
          };
          return NextResponse.json({ ok: true, section, data: { snapshot }, sources: [] });
        }
      }
    }

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
    // VERIFIED data-layer seed — inject real district figures as ground truth so
    // downstream reasoning (ranking, snapshot, economics, narrative) is grounded
    // in sourced data and cites it, instead of the LLM inventing numbers.
    let verified = '';
    if (['snapshot', 'priority', 'economic', 'income', 'context', 'narrative'].includes(section)) {
      const vplace = (input.state && !/national|whole country/i.test(input.state)) ? input.state : null;
      if (vplace) {
        const drows = await getDistricts({ country: input.country || 'India', state: vplace }).catch(() => []);
        verified = formatDistrictsSeed(drows);
      }
    }
    const prompt = buildGeoDeepPrompt(section, input, brain + seed + verified, opts);

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

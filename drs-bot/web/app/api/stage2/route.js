import { NextResponse } from 'next/server';
import { getTouchpointUniverse } from '../../../lib/connectors/overpass.js';
import { getProvider } from '../../../lib/llm/provider.js';
import { buildStage2Prompt } from '../../../lib/prompts/stage2.js';

export const dynamic = 'force-dynamic';
export const maxDuration = 120;

function safeParseJSON(text) {
  if (!text) return null;
  // Strip code fences if the model added them, then extract the outermost object.
  const cleaned = text.replace(/```json/gi, '').replace(/```/g, '').trim();
  const start = cleaned.indexOf('{');
  const end = cleaned.lastIndexOf('}');
  if (start === -1 || end === -1) return null;
  try {
    return JSON.parse(cleaned.slice(start, end + 1));
  } catch {
    return null;
  }
}

export async function POST(req) {
  const t0 = Date.now();
  try {
    const input = await req.json();
    if (!input?.state) {
      return NextResponse.json({ ok: false, error: 'state is required' }, { status: 400 });
    }

    // 1. VERIFIED touchpoint universe from OpenStreetMap.
    const touchpoints = await getTouchpointUniverse(input.state);

    // 2. GROUNDED geography intelligence from the LLM (reasoning over the real counts).
    const llm = getProvider();
    const prompt = buildStage2Prompt(input, touchpoints);
    const { text, sources } = await llm.generateGrounded(prompt);
    const intel = safeParseJSON(text);

    return NextResponse.json({
      ok: true,
      input,
      touchpoints,
      intel,
      sources,
      rawText: intel ? undefined : text, // surface raw only if JSON parse failed
      ms: Date.now() - t0,
    });
  } catch (e) {
    return NextResponse.json(
      { ok: false, error: String(e?.message || e), ms: Date.now() - t0 },
      { status: 500 },
    );
  }
}

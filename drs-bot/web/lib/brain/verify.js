// Verification Agent — the automated gate (no human required).
// Takes experience-layer chunks and, using LIVE grounded search, decides whether
// each is corroborated. Corroborated → promote to 'verified'. Contradicted →
// 'quarantine'. Uncertain → left as 'experience' (usable as context, never truth).
//
// SAFEGUARD: we only auto-verify facts that came from uploaded/seed documents,
// NOT the bot's own generations/chats — so the Brain never "confirms" its own
// guesses (prevents feedback poisoning).
import { brainReady } from './brain.js';
import { supabaseAdmin } from './supabaseAdmin.js';
import * as vertex from '../llm/vertex.js';

function safeJSON(s) {
  if (!s) return null;
  const m = String(s).match(/\{[\s\S]*\}/);
  if (!m) return null;
  for (const c of [m[0], m[0].replace(/,\s*([}\]])/g, '$1')]) {
    try { return JSON.parse(c); } catch {}
  }
  return null;
}

async function verifyOne(chunk) {
  const today = new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
  const prompt = `You are a strict fact-verification agent for a Deposit Return System (DRS) knowledge base. Today is ${today}.
Using live web search, judge whether the CLAIM below is factually corroborated by credible, current sources.

CLAIM (source: ${chunk.source || 'unknown'}):
"""${String(chunk.content).slice(0, 2500)}"""

Rules:
- "corroborated" ONLY if credible current sources support it. Prefer sources < 12 months old.
- "contradicted" if sources clearly disagree or it is outdated/false.
- "uncertain" if you cannot confirm either way — do NOT guess.
- Confidence: "Verified" (directly corroborated), "Inferred" (reasonable from evidence), "Assumption" (weak/none).
Reply with STRICT JSON only:
{"verdict":"corroborated|contradicted|uncertain","confidence":"Verified|Inferred|Assumption","note":"one line"}`;
  try {
    const { text } = await vertex.generateGrounded(prompt, { grounding: true, temperature: 0 });
    const j = safeJSON(text);
    if (!j || !j.verdict) return { verdict: 'uncertain', confidence: 'Assumption' };
    return j;
  } catch (e) {
    return { verdict: 'uncertain', confidence: 'Assumption', note: e.message };
  }
}

// Process a batch of unverified, document-sourced chunks.
export async function verifyBatch({ limit = 8 } = {}) {
  if (!brainReady()) return { ok: false, skipped: true, processed: 0 };
  try {
    const { data, error } = await supabaseAdmin
      .from('brain_chunks')
      .select('id, content, source, origin, status')
      .eq('status', 'experience')
      .in('origin', ['upload', 'seed'])
      .limit(limit);
    if (error) throw error;
    const rows = data || [];
    let promoted = 0, quarantined = 0, left = 0;
    for (const chunk of rows) {
      const v = await verifyOne(chunk);
      if (v.verdict === 'corroborated') {
        await supabaseAdmin.from('brain_chunks').update({ status: 'verified', confidence: v.confidence || 'Verified' }).eq('id', chunk.id);
        promoted++;
      } else if (v.verdict === 'contradicted') {
        await supabaseAdmin.from('brain_chunks').update({ status: 'quarantined', confidence: v.confidence || 'Assumption', meta: { note: v.note || 'contradicted' } }).eq('id', chunk.id);
        quarantined++;
      } else {
        left++;
      }
    }
    return { ok: true, processed: rows.length, promoted, quarantined, left };
  } catch (e) {
    return { ok: false, error: e.message, processed: 0 };
  }
}

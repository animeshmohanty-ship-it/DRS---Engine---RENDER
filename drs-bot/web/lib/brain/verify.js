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
  const prompt = `You are a fact-verification agent for a Deposit Return System (DRS) knowledge base. Today is ${today}.
Using live web search, judge the CLAIM below.

CLAIM (source: ${chunk.source || 'unknown'}):
"""${String(chunk.content).slice(0, 2500)}"""

Rules (read carefully — do NOT over-reject):
- "corroborated" if credible sources support it. IMPORTANT: historical/baseline facts (e.g. a Census year figure) and data attributed to a NAMED AUTHORITATIVE source (national census, government statistics office, official economic survey, regulator) count as corroborated even if the figure is DATED — being old is NOT a reason to reject.
- "contradicted" is RARE — use it ONLY if the claim is demonstrably FALSE or fabricated. A figure that is simply OLD or SUPERSEDED by a newer number (e.g. a 2011 Census figure vs a current estimate) is NOT contradicted — it is valid historical/baseline data; mark it "corroborated" (if from a named authoritative source) or "uncertain", never contradicted. Do NOT mark contradicted merely because it is old, granular, superseded, or you can't find the exact number.
- "uncertain" if you cannot confirm or refute it (including granular figures you can't match exactly, or single-source internal claims). This keeps it as context — the SAFE default. When in doubt, choose "uncertain", NOT "contradicted".
- Confidence: "Verified" (directly corroborated or from a named authoritative source), "Inferred" (reasonable from evidence), "Assumption" (weak/none).
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
    // Pull a window of unverified doc-facts, newest first, and skip any we've
    // already tried (marked in meta) so repeated runs march forward instead of
    // re-checking the same "uncertain" facts.
    const { data, error } = await supabaseAdmin
      .from('brain_chunks')
      .select('id, content, source, origin, status, meta')
      .eq('status', 'experience')
      .in('origin', ['upload', 'seed'])
      .order('created_at', { ascending: false })
      .limit(80);
    if (error) throw error;
    const rows = (data || []).filter((r) => !(r.meta && r.meta.verify_attempted)).slice(0, limit);
    let promoted = 0, quarantined = 0, left = 0;
    for (const chunk of rows) {
      const v = await verifyOne(chunk);
      if (v.verdict === 'corroborated') {
        await supabaseAdmin.from('brain_chunks').update({ status: 'verified', confidence: v.confidence || 'Verified' }).eq('id', chunk.id);
        promoted++;
      } else if (v.verdict === 'contradicted') {
        await supabaseAdmin.from('brain_chunks').update({ status: 'quarantined', confidence: v.confidence || 'Assumption', meta: { ...(chunk.meta || {}), note: v.note || 'contradicted' } }).eq('id', chunk.id);
        quarantined++;
      } else {
        // Uncertain — leave as experience but mark attempted so we don't re-check it.
        await supabaseAdmin.from('brain_chunks').update({ meta: { ...(chunk.meta || {}), verify_attempted: true, note: v.note || 'uncertain' } }).eq('id', chunk.id);
        left++;
      }
    }
    const { count: remaining } = await supabaseAdmin.from('brain_chunks').select('id', { count: 'exact', head: true }).eq('status', 'experience').in('origin', ['upload', 'seed']);
    return { ok: true, processed: rows.length, promoted, quarantined, left, remainingExperience: remaining || 0 };
  } catch (e) {
    return { ok: false, error: e.message, processed: 0 };
  }
}

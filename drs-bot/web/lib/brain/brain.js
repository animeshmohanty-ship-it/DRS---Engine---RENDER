// DRS Brain — core: chunk, ingest (write to memory), recall (semantic search).
// Everything here fails SAFE: if the Brain is disabled or unreachable, ingest
// is a no-op and recall returns [] — the app is never affected.
import { BRAIN_ENABLED, RECALL_K, RECALL_MIN_SIMILARITY } from './config.js';
import { supabaseAdmin } from './supabaseAdmin.js';
import { embed, embedOne } from './embed.js';

export function brainReady() {
  return Boolean(BRAIN_ENABLED && supabaseAdmin);
}

// ---- Chunking: split on blank lines / markdown headings, pack to ~1000 chars ----
export function chunkText(text, target = 1000, maxChunks = 400) {
  const clean = String(text || '').replace(/\r\n/g, '\n').trim();
  if (!clean) return [];
  const blocks = clean.split(/\n(?=#{1,6}\s)|\n\s*\n/);
  const chunks = [];
  let buf = '';
  for (const b of blocks) {
    const block = b.trim();
    if (!block) continue;
    if ((buf + '\n\n' + block).length > target && buf) {
      chunks.push(buf.trim());
      buf = block;
    } else {
      buf = buf ? buf + '\n\n' + block : block;
    }
    // Hard-split any single oversized block
    while (buf.length > target * 1.8) {
      chunks.push(buf.slice(0, target).trim());
      buf = buf.slice(target);
    }
  }
  if (buf.trim()) chunks.push(buf.trim());
  return chunks.slice(0, maxChunks);
}

// ---- Ingest: write content into the Brain's experience layer ----
// opts: { source, origin, projectId, tags:{scope,geo,market_type,model,visibility}, status, confidence }
export async function ingest(text, opts = {}) {
  if (!brainReady()) return { ok: false, skipped: true, stored: 0 };
  try {
    const chunks = chunkText(text);
    if (!chunks.length) return { ok: true, stored: 0 };
    const vectors = await embed(chunks);
    const t = opts.tags || {};
    const rows = chunks.map((content, i) => ({
      content,
      embedding: vectors[i],
      status: opts.status || 'experience',
      confidence: opts.confidence || null,
      source: opts.source || null,
      as_of_date: opts.asOfDate || null,
      scope: t.scope || 'drs',
      geo: t.geo || null,
      market_type: t.market_type || null,
      model: t.model || null,
      visibility: t.visibility || 'internal',
      origin: opts.origin || 'upload',
      project_id: opts.projectId || null,
      meta: opts.meta || {},
    })).filter((r) => Array.isArray(r.embedding) && r.embedding.length);
    if (!rows.length) return { ok: true, stored: 0 };
    const { error } = await supabaseAdmin.from('brain_chunks').insert(rows);
    if (error) throw error;
    return { ok: true, stored: rows.length };
  } catch (e) {
    return { ok: false, error: e.message, stored: 0 };
  }
}

// ---- Recall: semantic search → relevant chunks (verified ranked, all labeled) ----
export async function recall(query, opts = {}) {
  if (!brainReady() || !query || !String(query).trim()) return [];
  try {
    const qv = await embedOne(String(query).slice(0, 4000));
    if (!qv.length) return [];
    const { data, error } = await supabaseAdmin.rpc('match_brain_chunks', {
      query_embedding: qv,
      match_count: opts.k || RECALL_K,
      p_project_id: opts.projectId || null,
    });
    if (error) throw error;
    const min = opts.minSimilarity ?? RECALL_MIN_SIMILARITY;
    let rows = (data || []).filter((r) => (r.similarity ?? 0) >= min);
    if (opts.externalOnly) rows = rows.filter((r) => r.visibility !== 'internal');
    // verified first, then by similarity
    rows.sort((a, b) => {
      const av = a.status === 'verified' ? 1 : 0;
      const bv = b.status === 'verified' ? 1 : 0;
      if (av !== bv) return bv - av;
      return (b.similarity ?? 0) - (a.similarity ?? 0);
    });
    return rows;
  } catch (e) {
    return [];
  }
}

// ---- Format recalled chunks into a labeled prompt block ----
export function formatRecallBlock(rows) {
  if (!rows || !rows.length) return '';
  const lines = rows.map((r) => {
    const status = r.status === 'verified'
      ? `Verified${r.confidence ? '/' + r.confidence : ''}`
      : 'Experience · unverified';
    const src = r.source ? ` · ${r.source}` : '';
    const dt = r.as_of_date ? ` · as of ${r.as_of_date}` : '';
    const ctx = [r.geo, r.market_type, r.model].filter(Boolean).join('/');
    const ctxs = ctx ? ` · context: ${ctx}` : '';
    return `- [${status}${src}${dt}${ctxs}] ${r.content}`;
  });
  return `

DRS BRAIN — recalled knowledge (Recykal's memory; use it, but obey these rules):
- DO NOT COPY THESE VERBATIM. Synthesize them into your own reasoning, and CROSS-CHECK against your live grounded search. If a recalled fact conflicts with fresher authoritative data, prefer the fresh data and note the discrepancy.
- Facts marked "Verified" are trusted anchors; "Experience · unverified" is context only — never present it as confirmed fact, and re-verify it before relying on it.
- Only use a recalled fact if it is genuinely RELEVANT to this specific task/geography; ignore the rest. Do not force-fit unrelated facts.
- CAPABILITY TRAVELS, TACTICS DON'T: a proven capability/precedent can be cited as evidence, but do NOT transplant a market-specific tactic; adapt to THIS project's market. If a fact's context differs from the target, say so.
- Never expose "internal"-scoped facts (financials, investors) in external-facing content.
${lines.join('\n')}`;
}

// Convenience: recall + format in one call.
export async function recallBlock(query, opts = {}) {
  const rows = await recall(query, opts);
  return formatRecallBlock(rows);
}

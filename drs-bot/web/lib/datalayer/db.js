// Verified data-layer DB helpers — all writes go through here.
// Uses the same server-side Supabase client as the Brain (service-role).
import { supabaseAdmin } from '../brain/supabaseAdmin.js';

export function dataLayerReady() {
  return Boolean(supabaseAdmin);
}

// ---- Ingest-run audit log ---------------------------------------------------
export async function startRun(sourceId) {
  if (!supabaseAdmin) return null;
  const { data } = await supabaseAdmin
    .from('ingest_runs')
    .insert({ source_id: sourceId, status: 'running' })
    .select('id')
    .single();
  return data?.id ?? null;
}

export async function finishRun(runId, { status, rowsIn = 0, rowsWritten = 0, rowsRejected = 0, message = '', details = {} }) {
  if (!supabaseAdmin) return;
  if (runId != null) {
    await supabaseAdmin.from('ingest_runs').update({
      finished_at: new Date().toISOString(),
      status, rows_in: rowsIn, rows_written: rowsWritten, rows_rejected: rowsRejected,
      message: String(message).slice(0, 2000), details,
    }).eq('id', runId);
  }
}

export async function touchSource(sourceId, status) {
  if (!supabaseAdmin) return;
  await supabaseAdmin.from('data_sources')
    .update({ last_run_at: new Date().toISOString(), last_status: status })
    .eq('id', sourceId);
}

// ---- Districts --------------------------------------------------------------
// Upsert on (country,state,district). Merges the given fields; leaves others.
export async function upsertDistricts(rows) {
  if (!supabaseAdmin || !rows?.length) return { written: 0 };
  let written = 0;
  // chunk to keep payloads sane
  for (let i = 0; i < rows.length; i += 200) {
    const batch = rows.slice(i, i + 200).map((r) => ({
      country: r.country || 'India',
      state: r.state,
      district: r.district,
      ...(r.lgd_code != null ? { lgd_code: r.lgd_code } : {}),
      ...(r.population != null ? { population: r.population } : {}),
      ...(r.households != null ? { households: r.households } : {}),
      ...(r.urban_pct != null ? { urban_pct: r.urban_pct } : {}),
      ...(r.literacy_pct != null ? { literacy_pct: r.literacy_pct } : {}),
      ...(r.religions != null ? { religions: r.religions } : {}),
      ...(r.level2_count != null ? { level2_count: r.level2_count } : {}),
      ...(r.level3_count != null ? { level3_count: r.level3_count } : {}),
      ...(r.extra != null ? { extra: r.extra } : {}),
      ...(r.sources != null ? { sources: r.sources } : {}),
      updated_at: new Date().toISOString(),
    }));
    const { error, count } = await supabaseAdmin
      .from('geo_districts')
      .upsert(batch, { onConflict: 'country,state,district', count: 'exact' });
    if (error) throw error;
    written += count ?? batch.length;
  }
  return { written };
}

// Normalize a state name for matching: lowercase, & → and, strip punctuation.
const canonState = (s) => String(s || '').toLowerCase().replace(/&/g, 'and').replace(/[^a-z]+/g, ' ').trim();

// Modern name / common variant → the name as stored (Census 2011 vintage).
const STATE_ALIASES = {
  'odisha': 'orissa',
  'puducherry': 'pondicherry',
  'delhi': 'nct of delhi',
  'uttaranchal': 'uttarakhand',
  // Telangana (formed 2014) — its districts live under Andhra Pradesh in 2011 data.
  'telangana': 'andhra pradesh',
};

export async function getDistricts({ country = 'India', state } = {}) {
  if (!supabaseAdmin) return [];
  const { data } = await supabaseAdmin
    .from('geo_districts').select('*').eq('country', country)
    .order('population', { ascending: false, nullsFirst: false });
  let rows = data || [];
  if (state) {
    const target = STATE_ALIASES[canonState(state)] || canonState(state);
    rows = rows.filter((r) => canonState(r.state) === target);
  }
  return rows;
}

// ---- Touchpoints ------------------------------------------------------------
export async function upsertTouchpoints(rows) {
  if (!supabaseAdmin || !rows?.length) return { written: 0 };
  let written = 0;
  for (let i = 0; i < rows.length; i += 200) {
    const batch = rows.slice(i, i + 200);
    const { error, count } = await supabaseAdmin
      .from('geo_touchpoints')
      .upsert(batch, { onConflict: 'country,city,category,name,source', count: 'exact' });
    if (error) throw error;
    written += count ?? batch.length;
  }
  return { written };
}

export async function getTouchpoints({ country = 'India', city, category } = {}) {
  if (!supabaseAdmin) return [];
  let q = supabaseAdmin.from('geo_touchpoints').select('*').eq('country', country);
  if (city) q = q.eq('city', city);
  if (category) q = q.eq('category', category);
  const { data } = await q.limit(2000);
  return data || [];
}

// ---- Prompt seed: verified districts as GROUND TRUTH for the LLM -------------
// Turns verified rows into an authoritative block the reasoning prompts consume,
// so priority/snapshot/economic/narrative reason over REAL figures and cite them.
export function formatDistrictsSeed(rows) {
  if (!rows?.length) return '';
  const n = (v) => (v != null ? Number(v).toLocaleString('en-IN') : '?');
  const lines = rows.slice(0, 45).map((r) => {
    const rel = Array.isArray(r.religions) && r.religions.length
      ? `; religion: ${r.religions.map((x) => `${x.name} ${x.pct}%`).join(', ')}` : '';
    const lit = r.literacy_pct != null ? `, literacy ${r.literacy_pct}%` : '';
    const hh = r.households != null ? `, ${n(r.households)} HH` : '';
    return `- ${r.district}: pop ${n(r.population)}${hh}${lit}${rel}`;
  });
  const totalPop = rows.reduce((s, r) => s + (Number(r.population) || 0), 0);
  return `

VERIFIED DISTRICT DATA (${rows.length} districts, total pop ${totalPop.toLocaleString('en-IN')} — from the DRS data layer: Census 2011 / SHRUG / LGD). Treat these as GROUND TRUTH: reason, rank, and total using THESE exact figures, attribute them to "Census 2011 / SHRUG", and NEVER invent, round away, or override them with guesses:
${lines.join('\n')}`;
}

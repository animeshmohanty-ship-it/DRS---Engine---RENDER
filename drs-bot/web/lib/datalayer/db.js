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

export async function getDistricts({ country = 'India', state } = {}) {
  if (!supabaseAdmin) return [];
  let q = supabaseAdmin.from('geo_districts').select('*').eq('country', country).order('population', { ascending: false, nullsFirst: false });
  if (state) q = q.eq('state', state);
  const { data } = await q;
  return data || [];
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

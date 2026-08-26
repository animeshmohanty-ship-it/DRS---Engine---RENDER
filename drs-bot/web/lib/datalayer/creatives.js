// Scope-based Creative Studio persistence.
// Scope = a project id (e.g. 'DRS-GOA-900') or 'GLOBAL' for independent creatives.
// Client-side via the shared supabase anon client (same pattern as chats), with a
// localStorage fallback so the studio works even before the table/bucket exist.
import { supabase } from '../supabase.js';

const LS_KEY = (scope) => 'drs_creatives_' + scope;
const BUCKET = 'creatives';

function lsGet(scope) {
  try { return JSON.parse(localStorage.getItem(LS_KEY(scope)) || '[]'); } catch { return []; }
}
function lsSet(scope, rows) {
  try { localStorage.setItem(LS_KEY(scope), JSON.stringify(rows)); } catch {}
}
function lsUpsert(scope, row) {
  const rows = lsGet(scope);
  const i = rows.findIndex((r) => r.id === row.id);
  if (i >= 0) rows[i] = { ...rows[i], ...row }; else rows.unshift(row);
  lsSet(scope, rows);
}
function lsDelete(scope, id) { lsSet(scope, lsGet(scope).filter((r) => r.id !== id)); }

export function newCreativeId() {
  return 'cr_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

// Fetch all creatives for a scope, newest first.
export async function loadCreatives(scope) {
  if (!scope) return [];
  try {
    const { data, error } = await supabase
      .from('creatives').select('*').eq('scope', scope).order('updated_at', { ascending: false });
    if (error) throw error;
    return (data || []).map(fromRow);
  } catch (e) {
    return lsGet(scope);
  }
}

// Insert or update one creative. Returns the saved record.
export async function saveCreative(scope, rec) {
  const now = new Date().toISOString();
  const row = { ...rec, scope, updated_at: now, created_at: rec.created_at || now };
  try {
    const { data, error } = await supabase
      .from('creatives').upsert(toRow(row), { onConflict: 'id' }).select().single();
    if (error) throw error;
    const saved = fromRow(data);
    lsUpsert(scope, saved); // keep a local mirror
    return saved;
  } catch (e) {
    lsUpsert(scope, row);
    return row;
  }
}

export async function deleteCreative(scope, id) {
  try { await supabase.from('creatives').delete().eq('id', id); } catch {}
  lsDelete(scope, id);
}

// Upload a data-URL / blob background to Storage; return a public URL.
// Falls back to returning the original dataUrl if Storage isn't available.
export async function uploadCreativeImage(id, dataUrl) {
  if (!dataUrl) return null;
  if (!/^data:/.test(dataUrl)) return dataUrl; // already a URL
  try {
    const blob = await (await fetch(dataUrl)).blob();
    const ext = (blob.type.split('/')[1] || 'png').replace('jpeg', 'jpg');
    const path = `${id}.${ext}`;
    const { error } = await supabase.storage.from(BUCKET).upload(path, blob, { upsert: true, contentType: blob.type });
    if (error) throw error;
    const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
    return data?.publicUrl || dataUrl;
  } catch (e) {
    return dataUrl; // keep the base64 inline if the bucket isn't set up yet
  }
}

function toRow(r) {
  return {
    id: r.id, scope: r.scope, created_by: r.created_by || null,
    kind: r.kind || 'asset', channel: r.channel || null, format: r.format || null,
    hook: r.hook || null, objective: r.objective || null, market: r.market || null,
    title: r.title || null, content: r.content || null,
    doc: r.doc || {}, image_url: r.image_url || null,
    created_at: r.created_at, updated_at: r.updated_at,
  };
}
function fromRow(r) {
  return {
    id: r.id, scope: r.scope, created_by: r.created_by,
    kind: r.kind, channel: r.channel, format: r.format, hook: r.hook,
    objective: r.objective, market: r.market, title: r.title, content: r.content,
    doc: r.doc || {}, image_url: r.image_url,
    created_at: r.created_at, updated_at: r.updated_at,
  };
}
